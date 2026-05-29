import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { calculatePrayerTimes, COUNTRY_METHOD, CalculationMethod } from '@/lib/prayer-times'

// GET /api/prayer-times?lat=30.06&lng=31.24&date=2026-05-25
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const lat    = parseFloat(searchParams.get('lat') ?? '21.3891')  // Makkah default
    const lng    = parseFloat(searchParams.get('lng') ?? '39.8579')
    const dateStr = searchParams.get('date') ?? new Date().toISOString().split('T')[0]
    const date   = new Date(dateStr)

    const method: CalculationMethod =
      COUNTRY_METHOD[user.country ?? 'EG'] ?? 'Egyptian'

    const times = calculatePrayerTimes(date, lat, lng, method)

    return NextResponse.json({
      method,
      date: dateStr,
      times: {
        fajr:    times.fajr.toISOString(),
        sunrise: times.sunrise.toISOString(),
        dhuhr:   times.dhuhr.toISOString(),
        asr:     times.asr.toISOString(),
        maghrib: times.maghrib.toISOString(),
        isha:    times.isha.toISOString(),
      },
    })
  } catch (error) {
    console.error('[PRAYER TIMES]', error)
    return NextResponse.json({ error: 'Failed to calculate prayer times' }, { status: 500 })
  }
}
