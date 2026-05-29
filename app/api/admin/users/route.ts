import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'

// GET /api/admin/users?page=1&search=email&filter=premium|free|all
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = req.nextUrl
  const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
  const search = searchParams.get('search') ?? ''
  const filter = searchParams.get('filter') ?? 'all'   // all | premium | free | admin
  const limit  = 25

  const where: any = { isAdmin: false } // never show admin in user list
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name:  { contains: search, mode: 'insensitive' } },
    ]
  }
  if (filter === 'premium') where.isPremium = true
  if (filter === 'free')    where.isPremium = false

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id:              true,
        email:           true,
        name:            true,
        language:        true,
        isPremium:       true,
        premiumExpiresAt:true,
        isAdmin:         true,
        createdAt:       true,
        _count: {
          select: { dailyLogs: true, groupsOwned: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    pagination: { page, total, pages: Math.ceil(total / limit), limit },
  })
}

// PATCH /api/admin/users — update a user's premium or admin status
// Body: { userId, isPremium?, premiumExpiresAt?, isAdmin? }
export async function PATCH(req: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { userId, isPremium, premiumExpiresAt, isAdmin } = body

  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  // Prevent admin from demoting themselves
  if (userId === admin!.id && isAdmin === false) {
    return NextResponse.json({ error: 'Cannot remove your own admin status' }, { status: 400 })
  }

  const data: any = {}
  if (isPremium       !== undefined) data.isPremium        = isPremium
  if (premiumExpiresAt !== undefined) data.premiumExpiresAt = premiumExpiresAt ? new Date(premiumExpiresAt) : null
  if (isAdmin         !== undefined) data.isAdmin          = isAdmin

  // If granting premium with no expiry, set null (lifetime)
  if (isPremium === true && !premiumExpiresAt) data.premiumExpiresAt = null

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, isPremium: true, premiumExpiresAt: true, isAdmin: true },
  })

  return NextResponse.json({ user: updated })
}
