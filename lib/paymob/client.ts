// lib/paymob/client.ts
// All Paymob API calls — Intention API, MIT for renewals, HMAC verification

import { createHmac } from 'crypto'

const PAYMOB_API_URL = 'https://accept.paymob.com/v1'
const SECRET_KEY     = process.env.PAYMOB_SECRET_KEY!
const HMAC_SECRET    = process.env.PAYMOB_HMAC_SECRET!

// ─── PLAN DEFINITIONS ────────────────────────────────────
// Paymob uses Integration IDs (not price IDs like Paddle)
// Each payment method has its own integration ID from your dashboard

export const PLANS = {
  premium_monthly: {
    integrationId: process.env.PAYMOB_INTEGRATION_ID_CARD!,
    amount:        299,   // EGP cents — 2.99 EGP (or set to 14900 for 149 EGP)
    currency:      'EGP',
    label:         'Premium Monthly',
    intervalDays:  30,
  },
  premium_yearly: {
    integrationId: process.env.PAYMOB_INTEGRATION_ID_CARD!,
    amount:        124900, // 1249 EGP in cents
    currency:      'EGP',
    label:         'Premium Yearly',
    intervalDays:  365,
  },
} as const

export type PlanKey = keyof typeof PLANS

// ─── THEME PRICES ─────────────────────────────────────────
// One-time purchases — independent of premium subscription
// Update amounts (in EGP cents) to match your pricing

export const THEME_PRICES: Record<string, { amount: number; currency: string; label: string; labelAr: string }> = {
  'makkah-gold':  { amount: 4900, currency: 'EGP', label: 'Makkah Gold Theme',       labelAr: 'ثيم ذهب مكة'        },
  'jannah-green': { amount: 4900, currency: 'EGP', label: 'Garden of Jannah Theme',   labelAr: 'ثيم روضة الجنة'     },
  'desert-sand':  { amount: 4900, currency: 'EGP', label: 'Desert Sand Theme',        labelAr: 'ثيم رمال الصحراء'   },
  'fajr-blue':    { amount: 4900, currency: 'EGP', label: 'Fajr Blue Theme',          labelAr: 'ثيم أزرق الفجر'     },
  'rose-ramadan': { amount: 4900, currency: 'EGP', label: 'Rose Ramadan Theme',       labelAr: 'ثيم وردة رمضان'     },
  'eid-special':  { amount: 4900, currency: 'EGP', label: 'Eid Special Theme',        labelAr: 'ثيم خاص العيد'      },
}

// ─── CREATE PAYMENT INTENTION ─────────────────────────────
// Called from checkout API route — creates the intention, returns client_secret

export async function createPaymentIntention({
  planKey,
  userId,
  userEmail,
  userName,
  phone,
  notificationUrl,
  redirectionUrl,
}: {
  planKey:         PlanKey
  userId:          string
  userEmail:       string
  userName:        string
  phone:           string
  notificationUrl: string
  redirectionUrl:  string
}) {
  const plan = PLANS[planKey]

  const body = {
    amount:          plan.amount,
    currency:        plan.currency,
    payment_methods: [plan.integrationId],
    items: [{
      name:     plan.label,
      amount:   plan.amount,
      quantity: 1,
    }],
    billing_data: {
      first_name:   userName.split(' ')[0] || userName,
      last_name:    userName.split(' ').slice(1).join(' ') || 'User',
      email:        userEmail,
      phone_number: phone || '+201000000000',
      // Required by Paymob — placeholder for non-Egyptian addresses
      apartment:    'NA',
      floor:        'NA',
      street:       'NA',
      building:     'NA',
      city:         'NA',
      country:      'NA',
      state:        'NA',
    },
    extras: {
      userId,
      planKey,
    },
    special_reference: `${userId}-${planKey}-${Date.now()}`,
    notification_url:  notificationUrl,
    redirection_url:   redirectionUrl,
    // Save card for future MIT renewals
    // Note: request_token is set per integration in Paymob dashboard
  }

  const res = await fetch(`${PAYMOB_API_URL}/intention/`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Token ${SECRET_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Paymob createIntention failed: ${res.status} — ${err}`)
  }

  const data = await res.json()

  return {
    intentionId:  data.id as string,
    clientSecret: data.client_secret as string,
    orderId:      data.intention_order_id as number,
  }
}

// ─── MIT — MERCHANT INITIATED TRANSACTION ─────────────────
// Used for automatic subscription renewals using saved card token

export async function chargeWithSavedToken({
  cardToken,
  integrationId,
  amount,
  currency,
  userId,
  planKey,
  notificationUrl,
}: {
  cardToken:       string
  integrationId:   string
  amount:          number
  currency:        string
  userId:          string
  planKey:         PlanKey
  notificationUrl: string
}) {
  const body = {
    source:     { identifier: cardToken, subtype: 'TOKEN' },
    payment_token: await generatePaymentToken({ integrationId, amount, currency }),
    billing_data: {
      apartment: 'NA', floor: 'NA', street: 'NA',
      building: 'NA', city: 'NA', country: 'NA', state: 'NA',
      first_name: 'Subscriber', last_name: 'Renewal',
      email: 'renewal@yawmiyyati.com', phone_number: '+201000000000',
    },
  }

  const res = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Paymob MIT charge failed: ${res.status} — ${err}`)
  }

  return res.json()
}

// ─── PAYMENT TOKEN (for MIT) ──────────────────────────────
// Paymob's legacy flow: auth token → order → payment token
// Required for MIT charges with saved tokens

async function generatePaymentToken({
  integrationId,
  amount,
  currency,
}: {
  integrationId: string
  amount: number
  currency: string
}) {
  // Step 1: Get auth token
  const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  })
  const authData = await authRes.json()
  const authToken = authData.token as string

  // Step 2: Create order
  const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      auth_token:       authToken,
      delivery_needed: false,
      amount_cents:    amount,
      currency,
      items: [],
    }),
  })
  const orderData = await orderRes.json()
  const orderId = orderData.id as number

  // Step 3: Get payment key (token)
  const pkRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      auth_token:     authToken,
      amount_cents:   amount,
      expiration:     3600,
      order_id:       orderId,
      billing_data: {
        apartment: 'NA', floor: 'NA', street: 'NA',
        building:  'NA', city: 'NA', country: 'NA', state: 'NA',
        first_name: 'Renewal', last_name: 'Charge',
        email: 'renewal@yawmiyyati.com', phone_number: '+201000000000',
      },
      currency,
      integration_id: integrationId,
      lock_order_when_paid: false,
    }),
  })
  const pkData = await pkRes.json()
  return pkData.token as string
}

// ─── HMAC VERIFICATION ────────────────────────────────────
// Paymob uses HMAC-SHA512 to sign webhook callbacks
// Transaction callback HMAC fields (in lexicographic order):

const TRANSACTION_HMAC_KEYS = [
  'amount_cents', 'created_at', 'currency', 'error_occured',
  'has_parent_transaction', 'id', 'integration_id', 'is_3d_secure',
  'is_auth', 'is_capture', 'is_refunded', 'is_standalone_payment',
  'is_voided', 'order.id', 'owner', 'pending', 'source_data.pan',
  'source_data.sub_type', 'source_data.type', 'success',
] as const

export function verifyTransactionHmac(
  callback: Record<string, any>,
  receivedHmac: string
): boolean {
  try {
    // Flatten nested fields
    const flat: Record<string, string> = {
      amount_cents:             String(callback.obj?.amount_cents ?? ''),
      created_at:               String(callback.obj?.created_at ?? ''),
      currency:                 String(callback.obj?.currency ?? ''),
      error_occured:            String(callback.obj?.error_occured ?? ''),
      has_parent_transaction:   String(callback.obj?.has_parent_transaction ?? ''),
      id:                       String(callback.obj?.id ?? ''),
      integration_id:           String(callback.obj?.integration_id ?? ''),
      is_3d_secure:             String(callback.obj?.is_3d_secure ?? ''),
      is_auth:                  String(callback.obj?.is_auth ?? ''),
      is_capture:               String(callback.obj?.is_capture ?? ''),
      is_refunded:              String(callback.obj?.is_refunded ?? ''),
      is_standalone_payment:    String(callback.obj?.is_standalone_payment ?? ''),
      is_voided:                String(callback.obj?.is_voided ?? ''),
      'order.id':               String(callback.obj?.order?.id ?? ''),
      owner:                    String(callback.obj?.owner ?? ''),
      pending:                  String(callback.obj?.pending ?? ''),
      'source_data.pan':        String(callback.obj?.source_data?.pan ?? ''),
      'source_data.sub_type':   String(callback.obj?.source_data?.sub_type ?? ''),
      'source_data.type':       String(callback.obj?.source_data?.type ?? ''),
      success:                  String(callback.obj?.success ?? ''),
    }

    const concatenated = TRANSACTION_HMAC_KEYS.map(k => flat[k]).join('')
    const calculated   = createHmac('sha512', HMAC_SECRET)
      .update(concatenated)
      .digest('hex')

    return calculated === receivedHmac
  } catch {
    return false
  }
}

export function verifyTokenHmac(
  tokenObj: Record<string, any>,
  receivedHmac: string
): boolean {
  try {
    const keys = ['card_subtype', 'created_at', 'email', 'id', 'masked_pan', 'merchant_id', 'order_id', 'token']
    const concatenated = keys.map(k => String(tokenObj[k] ?? '')).join('')
    const calculated   = createHmac('sha512', HMAC_SECRET)
      .update(concatenated)
      .digest('hex')
    return calculated === receivedHmac
  } catch {
    return false
  }
}

// ─── GET PAYMOB UNIFIED CHECKOUT URL ─────────────────────

// ─── CREATE THEME PAYMENT INTENTION ─────────────────────
// One-off purchase — does not activate premium

export async function createThemePaymentIntention({
  themeKey,
  userId,
  userEmail,
  userName,
  phone,
  notificationUrl,
  redirectionUrl,
}: {
  themeKey:        string
  userId:          string
  userEmail:       string
  userName:        string
  phone:           string
  notificationUrl: string
  redirectionUrl:  string
}) {
  const theme = THEME_PRICES[themeKey]
  if (!theme) throw new Error(`Unknown theme key: ${themeKey}`)

  const body = {
    amount:          theme.amount,
    currency:        theme.currency,
    payment_methods: [process.env.PAYMOB_INTEGRATION_ID_CARD!],
    items: [{
      name:     theme.label,
      amount:   theme.amount,
      quantity: 1,
    }],
    billing_data: {
      first_name:   userName.split(' ')[0] || userName,
      last_name:    userName.split(' ').slice(1).join(' ') || 'User',
      email:        userEmail,
      phone_number: phone || '+201000000000',
      apartment:    'NA',
      floor:        'NA',
      street:       'NA',
      building:     'NA',
      city:         'NA',
      country:      'NA',
      state:        'NA',
    },
    extras: {
      userId,
      planKey: `theme_${themeKey}`,
    },
    special_reference: `${userId}-theme_${themeKey}-${Date.now()}`,
    notification_url:  notificationUrl,
    redirection_url:   redirectionUrl,
  }

  const res = await fetch(`${PAYMOB_API_URL}/intention/`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Token ${SECRET_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Paymob createThemeIntention failed: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return {
    intentionId:  data.id as string,
    clientSecret: data.client_secret as string,
    orderId:      data.intention_order_id as number,
  }
}

export function getCheckoutUrl(clientSecret: string): string {
  const base = process.env.PAYMOB_ENV === 'production'
    ? 'https://accept.paymob.com/unifiedcheckout/'
    : 'https://accept.paymob.com/unifiedcheckout/'
  return `${base}?publicKey=${process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`
}
