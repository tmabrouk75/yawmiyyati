'use client'

// Daily Entry screen — composition only.
// State and persistence live in hooks/useDailyEntryState.
// Each box is its own component under ./daily/.

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import DayScoreCard from '@/components/ui/DayScoreCard'
import NextPrayerChip from '@/components/ui/NextPrayerChip'
import { computeDayScore, getSalahPerfect } from '@/lib/scoring/client'
import { formatDate } from '@/lib/utils'
import { formatHijri, toHijri } from '@/lib/hijri'
import { useDailyEntryState, toLocalIso } from '@/hooks/useDailyEntryState'
import { T } from './daily/translations'
import AzkarOverlay from './daily/AzkarOverlay'
import SalahBox from './daily/SalahBox'
import DhikrBox from './daily/DhikrBox'
import QuranBox from './daily/QuranBox'
import FastingBox from './daily/FastingBox'
import SadaqahBox from './daily/SadaqahBox'
import SpecialDaysBox from './daily/SpecialDaysBox'
import PeriodToggle from './daily/PeriodToggle'
import { useState } from 'react'

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
  const t      = T[lang]
  const dir    = lang === 'ar' ? 'rtl' : 'ltr'
  const router = useRouter()

  const { scrollRef: pullRef, pullY, refreshing } = usePullToRefresh(() => {
    router.refresh()
  })

  // Use selectedDate prop if provided; fall back to actual today.
  // IMPORTANT: parse YYYY-MM-DD as LOCAL date (not UTC) to avoid timezone off-by-one.
  // Memoized so the save callback in the state hook stays stable across renders.
  const today = useMemo(() => {
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number)
      return new Date(y, m - 1, d) // local midnight — no UTC shift
    }
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [selectedDate])
  const hijri = toHijri(today)

  const navigateDay = (delta: number) => {
    const next = new Date(today)
    next.setDate(next.getDate() + delta)
    // Hard navigation — bypasses Next.js cache so server always re-fetches the correct date's data
    window.location.href = `/today?date=${toLocalIso(next)}`
  }

  // Convenience — check if an activity key is enabled by the user in Settings
  const show = (key: string) => enabledKeys.has(key)

  // ── All activity state + persistence
  const s = useDailyEntryState(today, {
    initialPrayer, initialDhikr, initialQuran, initialFasting, initialSadaqah,
    initialQada, initialIsPeriod,
  })

  // ── Overlay visibility (pure UI state)
  const [showMorningAzkar, setShowMorningAzkar] = useState(false)
  const [showEveningAzkar, setShowEveningAzkar] = useState(false)

  // ── Computed live score (updates on every checkbox tap)
  const scoreBreakdown = useMemo(() => computeDayScore(
    s.prayer, s.dhikr, s.quran, s.fasting, s.sadaqah, streakDays, enabledKeys
  ), [s.prayer, s.dhikr, s.quran, s.fasting, s.sadaqah, streakDays, enabledKeys])

  const salahPerfect = useMemo(() =>
    getSalahPerfect(s.prayer, enabledKeys), [s.prayer, enabledKeys]
  )

  // ── Seasonal flags
  const isFriday           = today.getDay() === 5
  const isMondayOrThursday = today.getDay() === 1 || today.getDay() === 4
  const isRamadan          = seasonal.includes('taraweeh')
  const isWhiteDay         = seasonal.includes('white_days_fast')

  const fastSubtitle = isRamadan        ? t.fastRam
    : isMondayOrThursday ? (today.getDay() === 1 ? t.fastMon : t.fastThu)
    : isWhiteDay         ? t.fastWhite
    : t.fastVol

  const fastVariant: 'default' | 'ramadan' | 'monday' | 'whitedays' =
    isRamadan ? 'ramadan' : isMondayOrThursday ? 'monday' : isWhiteDay ? 'whitedays' : 'default'

  // ── Fard progress for score card circle
  const hasMissedFard = (
    s.prayer.fajrIsQada || s.prayer.dhuhrIsQada || s.prayer.asrIsQada ||
    s.prayer.maghribIsQada || s.prayer.ishaIsQada
  )
  const fardDoneCount = [
    s.prayer.fajrDone    && !s.prayer.fajrIsQada,
    s.prayer.dhuhrDone   && !s.prayer.dhuhrIsQada,
    s.prayer.asrDone     && !s.prayer.asrIsQada,
    s.prayer.maghribDone && !s.prayer.maghribIsQada,
    s.prayer.ishaDone    && !s.prayer.ishaIsQada,
  ].filter(Boolean).length

  return (
    <div dir={dir} className="flex flex-col h-full bg-gray-50">

      {/* ── TOP BAR */}
      <div className={`flex items-center justify-between px-4 pt-3 pb-0`}>
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
          {s.saveStatus !== 'idle' && (
            <span className="text-[11px] text-emerald-600 font-medium">
              {s.saveStatus === 'saving' ? t.saving : t.saved}
            </span>
          )}
        </div>
      </div>

      {/* ── DATE STRIP */}
      <div className={`mx-4 mt-2 bg-white border border-gray-200 rounded-[12px] px-[14px] py-[10px] flex items-center justify-between`}>
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

      {/* ── SCROLLABLE CONTENT (score card lives here so breakdown doesn't squish scroll area) */}
      <div ref={pullRef} className="flex-1 overflow-y-auto pb-6 relative">
        {/* Pull-to-refresh indicator */}
        {(pullY > 8 || refreshing) && (
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-1 z-10 pointer-events-none"
               style={{ transform: `translateY(${Math.min(pullY, 52)}px)`, transition: refreshing ? 'none' : 'transform 0.1s' }}>
            <div className={`w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center ${refreshing || pullY > 48 ? 'animate-spin' : ''}`}>
              <span className="text-[14px]">↻</span>
            </div>
          </div>
        )}

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

        {/* ══ BOX 1: SALAH */}
        <SalahBox
          t={t} lang={lang} dir={dir} gender={gender} show={show} isFriday={isFriday}
          prayer={s.prayer}
          morningAzkarDone={s.dhikr.morningAzkarDone}
          eveningAzkarDone={s.dhikr.eveningAzkarDone}
          updatePrayer={s.updatePrayer}
          updateFard={s.updateFard}
          updateDhikr={s.updateDhikr}
          onOpenMorningAzkar={() => setShowMorningAzkar(true)}
          onOpenEveningAzkar={() => setShowEveningAzkar(true)}
        />

        {/* ══ BOX 2: DHIKR */}
        <DhikrBox
          t={t} dir={dir} show={show}
          istighfarCount={s.dhikr.istighfarCount}
          salawatCount={s.dhikr.salawatCount}
          updateDhikr={s.updateDhikr}
        />

        {/* ══ BOX 3: QURAN */}
        <QuranBox
          t={t} lang={lang} dir={dir} show={show} isFriday={isFriday}
          quran={s.quran}
          surahChecks={s.surahChecks}
          userSurahs={userSurahs}
          updateQuran={s.updateQuran}
          updateSurah={s.updateSurah}
        />

        {/* ══ BOX 4: FASTING */}
        <FastingBox
          t={t} dir={dir} show={show}
          fastSubtitle={fastSubtitle} fastVariant={fastVariant}
          fasting={s.fasting}
          qadaRemaining={s.qadaRemaining}
          updateFasting={s.updateFasting}
          markAsQada={s.markAsQada}
        />

        {/* ══ BOX 5: SADAQAH */}
        <SadaqahBox
          t={t} dir={dir} show={show}
          sadaqah={s.sadaqah}
          updateSadaqah={s.updateSadaqah}
        />

        {/* ══ PERIOD TOGGLE — female users only, at the bottom */}
        {gender === 'female' && (
          <PeriodToggle t={t} dir={dir} isPeriod={s.isPeriod} onToggle={s.togglePeriod}/>
        )}

        {/* ══ BOX 6: SPECIAL DAYS — seasonal prayers at the bottom */}
        <SpecialDaysBox
          t={t} lang={lang} dir={dir} gender={gender} show={show}
          seasonal={seasonal} isRamadan={isRamadan}
          prayer={s.prayer}
          updatePrayer={s.updatePrayer}
        />

      </div>

      {/* ── Azkar Overlays ── */}
      {showMorningAzkar && (
        <AzkarOverlay
          title={lang === 'ar' ? 'أذكار الصباح' : 'Morning Azkar'}
          defs={s.morningAzkarDefs}
          lang={lang}
          dir={dir}
          dateKey={toLocalIso(today)}
          category="MORNING"
          onAllComplete={() => s.updateDhikr('morningAzkarDone', true)}
          onClose={() => setShowMorningAzkar(false)}
        />
      )}
      {showEveningAzkar && (
        <AzkarOverlay
          title={lang === 'ar' ? 'أذكار المساء' : 'Evening Azkar'}
          defs={s.eveningAzkarDefs}
          lang={lang}
          dir={dir}
          dateKey={toLocalIso(today)}
          category="EVENING"
          onAllComplete={() => s.updateDhikr('eveningAzkarDone', true)}
          onClose={() => setShowEveningAzkar(false)}
        />
      )}

    </div>
  )
}
