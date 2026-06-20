import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/admin/azkar/reorder
// Body: { order: string[] } - azkar definition IDs in their new display order.
// Admin only. Writes sortOrder = index for each id, matching the order sent.
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { order } = await req.json() as { order: string[] }
  if (!Array.isArray(order) || order.some(id => typeof id !== 'string')) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  await Promise.all(
    order.map((id, i) =>
      prisma.azkarDefinition.updateMany({
        where: { id },
        data:  { sortOrder: i },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
