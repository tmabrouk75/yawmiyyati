import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const language = req.nextUrl.searchParams.get('language')
    const where: any = { isActive: true }
    if (category) where.category = category
    if (language === 'EN' || language === 'AR') where.language = language
    const azkar = await prisma.azkarDefinition.findMany({
      where, orderBy: { sortOrder: 'asc' },
      select: { id: true, category: true, language: true, textAr: true, translationEn: true, translationAr: true, repetitions: true },
    })
    return NextResponse.json({ azkar })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
