import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'

// POST /api/admin/reminders/send — manually trigger the reminder cron (admin only)
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  // Forward to the actual cron endpoint using the internal secret
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const secret = process.env.CRON_SECRET ?? ''

  const res = await fetch(`${appUrl}/api/reminders/trigger?secret=${secret}`, {
    method: 'GET',
  })

  const data = await res.json()
  return NextResponse.json({ triggered: true, result: data })
}
