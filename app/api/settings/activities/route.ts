import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// PATCH /api/settings/activities
// Body: { updates: [{ id, isEnabled?, sortOrder? }] }
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { updates } = await req.json()
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates must be an array' }, { status: 400 })
    }

    // Verify all IDs belong to this user
    const ids = updates.map((u: any) => u.id)
    const existing = await prisma.userActivity.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    })
    const validIds = new Set(existing.map(e => e.id))

    await Promise.all(
      updates
        .filter((u: any) => validIds.has(u.id))
        .map((u: any) => {
          const data: any = {}
          if (u.isEnabled  !== undefined) data.isEnabled  = u.isEnabled
          if (u.sortOrder  !== undefined) data.sortOrder  = u.sortOrder
          return prisma.userActivity.update({ where: { id: u.id }, data })
        })
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ACTIVITIES PATCH]', error)
    return NextResponse.json({ error: 'Failed to update activities' }, { status: 500 })
  }
}
