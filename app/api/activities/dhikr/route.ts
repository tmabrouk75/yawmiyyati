// ═══════════════════════════════════════════════════════════
// DHIKR LOG API — /api/activities/dhikr
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { processDhikrXp, checkAndAwardBadges } from '@/lib/xp/engine'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { date, ...fields } = body
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_dateGregorian: { userId: user.id, dateGregorian: dateObj } },
    })
    if (!dailyLog) return NextResponse.json({ error: 'Daily log not found' }, { status: 404 })

    const dhikrLog = await prisma.dhikrLog.upsert({
      where: { dailyLogId: dailyLog.id },
      create: { userId: user.id, dailyLogId: dailyLog.id, dateGregorian: dateObj, ...fields },
      update: fields,
    })

    await prisma.xpLog.deleteMany({
      where: { userId: user.id, dateGregorian: dateObj, reason: { in: ['morning_azkar', 'evening_azkar'] } },
    })

    const xpEarned = await processDhikrXp(user.id, dhikrLog, dateObj)
    await checkAndAwardBadges(user.id)

    return NextResponse.json({ dhikrLog, xpEarned })
  } catch (error) {
    console.error('[DHIKR POST]', error)
    return NextResponse.json({ error: 'Failed to save dhikr log' }, { status: 500 })
  }
}
