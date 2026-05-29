// app/api/payments/webhook/route.ts
// Paymob sends two types of callbacks to this endpoint:
//   1. TRANSACTION callback — payment succeeded/failed
//   2. TOKEN callback — card saved for future MIT renewals

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyTransactionHmac, verifyTokenHmac, PLANS, PlanKey } from '@/lib/paymob/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const url  = new URL(req.url)
    const hmac = url.searchParams.get('hmac') ?? ''

    // ── TOKEN callback — save card for future renewals
    if (body.type === 'TOKEN') {
      const valid = verifyTokenHmac(body.obj, hmac)
      if (!valid) {
        console.error('[WEBHOOK] Token HMAC mismatch')
        return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
      }

      const { token, masked_pan, card_subtype, order_id, email } = body.obj

      // Match order to user
      const order = await prisma.paymentOrder.findFirst({
        where: { paymobOrderId: String(order_id) },
      })
      if (!order) {
        console.error('[WEBHOOK] Token — order not found:', order_id)
        return NextResponse.json({ received: true })
      }

      // Save card token for automatic renewals
      await prisma.savedCard.upsert({
        where:  { userId_maskedPan: { userId: order.userId, maskedPan: masked_pan } },
        create: {
          userId:      order.userId,
          token,
          maskedPan:   masked_pan,
          cardSubtype: card_subtype,
          planKey:     order.planKey,
          isDefault:   true,
        },
        update: { token, cardSubtype: card_subtype, isDefault: true },
      })

      console.log(`[WEBHOOK] Card token saved for user ${order.userId}`)
      return NextResponse.json({ received: true })
    }

    // ── TRANSACTION callback — payment result
    if (body.type === 'TRANSACTION') {
      const valid = verifyTransactionHmac(body, hmac)
      if (!valid) {
        console.error('[WEBHOOK] Transaction HMAC mismatch')
        return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
      }

      const tx      = body.obj
      const orderId = String(tx?.order?.id ?? '')
      const success = tx?.success === true
      const pending = tx?.pending === true

      // Find the pending order
      const order = await prisma.paymentOrder.findFirst({
        where: { paymobOrderId: orderId },
      })

      if (!order) {
        console.error('[WEBHOOK] Transaction — order not found:', orderId)
        return NextResponse.json({ received: true })
      }

      if (pending) {
        await prisma.paymentOrder.update({
          where: { id: order.id },
          data:  { status: 'PENDING', paymobTransactionId: String(tx.id) },
        })
        return NextResponse.json({ received: true })
      }

      if (!success) {
        await prisma.paymentOrder.update({
          where: { id: order.id },
          data:  { status: 'FAILED', paymobTransactionId: String(tx.id) },
        })
        console.log(`[WEBHOOK] Payment failed for order ${orderId}`)
        return NextResponse.json({ received: true })
      }

      // ── Payment successful — route by planKey type
      const now = new Date()

      // ── Theme purchase — grant theme, no premium change
      if (order.planKey.startsWith('theme_')) {
        const themeKey = order.planKey.replace('theme_', '')

        const themeDef = await prisma.themeDefinition.findUnique({
          where: { key: themeKey },
        })

        await prisma.paymentOrder.update({
          where: { id: order.id },
          data: {
            status:              'COMPLETED',
            paymobTransactionId: String(tx.id),
            completedAt:         now,
          },
        })

        if (themeDef) {
          await prisma.userTheme.upsert({
            where: {
              userId_themeDefinitionId: {
                userId:           order.userId,
                themeDefinitionId: themeDef.id,
              },
            },
            create: {
              userId:           order.userId,
              themeDefinitionId: themeDef.id,
              paddleOrderId:    orderId, // reusing field for paymob order id
            },
            update: {},
          })
          console.log(`[WEBHOOK] Theme '${themeKey}' granted to user ${order.userId}`)
        } else {
          console.error(`[WEBHOOK] ThemeDefinition not found for key: ${themeKey}`)
        }

        return NextResponse.json({ received: true })
      }

      // ── Premium subscription — activate premium
      const planKey  = order.planKey as PlanKey
      const plan     = PLANS[planKey]
      const expiresAt = new Date(now)
      expiresAt.setDate(expiresAt.getDate() + plan.intervalDays)

      await Promise.all([
        // Update order status
        prisma.paymentOrder.update({
          where: { id: order.id },
          data: {
            status:             'COMPLETED',
            paymobTransactionId: String(tx.id),
            completedAt:        now,
          },
        }),

        // Activate premium on user
        prisma.user.update({
          where: { id: order.userId },
          data: {
            isPremium:        true,
            premiumExpiresAt: expiresAt,
            paymobCustomerId: String(tx.order?.id ?? ''),
          },
        }),

        // Create subscription record
        prisma.subscription.upsert({
          where: { userId: order.userId },
          create: {
            userId:              order.userId,
            planKey,
            status:              'ACTIVE',
            currentPeriodStart:  now,
            currentPeriodEnd:    expiresAt,
            paymobOrderId:       orderId,
            paymobTransactionId: String(tx.id),
          },
          update: {
            planKey,
            status:              'ACTIVE',
            currentPeriodStart:  now,
            currentPeriodEnd:    expiresAt,
            paymobOrderId:       orderId,
            paymobTransactionId: String(tx.id),
          },
        }),
      ])

      console.log(`[WEBHOOK] Premium activated for user ${order.userId} until ${expiresAt.toISOString()}`)
      return NextResponse.json({ received: true })
    }

    // Unknown type
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error)
    // Always return 200 to Paymob — errors logged server-side
    return NextResponse.json({ received: true })
  }
}
