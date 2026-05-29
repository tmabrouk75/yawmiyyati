import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/settings/surahs
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const surahs = await prisma.userSurah.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ surahs })
}

// POST /api/settings/surahs — add a surah
// Body: { surahNumber, surahNameEn, surahNameAr }
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { surahNumber, surahNameEn, surahNameAr } = await req.json()
  if (!surahNumber || !surahNameEn || !surahNameAr) {
    return NextResponse.json({ error: 'surahNumber, surahNameEn and surahNameAr are required' }, { status: 400 })
  }

  // Max 10 daily surahs
  const count = await prisma.userSurah.count({ where: { userId: user.id } })
  if (count >= 10) {
    return NextResponse.json({ error: 'Maximum 10 daily Surahs allowed' }, { status: 400 })
  }

  const surah = await prisma.userSurah.create({
    data: { userId: user.id, surahNumber, surahNameEn, surahNameAr, sortOrder: count },
  })
  return NextResponse.json({ surah }, { status: 201 })
}

// DELETE /api/settings/surahs?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await prisma.userSurah.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ success: true })
}

// PATCH /api/settings/surahs — reorder or toggle
// Body: { updates: [{ id, sortOrder?, isEnabled? }] }
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { updates } = await req.json()
  await Promise.all(
    updates.map((u: any) =>
      prisma.userSurah.updateMany({
        where: { id: u.id, userId: user.id },
        data: {
          ...(u.sortOrder  !== undefined && { sortOrder:  u.sortOrder }),
          ...(u.isEnabled  !== undefined && { isEnabled:  u.isEnabled }),
        },
      })
    )
  )
  return NextResponse.json({ success: true })
}
