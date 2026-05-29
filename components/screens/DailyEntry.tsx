'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { CheckBox, FardCheckBox, FardState, NumberInput, ActivityGroup, ActivityRow } from '@/components/ui/ActivityComponents'
import DayScoreCard from '@/components/ui/DayScoreCard'
import NextPrayerChip from '@/components/ui/NextPrayerChip'
import { computeDayScore, getSalahPerfect } from '@/lib/scoring/client'
import { formatDate, addDays } from '@/lib/utils'
import { formatHijri, toHijri } from '@/lib/hijri'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    today: 'Today', salah: 'Salah', dhikr: 'Dhikr & Azkar',
    quran: 'Quran', fasting: 'Fasting', sadaqah: 'Sadaqah',
    // Prayer labels
    fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
    // Column headers
    sunBef: 'Sunnah\nBefore', fard: 'Fard', sunAft: 'Sunnah\nAfter', azkar: 'Azkar',
    // Other salah
    duha: 'Duha', witr: 'Witr',
    qiyam: 'Qiyam al-Layl', qiyamS: 'Enter rakaat count',
    jumuah: "Jumu'ah", taraweeh: 'Taraweeh',
    eidFitr: 'Eid al-Fitr Salat', eidAdha: 'Eid al-Adha Salat',
    // Dhikr
    morning: 'Morning Azkar', evening: 'Evening Azkar',
    istighfar: 'Istighfar', istighfarS: "Enter today's count",
    salawat: 'Salawat ﷺ', salawatS: "Enter today's count",
    tasbih: 'Tasbih (33×3)', tasbihS: 'Total count today',
    // Quran
    pages: 'Quran Reading', pagesS: 'Pages today',
    surahs: 'Daily Surahs',
    // Fasting
    fastToday: 'Fasting today', fastMon: 'Monday · Sunnah fast',
    fastThu: 'Thursday · Sunnah fast', fastRam: 'Ramadan fasting',
    fastWhite: 'White Days fast', fastVol: 'Voluntary fast',
    fastQada: 'Qadaa fast (making up missed)',
    qada: "Ramadan Qada'",
    qdaRemaining: (n: number) => `${n} day${n !== 1 ? 's' : ''} remaining`,
    qdaCountBtn: "Count today as Qada'",
    // Sadaqah
    sadaqahLabel: 'Gave Sadaqah today', amountPh: 'Amount (optional)',
    saving: 'Saving...', saved: 'Saved ✓',
    period: 'Days of Special Time', periodSub: 'Prayers are exempt · streak protected',
  },
  ar: {
    today: 'اليوم', salah: 'الصلاة', dhikr: 'الذكر والأذكار',
    quran: 'القرآن الكريم', fasting: 'الصيام', sadaqah: 'الصدقة',
    fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
    sunBef: 'سنة\nقبل', fard: 'فرض', sunAft: 'سنة\nبعد', azkar: 'أذكار',
    duha: 'الضحى', witr: 'الوتر',
    qiyam: 'قيام الليل', qiyamS: 'أدخل عدد الركعات',
    jumuah: 'الجمعة', taraweeh: 'التراويح',
    eidFitr: 'صلاة عيد الفطر', eidAdha: 'صلاة عيد الأضحى',
    morning: 'أذكار الصباح', evening: 'أذكار المساء',
    istighfar: 'الاستغفار', istighfarS: 'أدخل عدد اليوم',
    salawat: 'الصلاة على النبي ﷺ', salawatS: 'أدخل عدد اليوم',
    tasbih: 'التسبيح (٣٣×٣)', tasbihS: 'العدد الإجمالي اليوم',
    pages: 'تلاوة القرآن', pagesS: 'عدد الصفحات اليوم',
    surahs: 'السور اليومية',
    fastToday: 'الصيام اليوم', fastMon: 'الاثنين · صيام سنة',
    fastThu: 'الخميس · صيام سنة', fastRam: 'صيام رمضان',
    fastWhite: 'صيام الأيام البيض', fastVol: 'صيام تطوع',
    fastQada: 'صيام قضاء (تعويض فائت)',
    qada: 'قضاء رمضان',
    qdaRemaining: (n: number) => `${n} أيام متبقية`,
    qdaCountBtn: 'احتساب اليوم قضاءً',
    sadaqahLabel: 'تصدّقت اليوم', amountPh: 'المبلغ (اختياري)',
    saving: 'جارٍ الحفظ...', saved: 'تم الحفظ ✓',
    period: 'أيام الظروف الخاصة', periodSub: 'الصلاة معفو عنها · السلسلة محفوظة',
  },
}

// ─── PRAYER CONFIG ────────────────────────────────────────
// hasBefore / hasAfter: whether this prayer has confirmed sunnah rawatib
// rakaat shown as subtitle

const PRAYERS_FAJR = [
  { key: 'fajr',    hasBefore: true,  hasAfter: false, rakaat: 2  },
] as const

const PRAYERS_MAIN = [
  { key: 'dhuhr',   hasBefore: true,  hasAfter: true,  rakaat: 4  },
  { key: 'asr',     hasBefore: false, hasAfter: false, rakaat: 4  },
  { key: 'maghrib', hasBefore: false, hasAfter: true,  rakaat: 3  },
  { key: 'isha',    hasBefore: false, hasAfter: true,  rakaat: 4  },
] as const

// Combined for any code that still references PRAYERS
const PRAYERS = [...PRAYERS_FAJR, ...PRAYERS_MAIN] as const

// ─── SUNNAH-ALIGNED ROW ───────────────────────────────────
// Checkbox sits in the Sunnah-After column so it lines up with the prayer table above
function SunnahAlignedRow({
  icon, label, checked, onChange,
  showSunnah, showAzkar, showMosque = false, dir, isFirst = false,
}: {
  icon: string; label: string; checked: boolean
  onChange: (v: boolean) => void
  showSunnah: boolean; showAzkar: boolean
  showMosque?: boolean  // placeholder to keep column alignment for male users
  dir: 'ltr' | 'rtl'; isFirst?: boolean
}) {
  return (
    <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
      <span className="text-[14px] w-5 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1 text-[13px] text-gray-700">{label}</span>
      {/* Mirror the column grid of PrayerRow — keep alignment with fard rows */}
      <div className={`flex items-center gap-[10px] flex-shrink-0 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
        {showMosque && <div className="w-[22px] h-[22px]"/>}{/* Mosque placeholder */}
        {showSunnah && <div className="w-[22px] h-[22px]"/>}{/* SunBef placeholder */}
        <div className="w-[22px] h-[22px]"/>{/* Fard placeholder */}
        <CheckBox checked={checked} onChange={onChange}/>
        {showAzkar && <div className="w-[22px] h-[22px]"/>}{/* Azkar placeholder */}
      </div>
    </div>
  )
}

// ─── PRAYER ROW ───────────────────────────────────────────

interface PrayerState {
  // Fard state (3-state each)
  fajrDone:     boolean; fajrIsQada:    boolean
  dhuhrDone:    boolean; dhuhrIsQada:   boolean
  asrDone:      boolean; asrIsQada:     boolean
  maghribDone:  boolean; maghribIsQada: boolean
  ishaDone:     boolean; ishaIsQada:    boolean
  // Mosque (Jama'ah) — male users only
  fajrMosque:    boolean
  dhuhrMosque:   boolean
  asrMosque:     boolean
  maghribMosque: boolean
  ishaMosque:    boolean
  // Sunnah rawatib
  fajrBefore:   boolean
  dhuhrBefore:  boolean; dhuhrAfter:    boolean
  maghribAfter: boolean
  ishaAfter:    boolean
  // Azkar per prayer
  fajrAzkar:    boolean
  dhuhrAzkar:   boolean
  asrAzkar:     boolean
  maghribAzkar: boolean
  ishaAzkar:    boolean
  // Other
  duhaDone:    boolean
  witrDone:    boolean
  qiyamRakaat: number
  // Special prayers
  taraweehDone?: boolean
  eidFitrDone?:  boolean
  eidAdhaDone?:  boolean
}

// Convert two booleans ↔ FardState enum
function getFardState(done: boolean, isQada: boolean): FardState {
  if (isQada)     return 'qadaa'
  if (done)       return 'done'
  return 'unchecked'
}
function fardStateToBools(s: FardState) {
  return { done: s !== 'unchecked', isQada: s === 'qadaa' }
}

function PrayerRow({
  pKey, hasBefore, hasAfter, hasAzkar, isMale, rakaat, state, onChange, onFardChange, lang, dir, t,
  overrideLabel, overrideSub,
}: {
  pKey:           'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
  hasBefore:      boolean
  hasAfter:       boolean
  hasAzkar:       boolean
  isMale:         boolean   // show mosque column
  rakaat:         number
  state:          PrayerState
  onChange:       (key: string, val: any) => void
  onFardChange:   (pKey: string, done: boolean, isQada: boolean) => void
  lang:           'en' | 'ar'
  dir:            'ltr' | 'rtl'
  t:              typeof T['en']
  overrideLabel?: string
  overrideSub?:   string
}) {
  const fardState = getFardState(
    (state as any)[`${pKey}Done`],
    (state as any)[`${pKey}IsQada`]
  )

  const handleFard = (next: FardState) => {
    const { done, isQada } = fardStateToBools(next)
    onFardChange(pKey, done, isQada)
  }

  const label = overrideLabel ?? (t[pKey as keyof typeof t] as string)
  const sub   = overrideSub ?? (lang === 'ar' ? `فرض · ${rakaat} ركعات` : `Fard · ${rakaat} rakaat`)
  const mosqueChecked = (state as any)[`${pKey}Mosque`] ?? false

  return (
    <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>

      {/* Prayer name */}
      <div className={`flex-1 min-w-0 ${dir === 'rtl' ? 'text-right' : ''}`}>
        <div className="text-[13px] font-medium text-gray-900">{label}</div>
        <div className="text-[10px] text-gray-400 mt-[1px]">{sub}</div>
        {fardState === 'qadaa' && (
          <span className="text-[9px] font-semibold text-red-700 mt-[2px] block">
            {lang === 'ar' ? '● قضاء' : '● Qadaa'}
          </span>
        )}
      </div>

      {/* Checkbox columns */}
      <div className={`flex items-center gap-[10px] flex-shrink-0 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>

        {/* Mosque (Jama'ah) column — males only, leftmost */}
        {isMale && (
          <CheckBox
            checked={mosqueChecked}
            onChange={v => onChange(`${pKey}Mosque`, v)}
            variant="mosque"
          />
        )}

        {hasBefore
          ? <CheckBox checked={(state as any)[`${pKey}Before`] ?? false} onChange={v => onChange(`${pKey}Before`, v)}/>
          : <div className="w-[22px] h-[22px] opacity-0 pointer-events-none"/>
        }

        {/* Fard — 3-state: unchecked / done / qadaa */}
        <FardCheckBox state={fardState} onChange={handleFard}/>

        {hasAfter
          ? <CheckBox checked={(state as any)[`${pKey}After`] ?? false} onChange={v => onChange(`${pKey}After`, v)}/>
          : <div className="w-[22px] h-[22px] opacity-0 pointer-events-none"/>
        }

        {hasAzkar && (
          <CheckBox checked={(state as any)[`${pKey}Azkar`] ?? false} onChange={v => onChange(`${pKey}Azkar`, v)} variant="azkar"/>
        )}

      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────

interface DailyEntryProps {
  lang?: 'en' | 'ar'
  userId: string
  userName?: string
  country?: string
  seasonal?: string[]
  enabledKeys?: Set<string>
  qadaRemaining?: number
  streakDays?: number
  gender?: string | null
  selectedDate?: string   // YYYY-MM-DD — if omitted, defaults to today
  isToday?: boolean
  initialIsPeriod?: boolean
  userSurahs?: { id: string; surahNumber: number; surahNameEn: string; surahNameAr: string }[]
  initialPrayer?: any
  initialDhikr?: any
  initialQuran?: any
  initialFasting?: any
  initialSadaqah?: any
}

export default function DailyEntry({
  lang = 'en', userId, userName = '', country = 'EG', seasonal = [],
  enabledKeys = new Set(['fajr','dhuhr','asr','maghrib','isha','sunnah_rawatib','prayer_azkar','morning_azkar','evening_azkar','quran_pages']),
  qadaRemaining: initialQada = 0, streakDays = 0,
  gender = null, selectedDate, isToday = true, initialIsPeriod = false,
  userSurahs = [], initialPrayer, initialDhikr, initialQuran, initialFasting, initialSadaqah,
}: DailyEntryProps) {
  const t   = T[lang]
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  // Use selectedDate prop if provided; fall back to actual today.
  // IMPORTANT: parse YYYY-MM-DD as LOCAL date (not UTC) to avoid timezone off-by-one.
  const today = (() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number)
      return new Date(y, m - 1, d) // local midnight — no UTC shift
    }
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })()
  const hijri = toHijri(today)

  // Navigation helpers — format as local YYYY-MM-DD (not toISOString which is UTC)
  const toLocalIso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const navigateDay = (delta: number) => {
    const next = new Date(today)
    next.setDate(next.getDate() + delta)
    // Hard navigation — bypasses Next.js cache so server always re-fetches the correct date's data
    window.location.href = `/today?date=${toLocalIso(next)}`
  }

  // Convenience — check if an activity key is enabled by the user in Settings
  const show = (key: string) => enabledKeys.has(key)

  // ── Prayer state — unified structure
  const [prayer, setPrayer] = useState<PrayerState>({
    fajrDone:     initialPrayer?.fajrDone     ?? false,
    fajrIsQada:   initialPrayer?.fajrIsQada   ?? false,
    dhuhrDone:    initialPrayer?.dhuhrDone    ?? false,
    dhuhrIsQada:  initialPrayer?.dhuhrIsQada  ?? false,
    asrDone:      initialPrayer?.asrDone      ?? false,
    asrIsQada:    initialPrayer?.asrIsQada    ?? false,
    maghribDone:  initialPrayer?.maghribDone  ?? false,
    maghribIsQada:initialPrayer?.maghribIsQada ?? false,
    ishaDone:     initialPrayer?.ishaDone     ?? false,
    ishaIsQada:   initialPrayer?.ishaIsQada   ?? false,
    fajrMosque:    initialPrayer?.fajrMosque    ?? false,
    dhuhrMosque:   initialPrayer?.dhuhrMosque   ?? false,
    asrMosque:     initialPrayer?.asrMosque     ?? false,
    maghribMosque: initialPrayer?.maghribMosque ?? false,
    ishaMosque:    initialPrayer?.ishaMosque    ?? false,
    fajrBefore:   initialPrayer?.fajrBefore   ?? false,
    dhuhrBefore:  initialPrayer?.dhuhrBefore  ?? false,
    dhuhrAfter:   initialPrayer?.dhuhrAfter   ?? false,
    maghribAfter: initialPrayer?.maghribAfter ?? false,
    ishaAfter:    initialPrayer?.ishaAfter    ?? false,
    fajrAzkar:    initialPrayer?.fajrAzkar    ?? false,
    dhuhrAzkar:   initialPrayer?.dhuhrAzkar   ?? false,
    asrAzkar:     initialPrayer?.asrAzkar     ?? false,
    maghribAzkar: initialPrayer?.maghribAzkar ?? false,
    ishaAzkar:    initialPrayer?.ishaAzkar    ?? false,
    duhaDone:     initialPrayer?.duhaDone     ?? false,
    witrDone:     initialPrayer?.witrDone     ?? false,
    qiyamRakaat:  initialPrayer?.qiyamRakaat  ?? 0,
  })

  // ── Dhikr state
  const [dhikr, setDhikr] = useState({
    morningAzkarDone: initialDhikr?.morningAzkarDone ?? false,
    eveningAzkarDone: initialDhikr?.eveningAzkarDone ?? false,
    istighfarCount:   initialDhikr?.istighfarCount   ?? 0,
    salawatCount:     initialDhikr?.salawatCount     ?? 0,
    tasbihCount:      initialDhikr?.tasbihCount      ?? 0,
  })

  // ── Quran state
  const [quran, setQuran]         = useState({ pagesRead: initialQuran?.pagesRead ?? 0, kahfDone: initialQuran?.kahfDone ?? false })
  const [surahChecks, setSurahChecks] = useState<Record<string, boolean>>(
    Object.fromEntries((initialQuran?.surahChecks ?? []).map((c: any) => [c.userSurahId, c.isDone]))
  )
  const [surahsOpen, setSurahsOpen] = useState(false)

  // ── Fasting state
  const [fasting, setFasting] = useState({
    isFasting: initialFasting?.isFasting ?? false,
    fastingType: initialFasting?.fastingType ?? 'VOLUNTARY',
    isQada: initialFasting?.isQada ?? false,
    comment: initialFasting?.comment ?? '',
  })
  const [qadaRemaining, setQadaRemaining] = useState(initialQada)

  // ── Sadaqah state
  const [sadaqah, setSadaqah] = useState({ gave: initialSadaqah?.gave ?? false, amount: initialSadaqah?.amount ?? '' })

  // ── Period state (female users only)
  const [isPeriod, setIsPeriod] = useState(initialIsPeriod)
  const togglePeriod = async () => {
    const next = !isPeriod
    setIsPeriod(next)
    await fetch('/api/activities/period', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: toLocalIso(today), isPeriod: next }),
    })
  }

  // ── Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<NodeJS.Timeout>()

  const save = useCallback(async (section: string, data: any) => {
    setSaveStatus('saving')
    try {
      await fetch(`/api/activities/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: toLocalIso(today), ...data }),
      })
      setSaveStatus('saved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000)
    } catch { setSaveStatus('idle') }
  }, [today])

  const debounce = useCallback((section: string, data: any) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(section, data), 800)
  }, [save])

  // ── Handlers
  const updatePrayer = (key: string, val: boolean | number) => {
    const next = { ...prayer, [key]: val }
    setPrayer(next)
    debounce('prayer', next)
  }

  // Atomic fard update — sets Done + IsQada in one setState to avoid stale closure overwrite
  const updateFard = useCallback((pKey: string, done: boolean, isQada: boolean) => {
    setPrayer(prev => {
      const next = { ...prev, [`${pKey}Done`]: done, [`${pKey}IsQada`]: isQada }
      debounce('prayer', next)
      return next
    })
  }, [debounce])

  const updateDhikr = (key: string, val: boolean | number) => {
    const next = { ...dhikr, [key]: val }
    setDhikr(next)
    debounce('dhikr', next)
  }

  const updateQuran = (key: string, val: any) => {
    const next = { ...quran, [key]: val }
    setQuran(next)
    debounce('quran', { ...next, surahChecks: Object.entries(surahChecks).map(([id, done]) => ({ userSurahId: id, isDone: done })) })
  }

  const updateSurah = (id: string, val: boolean) => {
    const next = { ...surahChecks, [id]: val }
    setSurahChecks(next)
    debounce('quran', { ...quran, surahChecks: Object.entries(next).map(([surahId, done]) => ({ userSurahId: surahId, isDone: done })) })
  }

  const markAsQada = async () => {
    const next = { ...fasting, isFasting: true, isQada: true }
    setFasting(next)
    const res = await fetch('/api/activities/fasting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: toLocalIso(today), ...next }),
    })
    const data = await res.json()
    if (data.qadaRemaining !== undefined) setQadaRemaining(data.qadaRemaining)
  }

  const updateSadaqah = (key: string, val: any) => {
    const next = { ...sadaqah, [key]: val }
    setSadaqah(next)
    debounce('sadaqah', next)
  }

  // ── Computed live score (updates on every checkbox tap)
  const scoreBreakdown = useMemo(() => computeDayScore(
    prayer, dhikr, quran, fasting, sadaqah, streakDays, enabledKeys
  ), [prayer, dhikr, quran, fasting, sadaqah, streakDays, enabledKeys])

  const salahPerfect = useMemo(() =>
    getSalahPerfect(prayer, enabledKeys), [prayer, enabledKeys]
  )

  // ── Seasonal flags
  const isFriday          = today.getDay() === 5
  const isMondayOrThursday = today.getDay() === 1 || today.getDay() === 4
  const isRamadan         = seasonal.includes('taraweeh')
  const isWhiteDay        = seasonal.includes('white_days_fast')

  const fastSubtitle = isRamadan        ? t.fastRam
    : isMondayOrThursday ? (today.getDay() === 1 ? t.fastMon : t.fastThu)
    : isWhiteDay         ? t.fastWhite
    : t.fastVol

  const fastVariant: 'default' | 'ramadan' | 'monday' | 'whitedays' =
    isRamadan ? 'ramadan' : isMondayOrThursday ? 'monday' : isWhiteDay ? 'whitedays' : 'default'

  // ── Completion ring
  const checks = [
    prayer.fajrDone, prayer.dhuhrDone, prayer.asrDone, prayer.maghribDone, prayer.ishaDone,
    dhikr.morningAzkarDone, dhikr.eveningAzkarDone, quran.pagesRead > 0, sadaqah.gave,
  ]
  const completion = Math.round((checks.filter(Boolean).length / checks.length) * 100)
  const circ   = 2 * Math.PI * 11
  const offset = circ - (completion / 100) * circ

  // ── Fard progress for score card circle
  const hasMissedFard = (
    prayer.fajrIsQada || prayer.dhuhrIsQada || prayer.asrIsQada ||
    prayer.maghribIsQada || prayer.ishaIsQada
  )
  const fardDoneCount = [
    prayer.fajrDone    && !prayer.fajrIsQada,
    prayer.dhuhrDone   && !prayer.dhuhrIsQada,
    prayer.asrDone     && !prayer.asrIsQada,
    prayer.maghribDone && !prayer.maghribIsQada,
    prayer.ishaDone    && !prayer.ishaIsQada,
  ].filter(Boolean).length

  return (
    <div dir={dir} className="flex flex-col h-full bg-gray-50">

      {/* ── TOP BAR */}
      <div className={`flex items-center justify-between px-4 pt-3 pb-0 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
        <div className={dir === 'rtl' ? 'text-right' : ''}>
          {userName ? (
            <>
              <p className="text-[12px] text-gray-400 leading-tight">
                {lang === 'ar' ? 'السلام عليكم' : 'Salam'}
              </p>
              <h1 className="text-[19px] font-bold text-gray-900 leading-tight">{userName}</h1>
            </>
          ) : (
            <h1 className="text-[19px] font-semibold text-gray-900">{t.today}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <NextPrayerChip country={country} lang={lang} dir={dir}/>
          {saveStatus !== 'idle' && (
            <span className="text-[11px] text-emerald-600 font-medium">
              {saveStatus === 'saving' ? t.saving : t.saved}
            </span>
          )}
        </div>
      </div>

      {/* ── DATE STRIP */}
      <div className={`mx-4 mt-2 bg-white border border-gray-200 rounded-[12px] px-[14px] py-[10px] flex items-center justify-between ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
        <div>
          <div className="text-[13px] font-medium text-gray-900">{formatDate(today, lang)}</div>
          <div className="text-[11px] text-gray-500">{formatHijri(hijri, lang)}</div>
        </div>
        <div className="flex gap-[6px]">
          <button
            onClick={() => navigateDay(-1)}
            className="w-[26px] h-[26px] rounded-[8px] border border-gray-200 bg-gray-50 text-gray-500 text-[13px] flex items-center justify-center active:bg-gray-100"
          >‹</button>
          <button
            onClick={() => navigateDay(1)}
            disabled={isToday}
            className={`w-[26px] h-[26px] rounded-[8px] border text-[13px] flex items-center justify-center transition-opacity ${isToday ? 'border-gray-100 bg-gray-50 text-gray-300 opacity-40 cursor-not-allowed' : 'border-gray-200 bg-gray-50 text-gray-500 active:bg-gray-100'}`}
          >›</button>
        </div>
      </div>

      {/* ── PERIOD TOGGLE — female users only */}
      {gender === 'female' && (
        <div
          onClick={togglePeriod}
          className={`mx-4 mt-2 rounded-[12px] px-[14px] py-[10px] flex items-center justify-between cursor-pointer border transition-colors ${dir === 'rtl' ? 'flex-row-reverse' : ''} ${isPeriod ? 'bg-rose-50 border-rose-300' : 'bg-white border-gray-200'}`}
        >
          <div className={dir === 'rtl' ? 'text-right' : ''}>
            <div className={`text-[13px] font-medium ${isPeriod ? 'text-rose-700' : 'text-gray-700'}`}>
              🌸 {(t as any).period}
            </div>
            {isPeriod && (
              <div className="text-[11px] text-rose-500 mt-[1px]">{(t as any).periodSub}</div>
            )}
          </div>
          <div className={`w-[38px] h-[22px] rounded-full transition-colors flex items-center px-[3px] ${isPeriod ? 'bg-rose-400' : 'bg-gray-200'}`}>
            <div className={`w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform ${isPeriod ? (dir === 'rtl' ? '-translate-x-[16px]' : 'translate-x-[16px]') : 'translate-x-0'}`}/>
          </div>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT (score card lives here so breakdown doesn't squish scroll area) */}
      <div className="flex-1 overflow-y-auto pb-6">

        {/* ── SCORE CARD — top of scroll area */}
        <div className="mt-2">
          <DayScoreCard
            totalScore={scoreBreakdown.total}
            breakdown={scoreBreakdown}
            salahPerfect={salahPerfect}
            streakDays={streakDays}
            fardDoneCount={fardDoneCount}
            hasMissedFard={hasMissedFard}
            lang={lang}
            dir={dir}
          />
        </div>

        {/* ══ BOX 1: SALAH — unified prayer rows */}
        <div className="mx-4 mt-3">
          <p className={`text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 mb-[6px] px-[2px] ${dir === 'rtl' ? 'text-right tracking-normal text-[11px] normal-case' : ''}`}>
            {t.salah}
          </p>
          <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
            {/* Column header row — only show columns that are enabled */}
            <div className={`flex items-center px-[14px] pt-[8px] pb-[2px] border-b border-gray-100 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <div className="flex-1"/>
              <div className={`flex items-center gap-[10px] flex-shrink-0 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                {/* Mosque column header — males only */}
                {gender === 'male' && (
                  <div className="w-[22px] text-center text-[12px] leading-none" title={lang === 'ar' ? 'في المسجد' : 'In mosque'}>🕌</div>
                )}
                {show('sunnah_rawatib') && (
                  <div className="w-[22px] text-center text-[8px] leading-tight whitespace-pre-line font-medium text-gray-400">{t.sunBef}</div>
                )}
                <div className="w-[22px] text-center text-[8px] leading-tight font-semibold text-emerald-700">{t.fard}</div>
                {show('sunnah_rawatib') && (
                  <div className="w-[22px] text-center text-[8px] leading-tight whitespace-pre-line font-medium text-gray-400">{t.sunAft}</div>
                )}
                {show('prayer_azkar') && (
                  <div className="w-[22px] text-center text-[8px] leading-tight font-medium text-blue-500">{t.azkar}</div>
                )}
              </div>
            </div>

            {/* 1. Fajr */}
            {PRAYERS_FAJR.map(p => (
              <PrayerRow
                key={p.key}
                pKey={p.key}
                isMale={gender === 'male'}
                hasBefore={p.hasBefore && show('sunnah_rawatib')}
                hasAfter={p.hasAfter && show('sunnah_rawatib')}
                hasAzkar={show('prayer_azkar')}
                rakaat={p.rakaat}
                state={prayer}
                onChange={updatePrayer}
                onFardChange={updateFard}
                lang={lang}
                dir={dir}
                t={t}
              />
            ))}

            {/* 2. Duha — after Fajr, before Dhuhr */}
            {show('duha') && (
              <SunnahAlignedRow
                icon="☀️" label={t.duha}
                checked={prayer.duhaDone} onChange={v => updatePrayer('duhaDone', v)}
                showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
                showMosque={gender === 'male'}
                dir={dir}
              />
            )}

            {/* 3. Dhuhr (→ Jumu'ah on Friday), Asr, Maghrib, Isha */}
            {PRAYERS_MAIN.map(p => {
              const isJumuah = isFriday && p.key === 'dhuhr'
              return (
                <PrayerRow
                  key={p.key}
                  pKey={p.key}
                  isMale={gender === 'male'}
                  hasBefore={!isJumuah && p.hasBefore && show('sunnah_rawatib')}
                  hasAfter={!isJumuah && p.hasAfter && show('sunnah_rawatib')}
                  hasAzkar={show('prayer_azkar')}
                  rakaat={isJumuah ? 2 : p.rakaat}
                  state={prayer}
                  onChange={updatePrayer}
                  onFardChange={updateFard}
                  lang={lang}
                  dir={dir}
                  t={t}
                  overrideLabel={isJumuah ? t.jumuah : undefined}
                  overrideSub={isJumuah
                    ? (lang === 'ar' ? 'فرض · ٢ ركعات' : 'Fard · 2 rakaat')
                    : undefined}
                />
              )
            })}

            {/* 4. Qiyam al-Layl — before Witr */}
            {show('qiyam') && (
              <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-[14px] w-5 text-center flex-shrink-0">⭐</span>
                <div className="flex-1">
                  <div className="text-[13px] text-gray-900">{t.qiyam}</div>
                  <div className="text-[10px] text-gray-400 mt-[1px]">{t.qiyamS}</div>
                </div>
                <NumberInput value={prayer.qiyamRakaat} onChange={v => updatePrayer('qiyamRakaat', v)} placeholder="0"/>
              </div>
            )}

            {/* 5. Witr — after Qiyam */}
            {show('witr') && (
              <SunnahAlignedRow
                icon="🌙" label={t.witr}
                checked={prayer.witrDone} onChange={v => updatePrayer('witrDone', v)}
                showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
                showMosque={gender === 'male'}
                dir={dir}
              />
            )}

            {/* Jumu'ah is now rendered inline as the Dhuhr row on Fridays — no separate row needed */}

            {/* Taraweeh — Ramadan only */}
            {show('taraweeh') && isRamadan && (
              <SunnahAlignedRow
                icon="🌙" label={t.taraweeh}
                checked={prayer.taraweehDone ?? false} onChange={v => updatePrayer('taraweehDone', v)}
                showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
                showMosque={gender === 'male'}
                dir={dir}
              />
            )}

            {/* Eid al-Fitr — 1 Shawwal */}
            {show('eid_fitr') && seasonal.includes('eid_fitr') && (
              <SunnahAlignedRow
                icon="🎉" label={t.eidFitr}
                checked={prayer.eidFitrDone ?? false} onChange={v => updatePrayer('eidFitrDone', v)}
                showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
                showMosque={gender === 'male'}
                dir={dir}
              />
            )}

            {/* Eid al-Adha — 10 Dhul Hijjah */}
            {show('eid_adha') && seasonal.includes('eid_adha') && (
              <SunnahAlignedRow
                icon="🎉" label={t.eidAdha}
                checked={prayer.eidAdhaDone ?? false} onChange={v => updatePrayer('eidAdhaDone', v)}
                showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
                showMosque={gender === 'male'}
                dir={dir}
              />
            )}
          </div>
        </div>

        {/* ══ BOX 2: DHIKR — only shown if at least one dhikr item is enabled */}
        {(show('morning_azkar') || show('evening_azkar') || show('istighfar') || show('salawat')) && (
          <div className="mx-4 mt-3">
            <p className={`text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 mb-[6px] px-[2px] ${dir === 'rtl' ? 'text-right tracking-normal text-[11px] normal-case' : ''}`}>
              {t.dhikr}
            </p>
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
              {show('morning_azkar') && (
                <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0">🌅</span>
                  <span className="flex-1 text-[13px] text-gray-900">{t.morning}</span>
                  <CheckBox checked={dhikr.morningAzkarDone} onChange={v => updateDhikr('morningAzkarDone', v)}/>
                </div>
              )}
              {show('evening_azkar') && (
                <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0">🌆</span>
                  <span className="flex-1 text-[13px] text-gray-900">{t.evening}</span>
                  <CheckBox checked={dhikr.eveningAzkarDone} onChange={v => updateDhikr('eveningAzkarDone', v)}/>
                </div>
              )}
              {show('istighfar') && (
                <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0">🤲</span>
                  <div className="flex-1">
                    <div className="text-[13px] text-gray-900">{t.istighfar}</div>
                    <div className="text-[10px] text-gray-400 mt-[1px]">{t.istighfarS}</div>
                  </div>
                  <NumberInput value={dhikr.istighfarCount} onChange={v => updateDhikr('istighfarCount', v)} width="w-[64px]"/>
                </div>
              )}
              {show('salawat') && (
                <div className={`flex items-center px-[14px] py-[10px] gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0">💚</span>
                  <div className="flex-1">
                    <div className="text-[13px] text-gray-900">{t.salawat}</div>
                    <div className="text-[10px] text-gray-400 mt-[1px]">{t.salawatS}</div>
                  </div>
                  <NumberInput value={dhikr.salawatCount} onChange={v => updateDhikr('salawatCount', v)} width="w-[64px]"/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ BOX 3: QURAN — only if at least one quran item enabled */}
        {(show('quran_pages') || show('daily_surahs') || show('surah_kahf')) && (
          <div className="mx-4 mt-3">
            <p className={`text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 mb-[6px] px-[2px] ${dir === 'rtl' ? 'text-right tracking-normal text-[11px] normal-case' : ''}`}>
              {t.quran}
            </p>
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
              {show('quran_pages') && (
                <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0">📖</span>
                  <div className="flex-1">
                    <div className="text-[13px] text-gray-900">{t.pages}</div>
                    <div className="text-[10px] text-gray-400 mt-[1px]">{t.pagesS}</div>
                  </div>
                  <NumberInput value={quran.pagesRead} onChange={v => updateQuran('pagesRead', v)} max={604}/>
                </div>
              )}
              {show('daily_surahs') && userSurahs.length > 0 && (
                <>
                  <div className={`flex items-center justify-between px-[14px] py-[10px] border-b border-gray-100 cursor-pointer ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
                    onClick={() => setSurahsOpen(!surahsOpen)}>
                    <div className={`flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[15px]">📚</span>
                      <span className="text-[13px] text-gray-900">{t.surahs}</span>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-[2px] rounded-full">{userSurahs.length}</span>
                    </div>
                    <span className={`text-gray-400 text-[12px] transition-transform ${surahsOpen ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                  {surahsOpen && userSurahs.map(s => (
                    <div key={s.id} className={`flex items-center gap-3 pl-10 pr-[14px] py-[9px] border-b border-gray-100 last:border-b-0 ${dir === 'rtl' ? 'flex-row-reverse pl-[14px] pr-10' : ''}`}>
                      <span className="flex-1 text-[13px] text-gray-900">{lang === 'ar' ? s.surahNameAr : s.surahNameEn}</span>
                      <CheckBox checked={surahChecks[s.id] ?? false} onChange={v => updateSurah(s.id, v)}/>
                    </div>
                  ))}
                </>
              )}
              {show('surah_kahf') && isFriday && (
                <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0">📖</span>
                  <span className="flex-1 text-[13px] text-gray-900">{lang === 'ar' ? 'سورة الكهف' : 'Surah Al-Kahf'}</span>
                  <CheckBox checked={quran.kahfDone} onChange={v => updateQuran('kahfDone', v)}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ BOX 4: FASTING — only if any fasting key enabled */}
        {(show('ramadan_fast') || show('monday_thursday') || show('white_days') || show('voluntary_fast')) && (
          <div className="mx-4 mt-3">
            <p className={`text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 mb-[6px] px-[2px] ${dir === 'rtl' ? 'text-right tracking-normal text-[11px] normal-case' : ''}`}>
              {t.fasting}
            </p>
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
              <div className={`flex items-center px-[14px] py-[10px] gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-[14px] w-5 text-center flex-shrink-0">🌙</span>
                <div className="flex-1">
                  <div className="text-[13px] text-gray-900">{t.fastToday}</div>
                  <div className="text-[10px] text-gray-400 mt-[1px]">{fastSubtitle}</div>
                </div>
                <CheckBox
                  checked={fasting.isFasting}
                  onChange={v => { const next = { ...fasting, isFasting: v }; setFasting(next); debounce('fasting', next) }}
                  variant={fastVariant}
                />
              </div>
              {/* Qada option — shown when fasting and qada remaining */}
              {fasting.isFasting && qadaRemaining > 0 && (
                <div className={`flex items-center px-[14px] py-[9px] border-t border-gray-100 gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0 opacity-0">·</span>
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-600">{t.fastQada}</div>
                  </div>
                  <CheckBox
                    checked={fasting.isQada ?? false}
                    onChange={v => {
                      const next = { ...fasting, isQada: v }
                      setFasting(next)
                      debounce('fasting', next)
                    }}
                  />
                </div>
              )}
              {qadaRemaining > 0 && (
                <div className={`mx-[14px] mb-[10px] mt-1 bg-gray-50 rounded-[10px] px-3 py-[9px] flex items-center justify-between border-t border-gray-100 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <div className="text-[11px] text-gray-500">{t.qada}</div>
                    <div className="text-[12px] font-semibold text-red-500">{t.qdaRemaining(qadaRemaining)}</div>
                  </div>
                  <button onClick={markAsQada} className="text-[10px] text-gray-500 border border-gray-200 bg-white rounded-[8px] px-3 py-1">
                    {t.qdaCountBtn}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ BOX 5: SADAQAH — only if enabled */}
        {show('sadaqah') && (
          <div className="mx-4 mt-3">
            <p className={`text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 mb-[6px] px-[2px] ${dir === 'rtl' ? 'text-right tracking-normal text-[11px] normal-case' : ''}`}>
              {t.sadaqah}
            </p>
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
              <div className={`flex items-center px-[14px] py-[10px] gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <span className="text-[14px] w-5 text-center flex-shrink-0">💛</span>
                <span className="flex-1 text-[13px] text-gray-900">{t.sadaqahLabel}</span>
                <input
                  type="text"
                  placeholder={t.amountPh}
                  value={sadaqah.amount}
                  onChange={e => updateSadaqah('amount', e.target.value)}
                  className="w-[90px] h-[26px] rounded-[8px] border border-gray-200 bg-gray-50 text-[12px] px-2 focus:outline-none focus:border-emerald-500"
                />
                <CheckBox checked={sadaqah.gave} onChange={v => updateSadaqah('gave', v)}/>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
