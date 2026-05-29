import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'

// POST /api/admin/grant
// Grant or revoke premium, or fix subscription state for any user
// Body: {
//   userId | email,               ← identify user by either
//   isPremium: boolean,
//   days?: number,                 ← 0 = lifetime, N = N days from now
//   reason?: string                ← admin note
// }
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { userId, email, isPremium, days, reason } = body

  if (!userId && !email) {
    return NextResponse.json({ error: 'userId or email required' }, { status: 400 })
  }
  if (isPremium === undefined) {
    return NextResponse.json({ error: 'isPremium is required' }, { status: 400 })
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, isPremium: true, premiumExpiresAt: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  let premiumExpiresAt: Date | null = null

  if (isPremium) {
    if (!days || days === 0) {
      premiumExpiresAt = null  // lifetime
    } else {
      premiumExpiresAt = new Date()
      premiumExpiresAt.setDate(premiumExpiresAt.getDate() + days)
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isPremium,
      premiumExpiresAt: isPremium ? premiumExpiresAt : null,
      
    },
    select: { id: true, name: true, email: true, isPremium: true, premiumExpiresAt: true },
  })

  return NextResponse.json({
    success: true,
    user:    updated,
    action:  isPremium
      ? days === 0 ? 'Granted lifetime Premium' : `Granted Premium for ${days} days`
      : 'Revoked Premium',
    reason: reason ?? null,
  })
}
