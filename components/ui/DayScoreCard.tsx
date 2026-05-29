'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ScoreBreakdown {
  salah:   number
  sunnah:  number
  azkar:   number
  quran:   number
  fasting: number
  sadaqah: number
  dhikr:   number
  mosque:  number
  bonus:   number
  streak:  number
}

interface DayScoreCardProps {
  totalScore:    number
  breakdown:     ScoreBreakdown
  salahPerfect:  boolean
  streakDays:    number
  fardDoneCount: number
  hasMissedFard: boolean
  lang:          'en' | 'ar'
  dir:           'ltr' | 'rtl'
}

const T = {
  en: {
    todayScore:  "Today's Score",
    salah:       'Salah Fard',
    sunnah:      'Sunnah',
    azkar:       'Azkar',
    quran:       'Quran',
    fasting:     'Fasting',
    sadaqah:     'Sadaqah',
    dhikr:       'Dhikr',
    mosque:      'In Mosque',
    bonus:       'Perfect Day',
    streak:      'Streak Bonus',
    streakLabel: (n: number) => n === 0 ? 'No streak' : `${n}-day salah streak`,
    perfect:     'Salah Perfect ✓',
    notPerfect:  'Salah incomplete',
    breakdown:   'Breakdown',
    hide:        'Hide',
    pts:         'pts',
  },
  ar: {
    todayScore:  'نقاط اليوم',
    salah:       'الصلاة الفرض',
    sunnah:      'السنة',
    azkar:       'الأذكار',
    quran:       'القرآن',
    fasting:     'الصيام',
    sadaqah:     'الصدقة',
    dhikr:       'الذكر',
    mosque:      'في المسجد',
    bonus:       'يوم مثالي',
    streak:      'مكافأة السلسلة',
    streakLabel: (n: number) => n === 0 ? 'لا سلسلة' : `سلسلة ${n} أيام`,
    perfect:     'الصلاة مكتملة ✓',
    notPerfect:  'الصلاة غير مكتملة',
    breakdown:   'التفاصيل',
    hide:        'إخفاء',
    pts:         'نقطة',
  },
}

export default function DayScoreCard({
  totalScore, breakdown, salahPerfect, streakDays,
  fardDoneCount, hasMissedFard, lang, dir,
}: DayScoreCardProps) {
  const t = T[lang]
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Score tier colour
  const color = totalScore >= 150 ? '#059669'
    : totalScore >= 100          ? '#0d9488'
    : totalScore >= 60           ? '#b45309'
    :                              '#6b7280'

  // Fard circle
  const displayFard   = hasMissedFard ? 0 : fardDoneCount
  const circleR       = 26
  const circleCirc    = 2 * Math.PI * circleR
  const circleOffset  = circleCirc - (displayFard / 5) * circleCirc
  const circleColor   = displayFard === 5 ? '#059669'
    : displayFard >= 3                    ? '#d97706'
    : displayFard > 0                     ? '#6b7280'
    :                                       '#ef4444'

  const rows = [
    { label: t.salah,   value: breakdown.salah,   max: 100, icon: '🕌' },
    { label: t.sunnah,  value: breakdown.sunnah,  max: 20,  icon: '📿' },
    { label: t.azkar,   value: breakdown.azkar,   max: 20,  icon: '🤲' },
    { label: t.dhikr,   value: breakdown.dhikr,   max: 8,   icon: '💚' },
    { label: t.quran,   value: breakdown.quran,   max: 5,   icon: '📖' },
    { label: t.fasting, value: breakdown.fasting, max: 15,  icon: '🌙' },
    { label: t.sadaqah, value: breakdown.sadaqah, max: 5,   icon: '💛' },
    { label: t.mosque,  value: breakdown.mosque ?? 0, max: 50, icon: '🏛️' },
    { label: t.bonus,   value: breakdown.bonus,   max: 25,  icon: '⭐' },
    { label: t.streak,  value: breakdown.streak,  max: 30, icon: '🔥' },
  ].filter(r => r.value > 0 || r.max <= 25)

  return (
    <div className="mx-4 mb-3">
      <div
        className="rounded-[14px] overflow-hidden border"
        style={{ borderColor: salahPerfect ? color + '44' : '#e5e7eb' }}
      >
        {/* Main score row */}
        <div
          className={cn('flex items-center px-4 py-3 gap-3', dir === 'rtl' && 'flex-row-reverse')}
          style={{ background: salahPerfect ? color + '0d' : 'white' }}
        >
          {/* Score number */}
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-[2px]"
               style={dir === 'rtl' ? { letterSpacing: 0, textTransform: 'none', fontSize: 11 } : {}}>
              {t.todayScore}
            </p>
            <div className="flex items-baseline gap-2"
              style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
              <span className="text-[32px] font-bold leading-none" style={{ color }}>
                {totalScore}
              </span>
              <span className="text-[12px] text-gray-400">{t.pts}</span>
            </div>
            {/* Salah status */}
            <p className="text-[11px] font-medium mt-[3px]"
              style={{ color: salahPerfect ? color : '#9ca3af' }}>
              {salahPerfect ? t.perfect : t.notPerfect}
            </p>
          </div>

          {/* ── Fard progress circle ── */}
          <div className="flex flex-col items-center flex-shrink-0">
            <svg width="68" height="68" viewBox="0 0 68 68">
              {/* Track */}
              <circle
                cx="34" cy="34" r={circleR}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="5"
              />
              {/* Progress arc */}
              <circle
                cx="34" cy="34" r={circleR}
                fill="none"
                stroke={circleColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circleCirc}
                strokeDashoffset={circleOffset}
                transform="rotate(-90 34 34)"
                style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
              />
              {/* Center count */}
              <text
                x="34" y="34"
                dominantBaseline="central"
                textAnchor="middle"
                fontSize="18"
                fontWeight="700"
                fill={circleColor}
              >
                {displayFard}
              </text>
              {/* /5 label */}
              <text
                x="34" y="48"
                dominantBaseline="central"
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
              >
                /5
              </text>
            </svg>
            <span className="text-[9px] text-gray-400 mt-[-4px]">
              {lang === 'ar' ? 'الفرض' : 'Fard'}
            </span>
          </div>

          {/* Streak pill + breakdown toggle */}
          <div className={cn('flex flex-col items-end gap-2', dir === 'rtl' && 'items-start')}>
            {/* Streak */}
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-full px-2 py-[3px]"
              style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
              <span className="text-[13px]">🔥</span>
              <span className="text-[11px] font-semibold text-orange-600">
                {t.streakLabel(streakDays)}
              </span>
            </div>
            {/* Breakdown toggle */}
            <button
              onClick={() => setShowBreakdown(s => !s)}
              className="text-[11px] text-gray-400 underline underline-offset-2"
            >
              {showBreakdown ? t.hide : t.breakdown}
            </button>
          </div>
        </div>

        {/* Breakdown rows */}
        {showBreakdown && (
          <div className="border-t border-gray-100 bg-white">
            {rows.map((row, i) => (
              <div key={i}
                className={cn(
                  'flex items-center px-4 py-[7px] gap-3',
                  i < rows.length - 1 && 'border-b border-gray-50',
                  dir === 'rtl' && 'flex-row-reverse'
                )}
              >
                <span className="text-[14px] w-5 text-center flex-shrink-0">{row.icon}</span>
                <span className={cn('flex-1 text-[12px] text-gray-600', dir === 'rtl' && 'text-right')}>
                  {row.label}
                </span>
                {/* Mini bar */}
                <div className="w-[48px] h-[4px] bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((row.value / row.max) * 100))}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-[12px] font-semibold text-gray-800 w-8 text-right flex-shrink-0">
                  +{row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
