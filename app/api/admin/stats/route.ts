import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'

// GET /api/admin/stats
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const now    = new Date()
  const day30  = new Date(now); day30.setDate(day30.getDate() - 30)
  const day7   = new Date(now); day7.setDate(day7.getDate() - 7)

  const [
    totalUsers,
    premiumUsers,
    newUsersMonth,
    newUsersWeek,
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

  // Active users — logged at least 1 day in last 7 days
  const activeUsersWeek = await prisma.dailyLog.groupBy({
    by: ['userId'],
    where: { dateGregorian: { gte: day7 } },
    _count: true,
  })

  // Acquisition channel breakdown
  const channelGroups = await prisma.user.groupBy({
    by: ['acquisitionChannel'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  // Daily logs per day — last 14 days for sparkline
  const last14: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const count = await prisma.dailyLog.count({
      where: { dateGregorian: { gte: d, lt: next } },
    })
    last14.push({ date: d.toISOString().split('T')[0], count })
  }

  return NextResponse.json({
    users: {
      total:         totalUsers,
      premium:       premiumUsers,
      newThisMonth:  newUsersMonth,
      newThisWeek:   newUsersWeek,
      activeThisWeek:activeUsersWeek.length,
    },
    groups: {
      total:  totalGroups,
      active: activeGroups,
    },
    activity: {
      totalDailyLogs,
      // Per-user adoption averages (avoid divide-by-zero)
      avgLogsPerUser:    totalUsers > 0 ? +(totalDailyLogs / totalUsers).toFixed(1) : 0,
      avgPagesPerUser:   totalUsers > 0 ? +(((totalPagesRead._sum.pagesRead ?? 0) / totalUsers)).toFixed(1) : 0,
      avgIstighfarPerUser: totalUsers > 0 ? Math.round((totalIstighfar._sum.istighfarCount ?? 0) / totalUsers) : 0,
      avgSalawatPerUser:   totalUsers > 0 ? Math.round((totalSalawat._sum.salawatCount     ?? 0) / totalUsers) : 0,
      totalPagesRead:    totalPagesRead._sum.pagesRead    ?? 0,
      totalIstighfar:    totalIstighfar._sum.istighfarCount ?? 0,
      totalSalawat:      totalSalawat._sum.salawatCount     ?? 0,
    },
    chart: last14,
    referrals: {
      total:      totalReferrals,
      sent:       referralsSent,
      pending:    referralsPending,
      activated:  referralsActivated,
      redemptions: totalRedemptions,
    },
    acquisition: channelGroups.map(g => ({
      channel: g.acquisitionChannel ?? 'unknown',
      count:   g._count.id,
    })),
  })
}
