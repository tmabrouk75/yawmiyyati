import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'

export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const now   = new Date()
    const day7  = new Date(now); day7.setDate(day7.getDate() - 7);   day7.setHours(0,0,0,0)
    const day14 = new Date(now); day14.setDate(day14.getDate() - 14); day14.setHours(0,0,0,0)
    const day30 = new Date(now); day30.setDate(day30.getDate() - 30); day30.setHours(0,0,0,0)

    // ── Core counts ──────────────────────────────────────────────
    const [
      totalUsers,
      premiumUsers,
      newUsersMonth,
      newUsersWeek,
      newUsersPrevWeek,
      onboardingDone,
      totalGroups,
      activeGroups,
      totalDailyLogs,
      totalPagesRead,
      totalIstighfar,
      totalSalawat,
      totalReferrals,
      referralsSent,
      referralsPending,
      referralsActivated,
      totalRedemptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isPremium: true, isAdmin: false } }),
      prisma.user.count({ where: { createdAt: { gte: day30 } } }),
      prisma.user.count({ where: { createdAt: { gte: day7  } } }),
      prisma.user.count({ where: { createdAt: { gte: day14, lt: day7 } } }),
      prisma.user.count({ where: { onboardingDone: true } }),
      prisma.group.count(),
      prisma.group.count({ where: { isActive: true } }),
      prisma.dailyLog.count(),
      prisma.quranLog.aggregate({ _sum: { pagesRead: true } }),
      prisma.dhikrLog.aggregate({ _sum: { istighfarCount: true } }),
      prisma.dhikrLog.aggregate({ _sum: { salawatCount: true } }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: 'SENT' } }),
      prisma.referral.count({ where: { status: 'PENDING' } }),
      prisma.referral.count({ where: { status: 'ACTIVATED' } }),
      prisma.pointRedemption.count(),
    ])

    // ── Active users this week ───────────────────────────────────
    const activeUsersWeekRaw = await prisma.dailyLog.groupBy({
      by: ['userId'],
      where: { dateGregorian: { gte: day7 } },
      _count: true,
    })
    const activeThisWeek = activeUsersWeekRaw.length

    // ── Conversion funnel ────────────────────────────────────────
    const loggedAtLeastOnceRaw = await prisma.dailyLog.groupBy({ by: ['userId'] })
    const loggedAtLeastOnce = loggedAtLeastOnceRaw.length

    // ── Streak health ────────────────────────────────────────────
    // 7-day streak: users with 7+ log days in last 7 days
    const streak7Raw = await prisma.dailyLog.groupBy({
      by: ['userId'],
      where: { dateGregorian: { gte: day7 } },
      _count: { userId: true },
      having: { userId: { _count: { gte: 7 } } },
    })
    const streak7plus = streak7Raw.length

    // 30-day streak: users with 28+ log days in last 30 days
    const streak30Raw = await prisma.dailyLog.groupBy({
      by: ['userId'],
      where: { dateGregorian: { gte: day30 } },
      _count: { userId: true },
      having: { userId: { _count: { gte: 28 } } },
    })
    const streak30plus = streak30Raw.length

    // At-risk: ever logged but not in last 14 days
    const recentActiveSet = new Set(
      (await prisma.dailyLog.groupBy({
        by: ['userId'],
        where: { dateGregorian: { gte: day14 } },
      })).map(u => u.userId)
    )
    const atRisk = loggedAtLeastOnceRaw.filter(u => !recentActiveSet.has(u.userId)).length

    // ── Acquisition channel breakdown ────────────────────────────
    const channelGroups = await prisma.user.groupBy({
      by: ['acquisitionChannel'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    })

    // ── 14-day sparkline (single query) ─────────────────────────
    const day14Spark = new Date(now); day14Spark.setDate(day14Spark.getDate() - 13); day14Spark.setHours(0,0,0,0)
    const rawLogs = await prisma.dailyLog.findMany({
      where:  { dateGregorian: { gte: day14Spark } },
      select: { dateGregorian: true },
    })
    const logBuckets: Record<string, number> = {}
    for (const l of rawLogs) {
      const key = l.dateGregorian.toISOString().split('T')[0]
      logBuckets[key] = (logBuckets[key] ?? 0) + 1
    }
    const last14: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
      const key = d.toISOString().split('T')[0]
      last14.push({ date: key, count: logBuckets[key] ?? 0 })
    }

    return NextResponse.json({
      users: {
        total:          totalUsers,
        premium:        premiumUsers,
        newThisMonth:   newUsersMonth,
        newThisWeek:    newUsersWeek,
        newPrevWeek:    newUsersPrevWeek,
        activeThisWeek: activeThisWeek,
      },
      funnel: {
        registered:       totalUsers,
        onboardingDone:   onboardingDone,
        loggedAtLeastOnce: loggedAtLeastOnce,
        activeThisWeek:   activeThisWeek,
        premium:          premiumUsers,
      },
      health: {
        streak7plus,
        streak30plus,
        atRisk,
      },
      groups: {
        total:  totalGroups,
        active: activeGroups,
      },
      activity: {
        totalDailyLogs,
        avgLogsPerUser:      totalUsers > 0 ? +(totalDailyLogs / totalUsers).toFixed(1) : 0,
        avgPagesPerUser:     totalUsers > 0 ? +(((totalPagesRead._sum.pagesRead ?? 0) / totalUsers)).toFixed(1) : 0,
        avgIstighfarPerUser: totalUsers > 0 ? Math.round((totalIstighfar._sum.istighfarCount ?? 0) / totalUsers) : 0,
        avgSalawatPerUser:   totalUsers > 0 ? Math.round((totalSalawat._sum.salawatCount ?? 0) / totalUsers) : 0,
        totalPagesRead:    totalPagesRead._sum.pagesRead    ?? 0,
        totalIstighfar:    totalIstighfar._sum.istighfarCount ?? 0,
        totalSalawat:      totalSalawat._sum.salawatCount     ?? 0,
      },
      chart: last14,
      referrals: {
        total:       totalReferrals,
        sent:        referralsSent,
        pending:     referralsPending,
        activated:   referralsActivated,
        redemptions: totalRedemptions,
        activationRate: referralsSent > 0 ? Math.round((referralsActivated / referralsSent) * 100) : 0,
      },
      acquisition: channelGroups.map(g => ({
        channel: g.acquisitionChannel ?? 'unknown',
        count:   g._count.id,
      })),
    })
  } catch (err) {
    console.error('[admin/stats]', err)
    return NextResponse.json({ error: 'Failed to load stats', detail: String(err) }, { status: 500 })
  }
}
