import { NextResponse } from 'next/server'
import { clearAuthCookie, getAuthUser } from '@/lib/auth'

// GET /api/auth/me — return current logged-in user
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// POST /api/auth/logout
export async function POST() {
  clearAuthCookie()
  return NextResponse.json({ success: true })
}
