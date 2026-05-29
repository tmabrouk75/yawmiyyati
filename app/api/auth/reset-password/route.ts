import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword, validatePassword } from '@/lib/auth'

// POST /api/auth/reset-password
// Body: { uid, token, newPassword }
export async function POST(req: NextRequest) {
  try {
    const { uid, token, newPassword } = await req.json()

    if (!uid || !token || !newPassword) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }

    const passwordError = validatePassword(newPassword)
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, passwordResetToken: true, passwordResetExpiresAt: true },
    })

    if (!user || user.passwordResetToken !== token) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: uid },
      data: {
        passwordHash,
        passwordResetToken:     null,
        passwordResetExpiresAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[RESET PASSWORD]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
