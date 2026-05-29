import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser, verifyPassword, hashPassword, validatePassword } from '@/lib/auth'

// POST /api/auth/change-password
// Body: { currentPassword, newPassword }
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both passwords are required' }, { status: 400 })
    }

    const passError = validatePassword(newPassword)
    if (passError) return NextResponse.json({ error: passError }, { status: 400 })

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })

    const valid = await verifyPassword(currentPassword, fullUser!.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash: await hashPassword(newPassword) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CHANGE PASSWORD]', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
