import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { REFERRAL_COSTS, PREMIUM_DAYS_PER_REDEMPTION } from '@/lib/referral'

// POST /api/referral/redeem
// Body: { type: 'PREMIUM_MONTH' } | { type: 'THEME_UNLOCK', themeKey: string }
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, themeKey } = body

  if (type !== 'PREMIUM_MONTH' && type !== 'THEME_UNLOCK') {
    return NextResponse.json({ error: 'Invalid redemption type' }, { status: 400 })
  }
  if (type === 'THEME_UNLOCK' && !themeKey) {
    return NextResponse.json({ error: 'themeKey required for THEME_UNLOCK' }, { status: 400 })
  }

  const cost = REFERRAL_COSTS[type as keyof typeof REFERRAL_COSTS]

  // Refresh user points from DB
  const freshUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!freshUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (freshUser.referralPoints < cost) {
    return NextResponse.json({
      error: `Not enough points. You have ${freshUser.referralPoints}, need ${cost}.`,
    }, { status: 400 })
  }

  // ── PREMIUM_MONTH ──────────────────────────────────────
  if (type === 'PREMIUM_MONTH') {
    const now     = new Date()
    const current = freshUser.premiumExpiresAt && freshUser.premiumExpiresAt > now
      ? freshUser.premiumExpiresAt
      : now
    const newExpiry = new Date(current.getTime() + PREMIUM_DAYS_PER_REDEMPTION * 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          referralPoints:  freshUser.referralPoints - cost,
          isPremium:       true,
          premiumExpiresAt: newExpiry,
        },
      }),
      prisma.pointRedemption.create({
        data: {
          userId:    user.id,
          type:      'PREMIUM_MONTH',
          pointsCost: cost,
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      newBalance:      freshUser.referralPoints - cost,
      premiumUntil:    newExpiry,
    })
  }

  // ── THEME_UNLOCK ───────────────────────────────────────
  if (type === 'THEME_UNLOCK') {
    // Check theme not already owned
    const alreadyOwned = await prisma.userTheme.findFirst({
      where: { userId: user.id, themeDefinition: { key: themeKey } },
    })
    if (alreadyOwned) {
      return NextResponse.json({ error: 'You already own this theme.' }, { status: 409 })
    }

    // Find theme definition
    const themeDef = await prisma.themeDefinition.findUnique({ where: { key: themeKey } })
    if (!themeDef) {
      return NextResponse.json({ error: 'Theme not found.' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data:  { referralPoints: freshUser.referralPoints - cost },
      }),
      prisma.userTheme.create({
        data: { userId: user.id, themeDefinitionId: themeDef.id },
      }),
      prisma.pointRedemption.create({
        data: {
          userId:    user.id,
          type:      'THEME_UNLOCK',
          pointsCost: cost,
          themeKey,
        },
      }),
    ])

    return NextResponse.json({
      ok: true,
      newBalance: freshUser.referralPoints - cost,
      unlockedTheme: themeKey,
    })
  }
}
