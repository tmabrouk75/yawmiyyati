import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { subDays, startOfWeek, startOfMonth } from 'date-fns'
import { toHijri } from '@/lib/hijri'

type Period = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'

function getPeriodRange(period: Period, customFrom?: string, customTo?: string): { from: Date; to: Date } {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  switch (period) {
    case 'weekly':
      return { from: startOfWeek(now, { weekStartsOn: 6 }), to: now } // Sat-Fri
    case 'monthly':
      return { from: startOfMonth(now), to: now }
    case 'quarterly':
      return { from: subDays(now, 89), to: now }
    case 'yearly':
      return { from: new Date(now.getFullYear(), 0, 1), to: now }
    case 'custom':
      return {
        from: customFrom ? new Date(customFrom) : subDays(now, 29),
        to:   customTo   ? new Date(customTo)   : now,
      }
    default:
      return { from: subDays(now, 6), to: now }
  }
}

// GET /api/reporting/summary?period=weekly
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const period    = (searchParams.get('period') ?? 'weekly') as Period
    const customFrom = searchParams.get('from') ?? undefined
    const customTo   = searchParams.get('to')   ?? undefined

    const { from, to } = getPeriodRange(period, customFrom, customTo)
    from.setHours(0, 0, 0, 0)

    // ── Fetch all daily logs in range
    const logs = await prisma.dailyLog.findMany({
      where: { userId: user.id, dateGregorian: { gte: from, lte: to } },
      include: {
        prayerLog:  true,
        dhikrLog:   true,
        quranLog:   true,
        fastingLog: true,
        sadaqahLog: true,
      },
      orderBy: { dateGregorian: 'asc' },
    })

    const totalDays = logs.length
    if (totalDays === 0) {
      return NextResponse.json({ totalDays: 0, overallScore: 0, activities: [], streaks: [], fasting: {} })
    }

    // ── Per-activity completion rates
    const enabledActivities = await prisma.userActivity.findMany({
      where: { userId: user.id, isEnabled: true },
      include: { activityDefinition: true },
      orderBy: { sortOrder: 'asc' },
    })

    const activityStats = enabledActivities.map(ua => {
      const key = ua.activityDefinition.key
      let doneCount = 0

      logs.forEach(log => {
        const p = log.prayerLog
        const d = log.dhikrLog
        const q = log.quranLog
        const f = log.fastingLog
        const s = log.sadaqahLog

        if (key === 'fajr'          && p?.fajrDone)           doneCount++
        else if (key === 'dhuhr'    && p?.dhuhrDone)           doneCount++
        else if (key === 'asr'      && p?.asrDone)             doneCount++
        else if (key === 'maghrib'  && p?.maghribDone)         doneCount++
        else if (key === 'isha'     && p?.ishaDone)            doneCount++
        else if (key === 'duha'     && p?.duhaDone)            doneCount++
        else if (key === 'witr'     && p?.witrDone)            doneCount++
        else if (key === 'qiyam'    && (p?.qiyamRakaat ?? 0) > 0) doneCount++
        else if (key === 'morning_azkar' && d?.morningAzkarDone) doneCount++
        else if (key === 'evening_azkar' && d?.eveningAzkarDone) doneCount++
        else if (key === 'istighfar' && (d?.istighfarCount ?? 0) > 0) doneCount++
        else if (key === 'salawat'   && (d?.salawatCount ?? 0) > 0)   doneCount++
        else if (key === 'quran_pages' && (q?.pagesRead ?? 0) > 0)    doneCount++
        else if (key === 'sadaqah'  && s?.gave)                doneCount++
        else if (key === 'ramadan_fast'    && f?.isFasting)    doneCount++
        else if (key === 'monday_thursday' && f?.isFasting)    doneCount++
        else if (key === 'white_days'      && f?.isFasting)    doneCount++
      })

      const pct = Math.round((doneCount / totalDays) * 100)
      return {
        key,
        nameEn:   ua.activityDefinition.nameEn,
        nameAr:   ua.activityDefinition.nameAr,
        category: ua.activityDefinition.category,
        done:     doneCount,
        total:    totalDays,
        pct,
        status:   pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad',
      }
    })

    const overallScore = activityStats.length > 0
      ? Math.round(activityStats.reduce((sum, a) => sum + a.pct, 0) / activityStats.length)
      : 0

    // ── Streaks — count consecutive days per activity from most recent
    const allLogs = await prisma.dailyLog.findMany({
      where: { userId: user.id },
      include: { prayerLog: true, dhikrLog: true, quranLog: true, sadaqahLog: true },
      orderBy: { dateGregorian: 'desc' },
    })

    const streakData = enabledActivities.slice(0, 6).map(ua => {
      const key = ua.activityDefinition.key
      let current = 0; let best = 0; let running = 0; let counting = true

      allLogs.forEach(log => {
        const p = log.prayerLog; const d = log.dhikrLog
        const q = log.quranLog; const s = log.sadaqahLog
        let done = false

        if (key === 'fajr'       && p?.fajrDone)         done = true
        if (key === 'dhuhr'      && p?.dhuhrDone)         done = true
        if (key === 'asr'        && p?.asrDone)           done = true
        if (key === 'maghrib'    && p?.maghribDone)       done = true
        if (key === 'isha'       && p?.ishaDone)          done = true
        if (key === 'morning_azkar' && d?.morningAzkarDone) done = true
        if (key === 'evening_azkar' && d?.eveningAzkarDone) done = true
        if (key === 'quran_pages'   && (q?.pagesRead ?? 0) > 0) done = true
        if (key === 'sadaqah'       && s?.gave)           done = true

        if (done) {
          running++
          if (counting) current++
          if (running > best) best = running
        } else {
          counting = false
          running = 0
        }
      })

      return {
        key,
        nameEn:  ua.activityDefinition.nameEn,
        nameAr:  ua.activityDefinition.nameAr,
        current,
        best,
      }
    })

    // ── Overall streak (perfect days)
    let overallCurrent = 0; let overallBest = 0; let overallRunning = 0; let overallCounting = true
    allLogs.forEach(log => {
      const isPerfect = log.completionPct >= 100
      if (isPerfect) {
        overallRunning++
        if (overallCounting) overallCurrent++
        if (overallRunning > overallBest) overallBest = overallRunning
      } else {
        overallCounting = false
        overallRunning = 0
      }
    })

    // ── Fasting summary for the period
    const fastingLogs = await prisma.fastingLog.findMany({
      where: { userId: user.id, dateGregorian: { gte: from, lte: to } },
    })
    const qadaRecord = await prisma.qadaRecord.findFirst({
      where: { userId: user.id, ramadanYear: toHijri(new Date()).year },
    })

    const fastingSummary = {
      ramadanDays:      fastingLogs.filter(f => f.fastingType === 'RAMADAN'          && f.isFasting).length,
      mondayThursday:   fastingLogs.filter(f => f.fastingType === 'MONDAY_THURSDAY'  && f.isFasting).length,
      whiteDays:        fastingLogs.filter(f => f.fastingType === 'WHITE_DAYS'       && f.isFasting).length,
      voluntary:        fastingLogs.filter(f => f.fastingType === 'VOLUNTARY'        && f.isFasting).length,
      qadaRemaining:    qadaRecord ? qadaRecord.totalOwed - qadaRecord.totalCompensated : 0,
    }

    return NextResponse.json({
      period,
      from: from.toISOString(),
      to:   to.toISOString(),
      totalDays,
      overallScore,
      overallStreak: { current: overallCurrent, best: overallBest },
      activities: activityStats,
      streaks: streakData,
      fasting: fastingSummary,
    })
  } catch (error) {
    console.error('[REPORTING SUMMARY]', error)
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 })
  }
}
