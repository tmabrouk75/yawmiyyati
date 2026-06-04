import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/diary — newest first
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entries = await prisma.diaryEntry.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ entries })
}

// POST /api/diary — create entry
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, customTitle, format } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const entry = await prisma.diaryEntry.create({
    data: {
      userId:      user.id,
      content:     content.trim(),
      customTitle: customTitle?.trim() || null,
      format:      format ?? 'text',
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}
