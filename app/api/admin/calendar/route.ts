import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'
import { toHijri, hijriToGregorian, HIJRI_MONTHS_EN, HIJRI_MONTHS_AR } from '@/lib/hijri'
import { COUNTRIES } from '@/lib/countries'

// ─────────────────────────────────────────────────────────
// GET /api/admin/calendar
// Returns all calendar events with their country overrides
// Optional: ?year=1447&month=9
// ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = req.nextUrl
  const hijri = toHijri(new Date())

  const year  = parseInt(searchParams.get('year')  ?? String(hijri.year))
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null

  const where: any = { hijriYear: year }
  if (month) where.hijriMonth = month

  const events = await prisma.islamicCalendarEvent.findMany({
    where,
    include: { countryOverrides: true },
    orderBy: [{ hijriMonth: 'asc' }, { eventType: 'asc' }],
  })

  // Build response — for months not yet in DB, compute calculated date
  const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1)
  const eventTypes = ['MONTH_START', 'EID_FITR', 'EID_ADHA'] as const

  const result = []

  for (const m of months) {
    // Only EID_FITR for month 10, EID_ADHA for month 12, MONTH_START for all
    const relevantTypes = [
      'MONTH_START',
      ...(m === 10 ? ['EID_FITR'] : []),
      ...(m === 12 ? ['EID_ADHA'] : []),
    ]

    for (const evType of relevantTypes) {
      const existing = events.find(e => e.hijriMonth === m && e.eventType === evType)
      const calculatedDate = hijriToGregorian(year, m, evType === 'EID_ADHA' ? 10 : 1)

      result.push({
        id:              existing?.id ?? null,
        hijriYear:       year,
        hijriMonth:      m,
        monthNameEn:     HIJRI_MONTHS_EN[m],
        monthNameAr:     HIJRI_MONTHS_AR[m],
        eventType:       evType,
        calculatedDate:  calculatedDate.toISOString().split('T')[0],
        notes:           existing?.notes ?? null,
        countryOverrides: existing?.countryOverrides.map(co => ({
          id:            co.id,
          countryCode:   co.countryCode,
          countryNameEn: COUNTRIES.find(c => c.code === co.countryCode)?.nameEn ?? co.countryCode,
          countryNameAr: COUNTRIES.find(c => c.code === co.countryCode)?.nameAr ?? co.countryCode,
          dayOffset:     co.dayOffset,
          confirmedDate: co.confirmedDate.toISOString().split('T')[0],
          source:        co.source,
        })) ?? [],
      })
    }
  }

  return NextResponse.json({ events: result, year, countries: COUNTRIES })
}

// ─────────────────────────────────────────────────────────
// POST /api/admin/calendar
// Create or update a calendar event + its country overrides
// Body: {
//   hijriYear, hijriMonth, eventType,
//   calculatedDate, notes?,
//   overrides: [{ countryCode, dayOffset, confirmedDate, source? }]
// }
// ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { hijriYear, hijriMonth, eventType, calculatedDate, notes, overrides = [] } = body

  if (!hijriYear || !hijriMonth || !eventType || !calculatedDate) {
    return NextResponse.json({ error: 'hijriYear, hijriMonth, eventType and calculatedDate are required' }, { status: 400 })
  }

  // Upsert the calendar event
  const event = await prisma.islamicCalendarEvent.upsert({
    where: { hijriYear_hijriMonth_eventType: { hijriYear, hijriMonth, eventType } },
    create: {
      hijriYear,
      hijriMonth,
      eventType,
      calculatedDate: new Date(calculatedDate),
      notes: notes ?? null,
    },
    update: {
      calculatedDate: new Date(calculatedDate),
      notes: notes ?? null,
    },
  })

  // Upsert each country override
  const savedOverrides = []
  for (const ov of overrides) {
    if (!ov.countryCode || ov.dayOffset === undefined || !ov.confirmedDate) continue

    const saved = await prisma.countryCalendarOverride.upsert({
      where: { islamicCalendarEventId_countryCode: { islamicCalendarEventId: event.id, countryCode: ov.countryCode } },
      create: {
        islamicCalendarEventId: event.id,
        countryCode:   ov.countryCode,
        dayOffset:     parseInt(ov.dayOffset),
        confirmedDate: new Date(ov.confirmedDate),
        source:        ov.source ?? null,
      },
      update: {
        dayOffset:     parseInt(ov.dayOffset),
        confirmedDate: new Date(ov.confirmedDate),
        source:        ov.source ?? null,
      },
    })
    savedOverrides.push(saved)
  }

  return NextResponse.json({ event, overrides: savedOverrides })
}

// ─────────────────────────────────────────────────────────
// DELETE /api/admin/calendar?overrideId=xxx
// Remove a specific country override
// ─────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const overrideId = req.nextUrl.searchParams.get('overrideId')
  if (!overrideId) return NextResponse.json({ error: 'overrideId required' }, { status: 400 })

  await prisma.countryCalendarOverride.delete({ where: { id: overrideId } })
  return NextResponse.json({ success: true })
}
