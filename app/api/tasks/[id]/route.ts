import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// ── PATCH /api/tasks/[id] ──────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const task = await prisma.task.findFirst({ where: { id: params.id, userId: user.id } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const data: any = {}

  if (typeof body.title       === 'string') data.title       = body.title.trim()
  if (typeof body.isCompleted === 'boolean') {
    data.isCompleted = body.isCompleted
    data.completedAt = body.isCompleted ? new Date() : null
  }
  if (typeof body.sortOrder   === 'number') data.sortOrder   = body.sortOrder

  const updated = await prisma.task.update({ where: { id: params.id }, data })
  return NextResponse.json({ task: updated })
}

// ── DELETE /api/tasks/[id] ─────────────────────────────────
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.task.deleteMany({ where: { id: params.id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
