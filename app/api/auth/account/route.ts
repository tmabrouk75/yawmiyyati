import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser, verifyPassword, clearAuthCookie } from '@/lib/auth'

// DELETE /api/auth/account
// Body: { password } — requires password confirmation
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { password } = await req.json()
    if (!password) {
      return NextResponse.json({ error: 'Password confirmation required' }, { status: 400 })
    }

    // Fetch full user with password hash
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true, isAdmin: true },
    })

    if (!fullUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Admins cannot delete their own account from the app
    if (fullUser.isAdmin) {
      return NextResponse.json({ error: 'Admin accounts cannot be deleted from the app' }, { status: 403 })
    }

    // Verify password
    const valid = await verifyPassword(password, fullUser.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Delete user — Prisma cascade handles all related data
    await prisma.user.delete({ where: { id: user.id } })

    // Clear auth cookie
    clearAuthCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE ACCOUNT]', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
