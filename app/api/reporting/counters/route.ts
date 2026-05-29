import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { subDays, startOfWeek } from 'date-fns'

// GET /api/reporting/counters
// Returns Istighfar + Salawat totals and 8-week trend
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today    = new Date(); today.setHours(23, 59, 59, 999)
    const weekAgo  = subDays(today, 6);  weekAgo.setHours(0,0,0,0)
    const monthAgo = subDays(today, 29); monthAgo.setHours(0,0,0,0)

    // All-time totals
    const allTime = await prisma.dhikrLog.aggregate({
      where: { userId: user.id },
      _sum: { istighfarCount: true, salawatCount: true },
    })

    // This month
    const thisMonth = await prisma.dhikrLog.aggregate({
      where: { userId: user.id, dateGregorian: { gte: monthAgo } },
      _sum: { istighfarCount: true, salawatCount: true },
    })

    // This week
    const thisWeek = await prisma.dhikrLog.aggregate({
      where: { userId: user.id, dateGregorian: { gte: weekAgo } },
      _sum: { istighfarCount: true, salawatCount: true },
    })

    // Today
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const todayData = await prisma.dhikrLog.findFirst({
      where: { userId: user.id, dateGregorian: { gte: todayStart } },
      select: { istighfarCount: true, salawatCount: true },
    })

    // 8-week trend — weekly totals
    const trendData: { week: string; istighfar: number; salawat: number }[] = []
    for (let w = 7; w >= 0; w--) {
      const weekStart = startOfWeek(subDays(today, w * 7), { weekStartsOn: 6 })
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekly = await prisma.dhikrLog.aggregate({
        where: { userId: user.id, dateGregorian: { gte: weekStart, lte: weekEnd } },
        _sum: { istighfarCount: true, salawatCount: true },
      })

      trendData.push({
        week:       weekStart.toISOString().split('T')[0],
        istighfar:  weekly._sum.istighfarCount ?? 0,
        salawat:    weekly._sum.salawatCount   ?? 0,
      })
    }

    return NextResponse.json({
      istighfar: {
        today:    todayData?.istighfarCount  ?? 0,
        week:     thisWeek._sum.istighfarCount  ?? 0,
        month:    thisMonth._sum.istighfarCount ?? 0,
        allTime:  allTime._sum.istighfarCount   ?? 0,
      },
      salawat: {
        today:    todayData?.salawatCount    ?? 0,
        week:     thisWeek._sum.salawatCount    ?? 0,
        month:    thisMonth._sum.salawatCount   ?? 0,
        allTime:  allTime._sum.salawatCount     ?? 0,
      },
      trend: trendData,
    })
  } catch (error) {
    console.error('[COUNTERS]', error)
    return NextResponse.json({ error: 'Failed to load counters' }, { status: 500 })
  }
}
