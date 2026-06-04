import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// ── POST /api/tasks/reorder ────────────────────────────────
// Body: { order: string[] } — array of task IDs in new order
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { order } = await req.json() as { order: string[] }
  if (!Array.isArray(order)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  await Promise.all(
    order.map((id, i) =>
      prisma.task.updateMany({
        where: { id, userId: user.id },
        data:  { sortOrder: i },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
