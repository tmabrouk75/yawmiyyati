'use client'

import { useState, useEffect } from 'react'
import { calculatePrayerTimes, minutesUntilPrayer, COUNTRY_METHOD, CalculationMethod } from '@/lib/prayer-times'
import { cn } from '@/lib/utils'

interface NextPrayerChipProps {
  country: string
  lang:    'en' | 'ar'
  dir:     'ltr' | 'rtl'
}

const PRAYER_NAMES_EN: Record<string, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' }
const PRAYER_NAMES_AR: Record<string, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' }

export default function NextPrayerChip({ country, lang, dir }: NextPrayerChipProps) {
  const [nextPrayer, setNextPrayer] = useState<{ name: string; minutes: number } | null>(null)
  const [coords,     setCoords]     = useState<{ lat: number; lng: number } | null>(null)

  // Load saved coords from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('yawmiyyati_prayer_prefs')
    if (saved) {
      const prefs = JSON.parse(saved)
      if (prefs.lat && prefs.lng) setCoords({ lat: prefs.lat, lng: prefs.lng })
    }
  }, [])

  // Recalculate every minute
  useEffect(() => {
    if (!coords) return
    const calc = () => {
      const method: CalculationMethod = COUNTRY_METHOD[country] ?? 'Egyptian'
      const times = calculatePrayerTimes(new Date(), coords.lat, coords.lng, method)
      setNextPrayer(minutesUntilPrayer(times))
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [coords, country])

  if (!nextPrayer || !coords) return null

  const prayerName = lang === 'ar'
    ? PRAYER_NAMES_AR[nextPrayer.name] ?? nextPrayer.name
    : PRAYER_NAMES_EN[nextPrayer.name] ?? nextPrayer.name

  const timeLabel = nextPrayer.minutes < 60
    ? lang === 'ar' ? `بعد ${nextPrayer.minutes} دقيقة` : `in ${nextPrayer.minutes} min`
    : lang === 'ar'
      ? `بعد ${Math.floor(nextPrayer.minutes / 60)} س ${nextPrayer.minutes % 60} د`
      : `in ${Math.floor(nextPrayer.minutes / 60)}h ${nextPrayer.minutes % 60}m`

  // Urgent if < 15 min
  const isUrgent = nextPrayer.minutes < 15

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-[5px] rounded-full border text-[11px] font-medium transition-all',
      isUrgent
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700',
      dir === 'rtl' && 'flex-row-reverse'
    )}>
      <span>{isUrgent ? '⏰' : '🕌'}</span>
      <span>{prayerName}</span>
      <span className="opacity-70">{timeLabel}</span>
    </div>
  )
}
