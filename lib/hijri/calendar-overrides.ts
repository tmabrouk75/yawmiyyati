// Islamic Calendar Override Engine
// Resolves the REAL calendar date for a user based on:
// 1. Admin-confirmed overrides for their country
// 2. Country default offset from calculated date
// 3. Fallback to algorithmic calculation

import { prisma } from '@/lib/db/prisma'
import { toHijri, hijriToGregorian } from '@/lib/hijri'
import { getCountry } from '@/lib/countries'
import type { CalendarEventType } from '@prisma/client'

// ─── CORE RESOLVER ────────────────────────────────────────

export async function resolveCalendarDate(
  hijriYear:  number,
  hijriMonth: number,
  eventType:  CalendarEventType,
  countryCode: string
): Promise<Date> {
  // 1. Try admin-confirmed override for this country
  const override = await prisma.countryCalendarOverride.findFirst({
    where: {
      countryCode,
      event: { hijriYear, hijriMonth, eventType },
    },
    include: { event: true },
  })

  if (override) {
    return new Date(override.confirmedDate)
  }

  // 2. Try event with default calculated date — apply country default offset
  const event = await prisma.islamicCalendarEvent.findUnique({
    where: { hijriYear_hijriMonth_eventType: { hijriYear, hijriMonth, eventType } },
  })

  if (event) {
    const base = new Date(event.calculatedDate)
    const country = getCountry(countryCode)
    const offset  = country?.defaultOffset ?? 0
    const result  = new Date(base)
    result.setDate(result.getDate() + offset)
    return result
  }

  // 3. Pure algorithmic fallback
  const country = getCountry(countryCode)
  const offset  = country?.defaultOffset ?? 0
  const base    = hijriToGregorian(hijriYear, hijriMonth, 1)
  base.setDate(base.getDate() + offset)
  return base
}

// ─── CHECK IF TODAY IS A SPECIFIC EVENT ───────────────────

export async function isEventToday(
  eventType:   CalendarEventType,
  countryCode: string,
  today: Date = new Date()
): Promise<boolean> {
  today = new Date(today)
  today.setHours(0, 0, 0, 0)

  const hijri = toHijri(today)

  // Determine which month/day to check
  let checkYear  = hijri.year
  let checkMonth = hijri.month

  if (eventType === 'EID_FITR') {
    checkMonth = 10  // 1 Shawwal
  } else if (eventType === 'EID_ADHA') {
    checkMonth = 12  // 10 Dhul Hijjah
  }
  // MONTH_START uses current hijriMonth

  const resolvedDate = await resolveCalendarDate(checkYear, checkMonth, eventType, countryCode)
  resolvedDate.setHours(0, 0, 0, 0)

  return today.getTime() === resolvedDate.getTime()
}

// ─── GET THIS MONTH'S START FOR A USER ───────────────────

export async function getMonthStartForUser(
  hijriYear:   number,
  hijriMonth:  number,
  countryCode: string
): Promise<Date> {
  return resolveCalendarDate(hijriYear, hijriMonth, 'MONTH_START', countryCode)
}

// ─── GET UPCOMING EVENTS FOR A USER ──────────────────────
// Returns the next 3 months of confirmed event dates for the user's country

export async function getUpcomingEvents(countryCode: string) {
  const today  = new Date()
  const hijri  = toHijri(today)
  const events = []

  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    let year  = hijri.year
    let month = hijri.month + monthOffset
    if (month > 12) { month -= 12; year++ }

    const monthStart = await resolveCalendarDate(year, month, 'MONTH_START', countryCode)

    events.push({
      type:         'MONTH_START' as CalendarEventType,
      hijriYear:    year,
      hijriMonth:   month,
      resolvedDate: monthStart,
    })
  }

  // Check Eid al-Fitr (1 Shawwal)
  const eidFitr = await resolveCalendarDate(hijri.year, 10, 'EID_FITR', countryCode)
  events.push({ type: 'EID_FITR' as CalendarEventType, hijriYear: hijri.year, hijriMonth: 10, resolvedDate: eidFitr })

  // Check Eid al-Adha (10 Dhul Hijjah)
  const eidAdha = await resolveCalendarDate(hijri.year, 12, 'EID_ADHA', countryCode)
  events.push({ type: 'EID_ADHA' as CalendarEventType, hijriYear: hijri.year, hijriMonth: 12, resolvedDate: eidAdha })

  return events.sort((a, b) => a.resolvedDate.getTime() - b.resolvedDate.getTime())
}
