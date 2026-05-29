// app/api/payments/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { createPaymentIntention, getCheckoutUrl, PlanKey, PLANS } from '@/lib/paymob/client'

// POST /api/payments/checkout
// Body: { planKey: 'premium_monthly' | 'premium_yearly', phone?: string }
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planKey, phone } = await req.json()

    if (!planKey || !(planKey in PLANS)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!

    const { clientSecret, intentionId, orderId } = await createPaymentIntention({
      planKey:         planKey as PlanKey,
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
        amountCents:   PLANS[planKey as PlanKey].amount,
        currency:      PLANS[planKey as PlanKey].currency,
      },
      update: {
        intentionId,
        status: 'PENDING',
      },
    })

    const checkoutUrl = getCheckoutUrl(clientSecret)
    return NextResponse.json({ checkoutUrl, intentionId })
  } catch (error) {
    console.error('[CHECKOUT]', error)
    return NextResponse.json({ error: 'Failed to create payment intention' }, { status: 500 })
  }
}
