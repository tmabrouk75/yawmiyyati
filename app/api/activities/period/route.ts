import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// POST /api/activities/period
// Body: { date: ISO string, isPeriod: boolean }
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { date, isPeriod } = await req.json()
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_dateGregorian: { userId: user.id, dateGregorian: dateObj } },
    })
    if (!dailyLog) {
      return NextResponse.json({ error: 'Daily log not found' }, { status: 404 })
    }

    await prisma.dailyLog.update({
      where: { id: dailyLog.id },
      data: { isPeriod },
    })

    return NextResponse.json({ isPeriod })
  } catch (error) {
    console.error('[PERIOD POST]', error)
    return NextResponse.json({ error: 'Failed to update period status' }, { status: 500 })
  }
}
