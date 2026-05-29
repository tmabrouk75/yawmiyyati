import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { processFastingXp, checkAndAwardBadges } from '@/lib/xp/engine'
import { toHijri } from '@/lib/hijri'

// POST /api/activities/fasting
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { date, isFasting, fastingType, isQada, comment } = body
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_dateGregorian: { userId: user.id, dateGregorian: dateObj } },
    })
    if (!dailyLog) return NextResponse.json({ error: 'Daily log not found' }, { status: 404 })

    // Get previous state to check if Qada' changed
    const previous = await prisma.fastingLog.findUnique({ where: { dailyLogId: dailyLog.id } })
    const wasQada = previous?.isQada ?? false

    const fastingLog = await prisma.fastingLog.upsert({
      where: { dailyLogId: dailyLog.id },
      create: {
        userId: user.id,
        dailyLogId: dailyLog.id,
        dateGregorian: dateObj,
        isFasting: isFasting ?? false,
        fastingType: fastingType ?? 'VOLUNTARY',
        isQada: isQada ?? false,
        comment: comment ?? null,
      },
      update: {
        isFasting: isFasting ?? false,
        fastingType: fastingType ?? 'VOLUNTARY',
        isQada: isQada ?? false,
        comment: comment ?? null,
      },
    })

    // ── Qada' counter logic ──────────────────────────────
    const hijri = toHijri(dateObj)

    // Find qada record for the current Ramadan year
    const qadaRecord = await prisma.qadaRecord.findFirst({
      where: { userId: user.id, ramadanYear: hijri.year },
    })

    if (qadaRecord) {
      let compensatedDelta = 0
      if (!wasQada && isQada && isFasting) compensatedDelta = 1   // newly marked as Qada'
      if (wasQada && (!isQada || !isFasting)) compensatedDelta = -1 // unmarked as Qada'

      if (compensatedDelta !== 0) {
        await prisma.qadaRecord.update({
          where: { id: qadaRecord.id },
          data: {
            totalCompensated: {
              increment: compensatedDelta,
            },
          },
        })
      }
    }

    // XP
    await prisma.xpLog.deleteMany({
      where: { userId: user.id, dateGregorian: dateObj, reason: { in: ['fasting', 'qada_fast'] } },
    })

    const xpEarned = await processFastingXp(user.id, fastingLog, dateObj)
    await checkAndAwardBadges(user.id)

    // Return updated Qada' remaining
    const updatedQada = await prisma.qadaRecord.findFirst({
      where: { userId: user.id, ramadanYear: hijri.year },
    })
    const qadaRemaining = updatedQada
      ? updatedQada.totalOwed - updatedQada.totalCompensated
      : 0

    return NextResponse.json({ fastingLog, xpEarned, qadaRemaining })
  } catch (error) {
    console.error('[FASTING POST]', error)
    return NextResponse.json({ error: 'Failed to save fasting log' }, { status: 500 })
  }
}
