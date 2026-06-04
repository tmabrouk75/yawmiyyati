import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const azkar = await prisma.userAzkar.findMany({ where: { userId: user.id }, orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ azkar })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { azkarDefinitionId, textAr, translationEn, translationAr, repetitions } = await req.json()
  const count = await prisma.userAzkar.count({ where: { userId: user.id } })
  const azkar = await prisma.userAzkar.create({
    data: { userId: user.id, azkarDefinitionId: azkarDefinitionId ?? null,
      textAr: textAr ?? '', translationEn: translationEn ?? null,
      translationAr: translationAr ?? null, repetitions: repetitions ?? 1, sortOrder: count },
  })
  return NextResponse.json({ azkar })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.userAzkar.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
