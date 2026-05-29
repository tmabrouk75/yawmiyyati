import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { toHijri, getSeasonalActivities } from '@/lib/hijri'

// GET /api/activities/today
// Returns today's full log for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const hijri = toHijri(today)
    const seasonal = getSeasonalActivities(today)

    // Find or create daily log
    let dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_dateGregorian: { userId: user.id, dateGregorian: today } },
      include: {
        prayerLog: true,
        dhikrLog: true,
        quranLog: {
          include: { surahChecks: { include: { userSurah: true } } }
        },
        fastingLog: true,
        sadaqahLog: true,
      },
    })

    if (!dailyLog) {
      dailyLog = await prisma.dailyLog.create({
        data: {
          userId: user.id,
          dateGregorian: today,
          dateHijriYear: hijri.year,
          dateHijriMonth: hijri.month,
          dateHijriDay: hijri.day,
        },
        include: {
          prayerLog: true,
          dhikrLog: true,
          quranLog: { include: { surahChecks: { include: { userSurah: true } } } },
          fastingLog: true,
          sadaqahLog: true,
        },
      })
    }

    // Get user's enabled activities
    const userActivities = await prisma.userActivity.findMany({
      where: { userId: user.id, isEnabled: true },
      include: { activityDefinition: true },
      orderBy: { sortOrder: 'asc' },
    })

    // Get Qada' remaining
    const qada = await prisma.qadaRecord.findFirst({
      where: { userId: user.id, ramadanYear: hijri.year },
    })

    // Get user surahs
    const userSurahs = await prisma.userSurah.findMany({
      where: { userId: user.id, isEnabled: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({
      dailyLog,
      hijri,
      seasonal,
      userActivities: userActivities.map(a => ({
        key: a.activityDefinition.key,
        nameEn: a.activityDefinition.nameEn,
        nameAr: a.activityDefinition.nameAr,
        category: a.activityDefinition.category,
        trackingType: a.activityDefinition.trackingType,
        sortOrder: a.sortOrder,
      })),
      qadaRemaining: qada ? qada.totalOwed - qada.totalCompensated : 0,
      userSurahs,
    })
  } catch (error) {
    console.error('[TODAY GET]', error)
    return NextResponse.json({ error: 'Failed to load today\'s log' }, { status: 500 })
  }
}
