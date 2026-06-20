import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

const CATEGORIES = ['MORNING', 'EVENING', 'AFTER_SALAH', 'CUSTOM'] as const
type Category = (typeof CATEGORIES)[number]

const LANGUAGES = ['EN', 'AR'] as const
type AzkarLang = (typeof LANGUAGES)[number]

const MAX_TEXT = 20000  // generous: diacritics (tashkeel) count as characters

async function requireAdmin() {
  const user = await getAuthUser()
  return (user?.isAdmin) ? user : null
}

function sanitize(body: Record<string, unknown>) {
  // Whitelist: only these fields may be written, never anything else from the client
  const out: {
    category?: Category
    language?: AzkarLang
    textAr?: string
    transliteration?: string | null
    translationEn?: string | null
    translationAr?: string | null
    repetitions?: number
    sortOrder?: number
    isActive?: boolean
  } = {}

  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category as Category)) return { error: 'Invalid category' }
    out.category = body.category as Category
  }
  if (body.language !== undefined) {
    if (!LANGUAGES.includes(body.language as AzkarLang)) return { error: 'Invalid language' }
    out.language = body.language as AzkarLang
  }
  if (body.textAr !== undefined) {
    const t = String(body.textAr).trim()
    if (!t) return { error: 'Arabic text is required' }
    if (t.length > MAX_TEXT) return { error: 'Text too long' }
    out.textAr = t
  }
  if (body.transliteration !== undefined)
    out.transliteration = body.transliteration ? String(body.transliteration).slice(0, MAX_TEXT) : null
  if (body.translationEn !== undefined)
    out.translationEn = body.translationEn ? String(body.translationEn).slice(0, MAX_TEXT) : null
  if (body.translationAr !== undefined)
    out.translationAr = body.translationAr ? String(body.translationAr).slice(0, MAX_TEXT) : null
  if (body.repetitions !== undefined) {
    const n = Number(body.repetitions)
    if (!Number.isInteger(n) || n < 1 || n > 1000) return { error: 'Repetitions must be 1-1000' }
    out.repetitions = n
  }
  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder)
    if (!Number.isInteger(n) || n < 0) return { error: 'Invalid sortOrder' }
    out.sortOrder = n
  }
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive)

  return { data: out }
}

export async function GET() {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const azkar = await prisma.azkarDefinition.findMany({ orderBy: [{ language: 'asc' }, { category: 'asc' }, { sortOrder: 'asc' }] })
    return NextResponse.json({ azkar })
  } catch (error) {
    console.error('[ADMIN AZKAR GET]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const result = sanitize(body)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
    const { data } = result
    if (!data.category || !data.textAr)
      return NextResponse.json({ error: 'category and textAr are required' }, { status: 400 })

    const language = data.language ?? 'AR'
    const count = await prisma.azkarDefinition.count({ where: { category: data.category, language } })
    const azkar = await prisma.azkarDefinition.create({
      data: {
        category:      data.category,
        language,
        textAr:        data.textAr,
        transliteration: data.transliteration ?? null,
        translationEn: data.translationEn ?? null,
        translationAr: data.translationAr ?? null,
        repetitions:   data.repetitions ?? 1,
        sortOrder:     count,
        isActive:      true,
      },
    })
    return NextResponse.json({ azkar })
  } catch (error) {
    console.error('[ADMIN AZKAR POST]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id, ...rest } = await req.json()
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const result = sanitize(rest)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
    if (Object.keys(result.data).length === 0)
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

    const azkar = await prisma.azkarDefinition.update({ where: { id }, data: result.data })
    return NextResponse.json({ azkar })
  } catch (error) {
    console.error('[ADMIN AZKAR PATCH]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    // Safe hard delete: UserAzkar.azkarDefinitionId is onDelete: SetNull in the schema
    await prisma.azkarDefinition.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[ADMIN AZKAR DELETE]', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
