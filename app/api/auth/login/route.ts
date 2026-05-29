import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check premium expiry
    let isPremium = user.isPremium
    if (isPremium && user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      await prisma.user.update({ where: { id: user.id }, data: { isPremium: false } })
      isPremium = false
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      isPremium,
      isAdmin: user.isAdmin,
    })

    setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
        theme: user.theme,
        isPremium,
      },
    })

  } catch (error) {
    console.error('[LOGIN ERROR]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
