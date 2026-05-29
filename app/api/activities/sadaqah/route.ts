import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { processSadaqahXp, checkAndAwardBadges } from '@/lib/xp/engine'

// POST /api/activities/sadaqah
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { date, gave, amount, currency } = body
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_dateGregorian: { userId: user.id, dateGregorian: dateObj } },
    })
    if (!dailyLog) return NextResponse.json({ error: 'Daily log not found' }, { status: 404 })

    const sadaqahLog = await prisma.sadaqahLog.upsert({
      where: { dailyLogId: dailyLog.id },
      create: {
        userId: user.id,
        dailyLogId: dailyLog.id,
        dateGregorian: dateObj,
        gave: gave ?? false,
        amount: amount ?? null,
        currency: currency ?? 'EGP',
      },
      update: {
        gave: gave ?? false,
        amount: amount ?? null,
        currency: currency ?? 'EGP',
      },
    })

    await prisma.xpLog.deleteMany({
      where: { userId: user.id, dateGregorian: dateObj, reason: 'sadaqah' },
    })

    const xpEarned = await processSadaqahXp(user.id, sadaqahLog, dateObj)
    await checkAndAwardBadges(user.id)

    return NextResponse.json({ sadaqahLog, xpEarned })
  } catch (error) {
    console.error('[SADAQAH POST]', error)
    return NextResponse.json({ error: 'Failed to save sadaqah log' }, { status: 500 })
  }
}
