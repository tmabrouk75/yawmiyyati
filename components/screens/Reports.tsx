'use client'

import { useState } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { useReports, Period } from '@/hooks/useReports'
import { cn } from '@/lib/utils'
import {
  Heatmap, ScoreCard, CompletionCards,
  StreakCards, FastingSummary, CounterCard,
} from '@/components/reports/ReportSections'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:        'Reports',
    // Period
    weekly:       'Weekly',
    monthly:      'Monthly',
    quarterly:    'Quarterly',
    yearly:       'Yearly',
    // View toggle
    viewCompletion: 'Completion',
    viewStreaks:   'Streaks',
    // Heatmap
    heatmap:      'Activity calendar',
    switchHijri:  'Hijri',
    switchGreg:   'Gregorian',
    less:         'Less',
    more:         'More',
    // Score card
    dayStreak:    'day streak',
    best:         'Best',
    // Completion
    byActivity:   'By activity',
    completion:   '%',
    // Streaks
    perActivity:  'Per activity',
    current:      'Current',
    bestShort:    'Best',
    // Fasting
    fastingTitle: 'Fasting',
    fastRamadan:  'Ramadan',
    fastMonThu:   'Mon / Thu',
    fastWhite:    'White Days',
    fastVol:      'Voluntary',
    qadaRemaining: "Ramadan Qada' remaining",
    // Counters
    today:        'Today',
    week:         'This week',
    month:        'This month',
    allTime:      'All time',
    trend8weeks:  '8-week trend',
    // Period labels
    periodLabel:  {
      weekly:     'This week',
      monthly:    'This month',
      quarterly:  'This quarter',
      yearly:     'This year',
    },
    // Empty
    noData:       'No data yet for this period.',
    loading:      'Loading...',
  },
  ar: {
    title:        'التقارير',
    weekly:       'أسبوعي',
    monthly:      'شهري',
    quarterly:    'ربعي',
    yearly:       'سنوي',
    viewCompletion: 'الإنجاز',
    viewStreaks:   'السلاسل',
    heatmap:      'تقويم النشاط',
    switchHijri:  'هجري',
    switchGreg:   'ميلادي',
    less:         'أقل',
    more:         'أكثر',
    dayStreak:    'يوم متتالٍ',
    best:         'أفضل',
    byActivity:   'حسب النشاط',
    completion:   '%',
    perActivity:  'لكل نشاط',
    current:      'الحالي',
    bestShort:    'أفضل',
    fastingTitle: 'الصيام',
    fastRamadan:  'رمضان',
    fastMonThu:   'الاثنين / الخميس',
    fastWhite:    'الأيام البيض',
    fastVol:      'تطوع',
    qadaRemaining: 'قضاء رمضان المتبقي',
    today:        'اليوم',
    week:         'هذا الأسبوع',
    month:        'هذا الشهر',
    allTime:      'إجمالي',
    trend8weeks:  'اتجاه ٨ أسابيع',
    periodLabel:  {
      weekly:    'هذا الأسبوع',
      monthly:   'هذا الشهر',
      quarterly: 'هذا الربع',
      yearly:    'هذا العام',
    },
    noData:       'لا توجد بيانات لهذه الفترة بعد.',
    loading:      'جارٍ التحميل...',
  },
}

const PERIODS: Period[] = ['weekly', 'monthly', 'quarterly', 'yearly']

type ViewMode = 'completion' | 'streaks'

// ─── SKELETON LOADER ──────────────────────────────────────

function Skeleton({ h = 80 }: { h?: number }) {
  return (
    <div
      className="mx-4 mb-3 bg-gray-100 rounded-[14px] animate-pulse"
      style={{ height: h }}
    />
  )
}

// ─── REPORTS SCREEN ───────────────────────────────────────

export default function Reports() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const { period, setPeriod, summary, heatmap, counters, loading } = useReports()
  const [view, setView]         = useState<ViewMode>('completion')
  const [calMode, setCalMode]   = useState<'gregorian' | 'hijri'>('gregorian')

  const isRtl = dir === 'rtl'

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-8">

      {/* ── TOP BAR ── */}
      <div className={cn(
        'flex items-center justify-between px-4 pt-4 pb-2',
        isRtl && 'flex-row-reverse'
      )}>
        <h1 className="text-[20px] font-semibold text-gray-900">{t.title}</h1>
      </div>

      {/* ── VIEW TOGGLE ── */}
      <div className="mx-4 mb-3">
        <div className="flex bg-gray-200 rounded-[12px] p-[3px] gap-[3px]">
          {(['completion', 'streaks'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'flex-1 py-[8px] rounded-[9px] text-[12px] font-medium transition-all duration-150',
                view === v
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              )}
            >
              {v === 'completion' ? t.viewCompletion : t.viewStreaks}
            </button>
          ))}
        </div>
      </div>

      {/* ── PERIOD SELECTOR ── */}
      <div className="mx-4 mb-4">
        <div className="grid grid-cols-4 gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'py-[6px] rounded-full text-center font-medium border transition-all duration-150',
                'text-[8px] leading-tight',
                period === p
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-transparent text-gray-500 border-gray-200'
              )}
            >
              {t[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE SECTIONS ── */}
      <div className="flex-1 overflow-y-auto scroll-area">

        {/* ── A: HEATMAP ── */}
        {heatmap.length > 0 ? (
          <Heatmap
            days={heatmap}
            calMode={calMode}
            onToggleCal={() => setCalMode(c => c === 'gregorian' ? 'hijri' : 'gregorian')}
            lang={lang}
            dir={dir}
            t={t}
          />
        ) : (
          <Skeleton h={120}/>
        )}

        {/* ── B/C: SCORE + COMPLETION or STREAKS ── */}
        {loading ? (
          <>
            <Skeleton h={100}/>
            <Skeleton h={220}/>
          </>
        ) : summary && summary.totalDays > 0 ? (
          <>
            {/* Score card — shared between both views */}
            <ScoreCard
              score={summary.overallScore}
              label={t.periodLabel[period]}
              streakCurrent={summary.overallStreak.current}
              streakBest={summary.overallStreak.best}
              dir={dir}
              t={t}
            />

            {/* Conditional section */}
            {view === 'completion' ? (
              <CompletionCards
                activities={summary.activities}
                lang={lang}
                dir={dir}
                t={t}
              />
            ) : (
              <StreakCards
                streaks={summary.streaks}
                lang={lang}
                dir={dir}
                t={t}
              />
            )}

            {/* ── D: FASTING SUMMARY ── */}
            <FastingSummary
              fasting={summary.fasting}
              lang={lang}
              dir={dir}
              t={t}
            />
          </>
        ) : summary && summary.totalDays === 0 ? (
          <div className={cn(
            'mx-4 py-10 text-center text-[13px] text-gray-400',
            isRtl && 'text-center'
          )}>
            {t.noData}
          </div>
        ) : null}

        {/* ── E: ISTIGHFAR COUNTER ── */}
        {counters ? (
          <CounterCard
            icon="📿"
            title={lang === 'ar' ? 'الاستغفار' : 'Istighfar'}
            data={counters.istighfar}
            trend={counters.trend}
            trendKey="istighfar"
            lang={lang}
            dir={dir}
            t={t}
          />
        ) : (
          <Skeleton h={200}/>
        )}

        {/* ── F: SALAWAT COUNTER ── */}
        {counters ? (
          <CounterCard
            icon="💚"
            title={lang === 'ar' ? 'الصلاة على النبي ﷺ' : 'Salawat ﷺ'}
            data={counters.salawat}
            trend={counters.trend}
            trendKey="salawat"
            lang={lang}
            dir={dir}
            t={t}
          />
        ) : (
          <Skeleton h={200}/>
        )}

      </div>
    </div>
  )
}
