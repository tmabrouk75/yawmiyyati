'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import type { ActivityStat, StreakStat, HeatmapDay, TrendPoint } from '@/hooks/useReports'
import type { ReportT } from '@/components/screens/Reports'

// ─── COLOUR HELPERS ──────────────────────────────────────

export function pctColor(p: number) {
  return p >= 80 ? '#059669' : p >= 50 ? '#b45309' : '#dc2626'
}
export function pctDot(p: number) {
  return p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444'
}

// ─── HEATMAP ─────────────────────────────────────────────

const LEVEL_COLORS = ['#f3f4f6', '#fca5a5', '#86efac', '#059669'] as const
// 0=no data(gray), 1=bad(red-light), 2=partial(green-light), 3=full(green)

const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTH_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']

export function Heatmap({
  days,
  calMode,
  onToggleCal,
  lang,
  dir,
  t,
}: {
  days: HeatmapDay[]
  calMode: 'gregorian' | 'hijri'
  onToggleCal: () => void
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: ReportT
}) {
  // Group by week (Sun-Sat) for grid
  const DAYS_EN = ['S','M','T','W','T','F','S']
  const DAYS_AR = ['أ','ا','ث','ر','خ','ج','س']
  const dayLabels = lang === 'ar' ? DAYS_AR : DAYS_EN

  // Pad to start from Sunday
  const firstDay = days.length > 0 ? new Date(days[0].date).getDay() : 0
  const padded: (HeatmapDay | null)[] = [...Array(firstDay).fill(null), ...days]
  const weeks: (HeatmapDay | null)[][] = []
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))

  // Month labels from gregorian dates
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, wi) => {
    const firstReal = week.find(d => d !== null)
    if (!firstReal) return
    const m = new Date(firstReal.date).getMonth()
    if (m !== lastMonth) {
      monthLabels.push({ label: lang === 'ar' ? MONTH_AR[m] : MONTH_EN[m], col: wi })
      lastMonth = m
    }
  })

  return (
    <div className="mx-4 mb-3">
      <div className={cn('flex items-center justify-between mb-2', dir === 'rtl' && 'flex-row-reverse')}>
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400',
          dir === 'rtl' && 'tracking-normal text-[11px] normal-case'
        )}>{t.heatmap}</p>
        <button
          onClick={onToggleCal}
          className="text-[10px] text-emerald-600 border border-emerald-200 rounded-full px-2 py-[2px] font-medium"
        >
          {calMode === 'gregorian' ? t.switchHijri : t.switchGreg}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[14px] p-3 overflow-x-auto">
        {/* Month labels */}
        <div className="flex mb-1" style={{ gap: 2 }}>
          <div style={{ width: 14 }}/>
          {weeks.map((_, wi) => {
            const lbl = monthLabels.find(m => m.col === wi)
            return (
              <div key={wi} style={{ width: 14, fontSize: 8, color: '#9ca3af', flexShrink: 0 }}>
                {lbl ? lbl.label : ''}
              </div>
            )
          })}
        </div>

        <div className="flex" style={{ gap: 2 }}>
          {/* Day labels */}
          <div className="flex flex-col" style={{ gap: 2 }}>
            {dayLabels.map((d, i) => (
              <div key={i} style={{ width: 14, height: 14, fontSize: 8, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i % 2 === 0 ? d : ''}
              </div>
            ))}
          </div>
          {/* Cells */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: 2 }}>
              {Array(7).fill(null).map((_, di) => {
                const day = week[di]
                const color = day ? LEVEL_COLORS[day.level] : '#f9fafb'
                const label = day
                  ? calMode === 'hijri'
                    ? `${day.hijriDay}/${day.hijriMonth}/${day.hijriYear} — ${day.pct}%`
                    : `${day.date} — ${day.pct}%`
                  : ''
                return (
                  <div
                    key={di}
                    title={label}
                    style={{
                      width: 14, height: 14,
                      borderRadius: 3,
                      backgroundColor: color,
                      flexShrink: 0,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className={cn('flex items-center gap-2 mt-2', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[9px] text-gray-400">{t.less}</span>
          {LEVEL_COLORS.map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }}/>
          ))}
          <span className="text-[9px] text-gray-400">{t.more}</span>
        </div>
      </div>
    </div>
  )
}

// ─── OVERALL SCORE CARD ───────────────────────────────────

export function ScoreCard({
  score,
  label,
  streakCurrent,
  streakBest,
  dir,
  t,
}: {
  score: number
  label: string
  streakCurrent: number
  streakBest: number
  dir: 'ltr' | 'rtl'
  t: ReportT
}) {
  const circ = 2 * Math.PI * 24
  const offset = circ - (score / 100) * circ

  return (
    <div className="mx-4 mb-3 bg-white border border-gray-200 rounded-[14px] px-4 py-3 flex items-center justify-between"
      style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
      <div className={dir === 'rtl' ? 'text-right' : ''}>
        <div className="text-[30px] font-semibold" style={{ color: pctColor(score) }}>{score}%</div>
        <div className="text-[11px] text-gray-400 mt-[2px]">{label}</div>
        <div className="flex items-center gap-3 mt-2"
          style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
          <div className="text-[12px] text-gray-700">
            🔥 <span className="font-medium">{streakCurrent}</span>
            <span className="text-gray-400 text-[10px] ml-1">{t.dayStreak}</span>
          </div>
          <div className="text-[12px] text-gray-400">
            🏆 {t.best}: <span className="font-medium text-gray-700">{streakBest}</span>
          </div>
        </div>
      </div>
      {/* Ring */}
      <div className="relative w-[60px] h-[60px] flex-shrink-0">
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="30" cy="30" r="24" fill="none" stroke="#f3f4f6" strokeWidth="6"/>
          <circle cx="30" cy="30" r="24" fill="none" strokeWidth="6"
            stroke={pctColor(score)}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"/>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-gray-800">
          {score}%
        </span>
      </div>
    </div>
  )
}

// ─── COMPLETION RATE CARDS ────────────────────────────────

export function CompletionCards({
  activities,
  lang,
  dir,
  t,
}: {
  activities: ActivityStat[]
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: ReportT
}) {
  if (activities.length === 0) return null

  return (
    <div className="mx-4 mb-3 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      <div className={cn(
        'px-4 py-[10px] border-b border-gray-100 flex items-center justify-between',
        dir === 'rtl' && 'flex-row-reverse'
      )}>
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400',
          dir === 'rtl' && 'tracking-normal normal-case text-[11px]'
        )}>{t.byActivity}</p>
        <p className="text-[11px] text-gray-400">{t.completion}</p>
      </div>
      {activities.map((a, i) => (
        <div
          key={a.key}
          className={cn(
            'flex items-center px-4 py-[9px] gap-3',
            i < activities.length - 1 && 'border-b border-gray-100',
            dir === 'rtl' && 'flex-row-reverse'
          )}
        >
          <span className="flex-1 text-[13px] text-gray-800">
            {lang === 'ar' ? a.nameAr : a.nameEn}
          </span>
          <div className="w-[60px] h-[4px] bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${a.pct}%`, backgroundColor: pctColor(a.pct) }}
            />
          </div>
          <span className="text-[12px] font-semibold w-8 text-right flex-shrink-0"
            style={{ color: pctColor(a.pct) }}>
            {a.pct}%
          </span>
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: pctDot(a.pct) }}/>
        </div>
      ))}
    </div>
  )
}

// ─── STREAK CARDS ─────────────────────────────────────────

export function StreakCards({
  streaks,
  lang,
  dir,
  t,
}: {
  streaks: StreakStat[]
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: ReportT
}) {
  if (streaks.length === 0) return null

  return (
    <div className="mx-4 mb-3 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      <div className={cn(
        'px-4 py-[10px] border-b border-gray-100 flex items-center justify-between',
        dir === 'rtl' && 'flex-row-reverse'
      )}>
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400',
          dir === 'rtl' && 'tracking-normal normal-case text-[11px]'
        )}>{t.perActivity}</p>
        <div className="flex gap-3 text-[10px] text-gray-400"
          style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
          <span>{t.current}</span>
          <span>{t.best}</span>
        </div>
      </div>
      {streaks.map((s, i) => (
        <div
          key={s.key}
          className={cn(
            'flex items-center px-4 py-[9px] gap-3',
            i < streaks.length - 1 && 'border-b border-gray-100',
            dir === 'rtl' && 'flex-row-reverse'
          )}
        >
          <span className="flex-1 text-[13px] text-gray-800">
            {lang === 'ar' ? s.nameAr : s.nameEn}
          </span>
          <div className="flex items-center gap-3 flex-shrink-0"
            style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
            <span className={cn(
              'text-[13px] font-semibold min-w-[40px] text-right',
              s.current > 0 ? 'text-emerald-600' : 'text-gray-300'
            )}>
              {s.current > 0 ? `↑ ${s.current}` : '—'}
            </span>
            <span className="text-[11px] text-gray-400 min-w-[40px] text-right">
              {t.bestShort} {s.best}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── FASTING SUMMARY ──────────────────────────────────────

export function FastingSummary({
  fasting,
  lang,
  dir,
  t,
}: {
  fasting: {
    ramadanDays: number
    mondayThursday: number
    whiteDays: number
    voluntary: number
    qadaRemaining: number
  }
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: ReportT
}) {
  const rows = [
    { label: t.fastRamadan,  value: fasting.ramadanDays,    color: '#059669' },
    { label: t.fastMonThu,   value: fasting.mondayThursday, color: '#2563eb' },
    { label: t.fastWhite,    value: fasting.whiteDays,       color: '#6b7280' },
    { label: t.fastVol,      value: fasting.voluntary,       color: '#6b7280' },
  ]

  return (
    <div className="mx-4 mb-3 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      <div className={cn(
        'px-4 py-[10px] border-b border-gray-100',
        dir === 'rtl' && 'text-right'
      )}>
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400',
          dir === 'rtl' && 'tracking-normal normal-case text-[11px]'
        )}>{t.fastingTitle}</p>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center px-4 py-[9px]',
            i < rows.length - 1 && 'border-b border-gray-100',
            dir === 'rtl' && 'flex-row-reverse'
          )}
        >
          <span className="flex-1 text-[13px] text-gray-700">{row.label}</span>
          <span className="text-[14px] font-semibold" style={{ color: row.color }}>
            {row.value > 0 ? `${row.value} ${lang === 'ar' ? 'أيام' : 'days'}` : '—'}
          </span>
        </div>
      ))}
      {fasting.qadaRemaining > 0 && (
        <div className={cn(
          'px-4 py-[10px] bg-red-50 flex items-center border-t border-red-100',
          dir === 'rtl' && 'flex-row-reverse'
        )}>
          <span className="flex-1 text-[12px] text-red-600">{t.qadaRemaining}</span>
          <span className="text-[13px] font-semibold text-red-600">
            {fasting.qadaRemaining} {lang === 'ar' ? 'أيام' : 'days'}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── COUNTER CARD + LINE CHART ────────────────────────────

export function CounterCard({
  icon,
  title,
  data,
  trend,
  trendKey,
  lang,
  dir,
  t,
}: {
  icon: string
  title: string
  data: { today: number; week: number; month: number; allTime: number }
  trend: TrendPoint[]
  trendKey: 'istighfar' | 'salawat'
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: ReportT
}) {
  const rows = [
    { label: t.today,   value: data.today },
    { label: t.week,    value: data.week },
    { label: t.month,   value: data.month },
    { label: t.allTime, value: data.allTime },
  ]

  const chartData = trend.map((p, i) => ({
    name: `W${i + 1}`,
    value: p[trendKey],
  }))

  return (
    <div className="mx-4 mb-3 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      {/* Header */}
      <div className={cn(
        'px-4 py-[10px] border-b border-gray-100 flex items-center gap-2',
        dir === 'rtl' && 'flex-row-reverse'
      )}>
        <span className="text-[16px]">{icon}</span>
        <p className="text-[13px] font-semibold text-gray-800">{title}</p>
      </div>

      {/* Number rows */}
      <div className="px-4 py-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between py-[6px]',
              i < rows.length - 1 && 'border-b border-gray-50',
              dir === 'rtl' && 'flex-row-reverse'
            )}
          >
            <span className="text-[12px] text-gray-500">{row.label}</span>
            <span className="text-[14px] font-semibold text-gray-900">
              {row.value.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
            </span>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="px-2 pb-3">
        <p className={cn(
          'text-[10px] text-gray-400 px-2 mb-1',
          dir === 'rtl' && 'text-right'
        )}>{t.trend8weeks}</p>
        <ResponsiveContainer width="100%" height={70}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb',
                padding: '4px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(v: number) => [v.toLocaleString(), title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#059669', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#059669' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
