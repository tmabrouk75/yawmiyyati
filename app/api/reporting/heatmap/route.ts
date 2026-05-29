import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { subDays } from 'date-fns'
import { toHijri } from '@/lib/hijri'

// GET /api/reporting/heatmap?months=3
// Returns day-by-day completion data for heatmap rendering
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const months = parseInt(req.nextUrl.searchParams.get('months') ?? '3')
    const days   = Math.min(months * 30, 365)

    const from = subDays(new Date(), days)
    from.setHours(0, 0, 0, 0)
    const to = new Date()
    to.setHours(23, 59, 59, 999)

    const logs = await prisma.dailyLog.findMany({
      where: { userId: user.id, dateGregorian: { gte: from, lte: to } },
      select: {
        dateGregorian:  true,
        dateHijriYear:  true,
        dateHijriMonth: true,
        dateHijriDay:   true,
        completionPct:  true,
      },
      orderBy: { dateGregorian: 'asc' },
    })

    // Build a map for quick lookup
    const logMap: Record<string, number> = {}
    logs.forEach(log => {
      const key = log.dateGregorian.toISOString().split('T')[0]
      logMap[key] = log.completionPct
    })

    // Build full day array (including days with no log = 0)
    const dayData: {
      date: string
      hijriDay: number
      hijriMonth: number
      hijriYear: number
      pct: number
      level: 0 | 1 | 2 | 3  // 0=none, 1=bad, 2=partial, 3=full
    }[] = []

    const cursor = new Date(from)
    while (cursor <= to) {
      const key = cursor.toISOString().split('T')[0]
      const pct = logMap[key] ?? 0
      const hijri = toHijri(cursor)

      dayData.push({
        date:        key,
        hijriDay:    hijri.day,
        hijriMonth:  hijri.month,
        hijriYear:   hijri.year,
        pct,
        level: pct === 0 ? 0 : pct < 50 ? 1 : pct < 100 ? 2 : 3,
      })

      cursor.setDate(cursor.getDate() + 1)
    }

    return NextResponse.json({ days: dayData, from: from.toISOString(), to: to.toISOString() })
  } catch (error) {
    console.error('[HEATMAP]', error)
    return NextResponse.json({ error: 'Failed to load heatmap' }, { status: 500 })
  }
}
