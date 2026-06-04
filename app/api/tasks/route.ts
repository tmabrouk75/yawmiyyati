import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// ── GET /api/tasks ─────────────────────────────────────────
// Returns active + completed tasks. Auto-archives completed tasks older than 3 days.
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Auto-archive completed tasks older than 3 days
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  await prisma.task.updateMany({
    where: {
      userId:      user.id,
      isCompleted: true,
      isArchived:  false,
      completedAt: { lt: threeDaysAgo },
    },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  })

  // Return active tasks (not archived) — pending first by sortOrder, completed last
  const tasks = await prisma.task.findMany({
    where:   { userId: user.id, isArchived: false },
    orderBy: [{ isCompleted: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return NextResponse.json({ tasks })
}

// ── POST /api/tasks ────────────────────────────────────────
// Create a new task
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  // Place new task at the top (sortOrder 0, shift others down)
  await prisma.task.updateMany({
    where: { userId: user.id, isArchived: false, isCompleted: false },
    data:  { sortOrder: { increment: 1 } },
  })

  const task = await prisma.task.create({
    data: { userId: user.id, title: title.trim(), sortOrder: 0 },
  })

  return NextResponse.json({ task }, { status: 201 })
}
