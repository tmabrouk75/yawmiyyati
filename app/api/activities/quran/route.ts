import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { processQuranXp, checkAndAwardBadges } from '@/lib/xp/engine'

// POST /api/activities/quran
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { date, surahChecks, ...fields } = body
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_dateGregorian: { userId: user.id, dateGregorian: dateObj } },
    })
    if (!dailyLog) return NextResponse.json({ error: 'Daily log not found' }, { status: 404 })

    // Upsert quran log
    const quranLog = await prisma.quranLog.upsert({
      where: { dailyLogId: dailyLog.id },
      create: { userId: user.id, dailyLogId: dailyLog.id, dateGregorian: dateObj, ...fields },
      update: fields,
    })

    // Update surah checks if provided
    if (surahChecks && Array.isArray(surahChecks)) {
      for (const check of surahChecks) {
        await prisma.surahDailyCheck.upsert({
          where: { quranLogId_userSurahId: { quranLogId: quranLog.id, userSurahId: check.userSurahId } },
          create: { quranLogId: quranLog.id, userSurahId: check.userSurahId, isDone: check.isDone },
          update: { isDone: check.isDone },
        })
      }
    }

    // Recalculate XP
    await prisma.xpLog.deleteMany({
      where: { userId: user.id, dateGregorian: dateObj, reason: { in: ['quran_pages', 'kahf_friday'] } },
    })

    const xpEarned = await processQuranXp(user.id, quranLog, dateObj)
    await checkAndAwardBadges(user.id)

    return NextResponse.json({ quranLog, xpEarned })
  } catch (error) {
    console.error('[QURAN POST]', error)
    return NextResponse.json({ error: 'Failed to save Quran log' }, { status: 500 })
  }
}
