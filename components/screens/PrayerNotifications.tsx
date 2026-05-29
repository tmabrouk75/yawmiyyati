'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { calculatePrayerTimes, formatPrayerTime, minutesUntilPrayer, COUNTRY_METHOD, CalculationMethod } from '@/lib/prayer-times'

const T = {
  en: {
    title:       'Prayer Times & Notifications',
    back:        'Back',
    location:    'Your location',
    detecting:   'Detecting location...',
    noLocation:  'Location access denied. Notifications require your location.',
    enableLoc:   'Allow location',
    method:      'Calculation method',
    methods: {
      Egyptian:          'Egyptian General Authority',
      UmmAlQura:         'Umm al-Qura (Saudi)',
      MuslimWorldLeague: 'Muslim World League',
      Karachi:           'Karachi / South Asia',
      Dubai:             'Dubai (UAE)',
      Kuwait:            'Kuwait',
      Qatar:             'Qatar',
      Singapore:         'Singapore',
      NorthAmerica:      'North America (ISNA)',
    },
    prayers: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
    notifications:    'Prayer notifications',
    notifGranted:     'Notifications enabled ✓',
    notifDenied:      'Notifications blocked by browser. Enable in device settings.',
    notifDefault:     'Enable prayer notifications',
    notifSub:         'Get reminders before each prayer time',
    reminderBefore:   'Remind me before prayer',
    mins:             'min',
    next:             'Next prayer:',
    in:               'in',
    loading:          'Loading...',
    saveMethod:       'Save',
  },
  ar: {
    title:       'مواقيت الصلاة والتنبيهات',
    back:        'رجوع',
    location:    'موقعك',
    detecting:   'جارٍ تحديد الموقع...',
    noLocation:  'تم رفض الوصول للموقع. التنبيهات تحتاج لموقعك.',
    enableLoc:   'السماح بالموقع',
    method:      'طريقة الحساب',
    methods: {
      Egyptian:          'الهيئة المصرية العامة',
      UmmAlQura:         'أم القرى (السعودية)',
      MuslimWorldLeague: 'رابطة العالم الإسلامي',
      Karachi:           'كراتشي / جنوب آسيا',
      Dubai:             'دبي (الإمارات)',
      Kuwait:            'الكويت',
      Qatar:             'قطر',
      Singapore:         'سنغافورة',
      NorthAmerica:      'أمريكا الشمالية (ISNA)',
    },
    prayers: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
    notifications:    'تنبيهات الصلاة',
    notifGranted:     'التنبيهات مفعّلة ✓',
    notifDenied:      'التنبيهات محجوبة. فعّلها من إعدادات الجهاز.',
    notifDefault:     'تفعيل تنبيهات الصلاة',
    notifSub:         'تذكّر بقرب وقت كل صلاة',
    reminderBefore:   'تذكيري قبل الصلاة بـ',
    mins:             'دقيقة',
    next:             'الصلاة القادمة:',
    in:               'بعد',
    loading:          'جارٍ التحميل...',
    saveMethod:       'حفظ',
  },
}

const PRAYER_ICONS: Record<string, string> = {
  fajr: '🌙', sunrise: '🌅', dhuhr: '☀️', asr: '🌤', maghrib: '🌇', isha: '🌃',
}

const REMINDER_OPTIONS = [5, 10, 15, 20, 30]

export default function PrayerNotifications() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [coords,   setCoords]   = useState<{ lat: number; lng: number } | null>(null)
  const [locError, setLocError] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [times,    setTimes]    = useState<Record<string, Date> | null>(null)
  const [method,   setMethod]   = useState<CalculationMethod>('Egyptian')
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default')
  const [reminderMins, setReminderMins] = useState(10)
  const [nextPrayer, setNextPrayer] = useState<{ name: string; minutes: number } | null>(null)

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('yawmiyyati_prayer_prefs')
    if (saved) {
      const prefs = JSON.parse(saved)
      if (prefs.method)       setMethod(prefs.method)
      if (prefs.reminderMins) setReminderMins(prefs.reminderMins)
      if (prefs.lat && prefs.lng) setCoords({ lat: prefs.lat, lng: prefs.lng })
    }
    if ('Notification' in window) setNotifPerm(Notification.permission)
  }, [])

  // Calculate prayer times when coords or method changes
  useEffect(() => {
    if (!coords) return
    const today = new Date()
    const result = calculatePrayerTimes(today, coords.lat, coords.lng, method)
    setTimes(result as any)
    const next = minutesUntilPrayer(result)
    setNextPrayer(next)
  }, [coords, method])

  const detectLocation = useCallback(() => {
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c)
        setLocLoading(false)
        // Save to localStorage
        const saved = JSON.parse(localStorage.getItem('yawmiyyati_prayer_prefs') ?? '{}')
        localStorage.setItem('yawmiyyati_prayer_prefs', JSON.stringify({ ...saved, ...c }))
      },
      () => { setLocError(true); setLocLoading(false) }
    )
  }, [])

  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
    if (perm === 'granted') scheduleNotifications()
  }, [])

  const scheduleNotifications = useCallback(() => {
    if (!times || !coords) return

    const prefs = { method, reminderMins, lat: coords.lat, lng: coords.lng }
    localStorage.setItem('yawmiyyati_prayer_prefs', JSON.stringify(prefs))

    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then(reg => {
      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
      const now = Date.now()

      const alarms = prayers
        .map(name => {
          const prayerTime = (times as any)[name] as Date
          const notifTime  = prayerTime.getTime() - reminderMins * 60000
          if (notifTime <= now) return null
          const prayerName = t.prayers[name]
          return {
            key:        name,
            time:       notifTime,
            prayerName,
            body: lang === 'ar'
              ? `حان وقت ${prayerName} · يومياتي`
              : `${prayerName} time in ${reminderMins} min · Yawmiyyati`,
          }
        })
        .filter(Boolean)

      reg.active?.postMessage({ type: 'SCHEDULE_PRAYER_ALARMS', alarms })
    })
  }, [times, coords, method, reminderMins, lang, t.prayers])

  const savePrefs = () => {
    const prefs = { method, reminderMins, lat: coords?.lat, lng: coords?.lng }
    localStorage.setItem('yawmiyyati_prayer_prefs', JSON.stringify(prefs))
    if (notifPerm === 'granted') scheduleNotifications()
  }

  const PRAYERS_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* TOP BAR */}
      <div className={cn('flex items-center gap-3 px-4 pt-4 pb-2', dir === 'rtl' && 'flex-row-reverse')}>
        <button onClick={() => router.back()} className="text-[13px] text-gray-400">
          {dir === 'rtl' ? '›' : '‹'} {t.back}
        </button>
      </div>
      <div className={cn('px-4 pb-3', dir === 'rtl' && 'text-right')}>
        <h1 className="text-[18px] font-semibold text-gray-900">{t.title}</h1>
      </div>

      {/* LOCATION */}
      <p className={cn('mx-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal normal-case text-[11px]')}>
        {t.location}
      </p>
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-4">
        {locLoading ? (
          <p className={cn('text-[13px] text-gray-400', dir === 'rtl' && 'text-right')}>{t.detecting}</p>
        ) : locError ? (
          <p className={cn('text-[13px] text-red-500', dir === 'rtl' && 'text-right')}>{t.noLocation}</p>
        ) : coords ? (
          <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
            <div className={dir === 'rtl' ? 'text-right' : ''}>
              <p className="text-[12px] font-semibold text-emerald-700">📍 {t.location}</p>
              <p className="text-[11px] text-gray-400">{coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°</p>
              {nextPrayer && (
                <p className="text-[11px] text-gray-500 mt-1">
                  {t.next} {t.prayers[nextPrayer.name as keyof typeof t.prayers]} {t.in} {nextPrayer.minutes} {t.mins}
                </p>
              )}
            </div>
            <button onClick={detectLocation} className="text-[11px] text-emerald-600 border border-emerald-200 rounded-full px-3 py-1">
              ↻
            </button>
          </div>
        ) : (
          <button
            onClick={detectLocation}
            className="w-full py-[11px] rounded-[10px] bg-emerald-600 text-white text-[13px] font-semibold"
          >
            📍 {t.enableLoc}
          </button>
        )}
      </div>

      {/* PRAYER TIMES TABLE */}
      {times && (
        <>
          <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
            {PRAYERS_ORDER.map((name, i) => (
              <div key={name} className={cn(
                'flex items-center px-4 py-[10px] gap-3',
                i < PRAYERS_ORDER.length - 1 && 'border-b border-gray-100',
                dir === 'rtl' && 'flex-row-reverse'
              )}>
                <span className="text-[16px] w-6 text-center">{PRAYER_ICONS[name]}</span>
                <span className={cn('flex-1 text-[13px] text-gray-800', dir === 'rtl' && 'text-right')}>
                  {t.prayers[name as keyof typeof t.prayers]}
                </span>
                <span className="text-[14px] font-semibold text-gray-900 font-mono">
                  {formatPrayerTime((times as any)[name])}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CALCULATION METHOD */}
      <p className={cn('mx-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal normal-case text-[11px]')}>
        {t.method}
      </p>
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        <select
          value={method}
          onChange={e => setMethod(e.target.value as CalculationMethod)}
          dir={dir}
          className="w-full px-4 py-[13px] text-[13px] text-gray-800 bg-transparent border-none outline-none"
        >
          {Object.entries(t.methods).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* NOTIFICATIONS */}
      <p className={cn('mx-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal normal-case text-[11px]')}>
        {t.notifications}
      </p>
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        <div className={cn('px-4 py-[12px] border-b border-gray-100 flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
          <div className={dir === 'rtl' ? 'text-right' : ''}>
            <p className="text-[13px] text-gray-800">
              {notifPerm === 'granted' ? t.notifGranted : notifPerm === 'denied' ? t.notifDenied : t.notifDefault}
            </p>
            {notifPerm === 'default' && (
              <p className="text-[11px] text-gray-400 mt-[2px]">{t.notifSub}</p>
            )}
          </div>
          {notifPerm === 'default' && (
            <button
              onClick={requestNotifications}
              className="text-[12px] font-semibold text-white bg-emerald-600 rounded-full px-3 py-[6px]"
            >
              Enable
            </button>
          )}
          {notifPerm === 'granted' && (
            <span className="text-emerald-500 text-[18px]">✓</span>
          )}
        </div>

        {/* Reminder timing */}
        <div className={cn('px-4 py-[12px] flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
          <span className={cn('flex-1 text-[13px] text-gray-700', dir === 'rtl' && 'text-right')}>
            {t.reminderBefore}
          </span>
          <div className="flex gap-2">
            {REMINDER_OPTIONS.map(min => (
              <button
                key={min}
                onClick={() => setReminderMins(min)}
                className={cn(
                  'w-[36px] h-[28px] rounded-[7px] text-[11px] font-semibold border transition-all',
                  reminderMins === min
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                )}
              >
                {min}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-gray-400 flex-shrink-0">{t.mins}</span>
        </div>
      </div>

      {/* SAVE */}
      {coords && (
        <div className="px-4">
          <button
            onClick={savePrefs}
            className="w-full py-[13px] rounded-[14px] bg-emerald-600 text-white text-[14px] font-semibold"
          >
            {t.saveMethod}
          </button>
        </div>
      )}

    </div>
  )
}
