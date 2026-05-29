import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser, checkPremium } from '@/lib/auth'
import { subDays } from 'date-fns'
import { toHijri } from '@/lib/hijri'

// GET /api/export/csv?from=2026-01-01&to=2026-05-25
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isPremium = await checkPremium(user.id)
    if (!isPremium) {
      return NextResponse.json({ error: 'Export requires Premium', code: 'PREMIUM_REQUIRED' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const to   = searchParams.get('to')   ? new Date(searchParams.get('to')!)   : new Date()
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : subDays(to, 89)
    from.setHours(0, 0, 0, 0)
    to.setHours(23, 59, 59, 999)

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

    // Build CSV
    const headers = [
      'Date', 'Hijri Date',
      'Fajr', 'Fajr Qadaa',
      'Dhuhr', 'Dhuhr Qadaa',
      'Asr', 'Asr Qadaa',
      'Maghrib', 'Maghrib Qadaa',
      'Isha', 'Isha Qadaa',
      'Sunnah Before Fajr', 'Sunnah Before Dhuhr', 'Sunnah After Dhuhr',
      'Sunnah After Maghrib', 'Sunnah After Isha',
      'Fajr Azkar', 'Dhuhr Azkar', 'Asr Azkar', 'Maghrib Azkar', 'Isha Azkar',
      'Duha', 'Witr', 'Qiyam Rakaat',
      'Morning Azkar', 'Evening Azkar', 'Istighfar Count', 'Salawat Count',
      'Quran Pages', 'Fasting', 'Fasting Type', 'Sadaqah', 'Sadaqah Amount',
      'Completion %', 'Salah Perfect',
    ].join(',')

    const rows = logs.map(log => {
      const p = log.prayerLog
      const d = log.dhikrLog
      const q = log.quranLog
      const f = log.fastingLog
      const s = log.sadaqahLog
      const hijri = toHijri(log.dateGregorian)

      return [
        log.dateGregorian.toISOString().split('T')[0],
        `${hijri.day}/${hijri.month}/${hijri.year}`,
        p?.fajrDone ? 1 : 0,    p?.fajrIsQada ? 1 : 0,
        p?.dhuhrDone ? 1 : 0,   p?.dhuhrIsQada ? 1 : 0,
        p?.asrDone ? 1 : 0,     p?.asrIsQada ? 1 : 0,
        p?.maghribDone ? 1 : 0, p?.maghribIsQada ? 1 : 0,
        p?.ishaDone ? 1 : 0,    p?.ishaIsQada ? 1 : 0,
        p?.fajrBefore ? 1 : 0, p?.dhuhrBefore ? 1 : 0, p?.dhuhrAfter ? 1 : 0,
        p?.maghribAfter ? 1 : 0, p?.ishaAfter ? 1 : 0,
        p?.fajrAzkar ? 1 : 0, p?.dhuhrAzkar ? 1 : 0, p?.asrAzkar ? 1 : 0,
        p?.maghribAzkar ? 1 : 0, p?.ishaAzkar ? 1 : 0,
        p?.duhaDone ? 1 : 0, p?.witrDone ? 1 : 0, p?.qiyamRakaat ?? 0,
        d?.morningAzkarDone ? 1 : 0, d?.eveningAzkarDone ? 1 : 0,
        d?.istighfarCount ?? 0, d?.salawatCount ?? 0,
        q?.pagesRead ?? 0,
        f?.isFasting ? 1 : 0, f?.fastingType ?? '',
        s?.gave ? 1 : 0, s?.amount ?? '',
        Math.round(log.completionPct),
        log.salahPerfect ? 1 : 0,
      ].join(',')
    })

    const csv = [headers, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="yawmiyyati-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('[EXPORT CSV]', error)
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
  }
}
