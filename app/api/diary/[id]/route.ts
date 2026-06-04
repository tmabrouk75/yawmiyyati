import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// DELETE /api/diary/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.diaryEntry.deleteMany({ where: { id: params.id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
