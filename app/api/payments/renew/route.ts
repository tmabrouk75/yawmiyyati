// app/api/payments/renew/route.ts
// Called by Vercel cron daily at 00:00
// Charges saved card tokens for subscriptions expiring today

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { chargeWithSavedToken, PLANS, PlanKey } from '@/lib/paymob/client'
import { sendEmail } from '@/lib/email/send'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret')
    ?? new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now   = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Find active subscriptions expiring today
  const expiring = await prisma.subscription.findMany({
    where: {
      status:            'ACTIVE',
      currentPeriodEnd: { gte: today, lt: tomorrow },
    },
    include: {
      user: {
        include: { savedCards: { where: { isDefault: true }, take: 1 } },
      },
    },
  })

  console.log(`[RENEW] Found ${expiring.length} subscriptions expiring today`)

  const results = []

  for (const sub of expiring) {
    const user       = sub.user
    const savedCard  = user.savedCards[0]
    const planKey    = sub.planKey as PlanKey
    const plan       = PLANS[planKey]

    if (!savedCard) {
      // No saved card — mark as expired, notify user
      await prisma.subscription.update({
        where: { id: sub.id },
        data:  { status: 'PAYMENT_FAILED' },
      })
      await prisma.user.update({
        where: { id: user.id },
        data:  { isPremium: false },
      })

      // Send expiry email
      const isAr = user.language === 'AR'
      await sendEmail({
        to:      user.email,
        subject: isAr ? 'يومياتي — انتهى اشتراكك' : 'Yawmiyyati — Your subscription has expired',
        html:    `<div style="font-family:sans-serif;padding:20px;" dir="${isAr ? 'rtl' : 'ltr'}">
          <h2>${isAr ? 'انتهى اشتراكك' : 'Your subscription has expired'}</h2>
          <p>${isAr
            ? `مرحباً ${user.name}، انتهت صلاحية اشتراكك في يومياتي. يمكنك التجديد من صفحة البريميوم.`
            : `Hello ${user.name}, your Yawmiyyati Premium subscription has expired. You can renew from the Premium page.`}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/premium" style="display:inline-block;background:#059669;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;margin-top:12px;">
            ${isAr ? 'تجديد الاشتراك' : 'Renew Subscription'}
          </a>
        </div>`,
        text: isAr ? 'انتهى اشتراكك' : 'Your subscription has expired',
      }).catch(() => {})

      results.push({ userId: user.id, status: 'NO_CARD' })
      continue
    }

    // Attempt MIT charge with saved card
    try {
      const chargeResult = await chargeWithSavedToken({
        cardToken:       savedCard.token,
        integrationId:   plan.integrationId,
        amount:          plan.amount,
        currency:        plan.currency,
        userId:          user.id,
        planKey,
        notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      })

      const charged = chargeResult?.success === true

      if (charged) {
        const newPeriodEnd = new Date(sub.currentPeriodEnd)
        newPeriodEnd.setDate(newPeriodEnd.getDate() + plan.intervalDays)

        await Promise.all([
          prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status:              'ACTIVE',
              currentPeriodStart:  sub.currentPeriodEnd,
              currentPeriodEnd:    newPeriodEnd,
              paymobTransactionId: String(chargeResult.id),
            },
          }),
          prisma.user.update({
            where: { id: user.id },
            data:  { isPremium: true, premiumExpiresAt: newPeriodEnd },
          }),
        ])

        results.push({ userId: user.id, status: 'RENEWED', until: newPeriodEnd })
      } else {
        // Charge failed — grace period of 3 days then deactivate
        await prisma.subscription.update({
          where: { id: sub.id },
          data:  { status: 'PAYMENT_FAILED' },
        })
        results.push({ userId: user.id, status: 'CHARGE_FAILED' })
      }
    } catch (err) {
      console.error(`[RENEW] Failed for user ${user.id}:`, err)
      results.push({ userId: user.id, status: 'ERROR' })
    }
  }

  return NextResponse.json({
    processed: expiring.length,
    results,
  })
}
