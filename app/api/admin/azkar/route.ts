import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getAuthUser()
  return (user?.isAdmin) ? user : null
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const azkar = await prisma.azkarDefinition.findMany({ orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] })
  return NextResponse.json({ azkar })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { category, textAr, translationEn, translationAr, repetitions } = await req.json()
  const count = await prisma.azkarDefinition.count({ where: { category } })
  const azkar = await prisma.azkarDefinition.create({
    data: { category, textAr: textAr ?? '', translationEn: translationEn ?? null,
      translationAr: translationAr ?? null, repetitions: repetitions ?? 1, sortOrder: count, isActive: true },
  })
  return NextResponse.json({ azkar })
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, ...data } = await req.json()
  const azkar = await prisma.azkarDefinition.update({ where: { id }, data })
  return NextResponse.json({ azkar })
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.azkarDefinition.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
