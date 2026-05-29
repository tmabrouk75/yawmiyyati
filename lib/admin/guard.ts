import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

// Call this at the top of any admin API route
export async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!user.isAdmin) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 }) }
  }
  return { user, error: null }
}
