// app/api/payments/checkout-theme/route.ts
// One-off purchase for individual themes — independent of premium subscription

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createThemePaymentIntention, THEME_PRICES, getCheckoutUrl } from '@/lib/paymob/client'

// POST /api/payments/checkout-theme
// Body: { themeKey: string, phone?: string }
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { themeKey, phone } = await req.json()

    if (!themeKey || !THEME_PRICES[themeKey]) {
      return NextResponse.json({ error: 'Invalid theme key' }, { status: 400 })
    }

    // Check the user doesn't already own it
    const existing = await prisma.userTheme.findFirst({
      where: {
        userId:         user.id,
        themeDefinition: { key: themeKey },
      },
      include: { themeDefinition: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Theme already owned' }, { status: 409 })
    }

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL!
    const planKey   = `theme_${themeKey}`
    const themePrice = THEME_PRICES[themeKey]

    const { clientSecret, intentionId, orderId } = await createThemePaymentIntention({
      themeKey,
      userId:          user.id,
      userEmail:       user.email,
      userName:        user.name,
      phone:           phone || '+201000000000',
      notificationUrl: `${appUrl}/api/payments/webhook`,
      redirectionUrl:  `${appUrl}/api/payments/return?userId=${user.id}&planKey=${planKey}`,
    })

    // Store pending order so webhook can match it
    await prisma.paymentOrder.upsert({
      where:  { paymobOrderId: String(orderId) },
      create: {
        userId:        user.id,
        paymobOrderId: String(orderId),
        intentionId,
        planKey,
        status:        'PENDING',
        amountCents:   themePrice.amount,
        currency:      themePrice.currency,
      },
      update: {
        intentionId,
        status: 'PENDING',
      },
    })

    const checkoutUrl = getCheckoutUrl(clientSecret)
    return NextResponse.json({ checkoutUrl, intentionId })
  } catch (error) {
    console.error('[CHECKOUT-THEME]', error)
    return NextResponse.json({ error: 'Failed to create theme payment' }, { status: 500 })
  }
}
