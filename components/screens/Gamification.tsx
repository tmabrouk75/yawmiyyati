'use client'

import { useState, useEffect } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:       'My Progress',
    level:       'Level',
    xpToNext:    (n: number) => `${n.toLocaleString()} XP to next level`,
    maxLevel:    'Maximum level reached',
    yourXp:      'Total XP',
    badges:      'Badges',
    earned:      'Earned',
    locked:      'Locked',
    all:         'All',
    daily:       'Daily',
    weekly:      'Weekly',
    monthly:     'Monthly',
    milestone:   'Milestone',
    earnedOn:    'Earned',
    recentXp:    'Recent XP',
    loading:     'Loading...',
    noBadges:    'No badges earned yet. Keep going!',
    xpReasons:   {
      fajr_done:             '+20 · Fajr',
      fajr_qadaa:            '+10 · Fajr (Qadaa)',
      dhuhr_done:            '+20 · Dhuhr',
      dhuhr_qadaa:           '+10 · Dhuhr (Qadaa)',
      asr_done:              '+20 · Asr',
      asr_qadaa:             '+10 · Asr (Qadaa)',
      maghrib_done:          '+20 · Maghrib',
      maghrib_qadaa:         '+10 · Maghrib (Qadaa)',
      isha_done:             '+20 · Isha',
      isha_qadaa:            '+10 · Isha (Qadaa)',
      sunnah_fajr_before:    '+4 · Sunnah Fajr',
      sunnah_dhuhr_before:   '+4 · Sunnah Dhuhr (before)',
      sunnah_dhuhr_after:    '+4 · Sunnah Dhuhr (after)',
      sunnah_maghrib_after:  '+4 · Sunnah Maghrib',
      sunnah_isha_after:     '+4 · Sunnah Isha',
      fajr_azkar:            '+4 · Fajr Azkar',
      dhuhr_azkar:           '+4 · Dhuhr Azkar',
      asr_azkar:             '+4 · Asr Azkar',
      maghrib_azkar:         '+4 · Maghrib Azkar',
      isha_azkar:            '+4 · Isha Azkar',
      morning_azkar:         '+4 · Morning Azkar',
      evening_azkar:         '+4 · Evening Azkar',
      tasbih:                'Tasbih',
      quran_any:             '+5 · Quran Reading',
      fasting:               '+15 · Fasting',
      sadaqah:               '+5 · Sadaqah',
      duha:                  '+4 · Duha',
      witr:                  '+3 · Witr',
      qiyam:                 '+10 · Qiyam',
      perfect_day:           '+25 · Perfect Day',
      daily_streak_bonus:    '🔥 Daily Streak Bonus',
    } as Record<string, string>,
  },
  ar: {
    title:       'تقدّمي',
    level:       'المستوى',
    xpToNext:    (n: number) => `${n.toLocaleString('ar-EG')} نقطة للمستوى التالي`,
    maxLevel:    'وصلت إلى أعلى مستوى',
    yourXp:      'إجمالي النقاط',
    badges:      'الإنجازات',
    earned:      'محققة',
    locked:      'غير محققة',
    all:         'الكل',
    daily:       'يومية',
    weekly:      'أسبوعية',
    monthly:     'شهرية',
    milestone:   'إنجازات كبرى',
    earnedOn:    'تحقق في',
    recentXp:    'آخر النقاط',
    loading:     'جارٍ التحميل...',
    noBadges:    'لم تحقق إنجازات بعد. واصل!',
    xpReasons:   {
      fajr_done:             '+٢٠ · الفجر',
      fajr_qadaa:            '+١٠ · الفجر (قضاء)',
      dhuhr_done:            '+٢٠ · الظهر',
      dhuhr_qadaa:           '+١٠ · الظهر (قضاء)',
      asr_done:              '+٢٠ · العصر',
      asr_qadaa:             '+١٠ · العصر (قضاء)',
      maghrib_done:          '+٢٠ · المغرب',
      maghrib_qadaa:         '+١٠ · المغرب (قضاء)',
      isha_done:             '+٢٠ · العشاء',
      isha_qadaa:            '+١٠ · العشاء (قضاء)',
      sunnah_fajr_before:    '+٤ · سنة الفجر',
      sunnah_dhuhr_before:   '+٤ · سنة الظهر (قبل)',
      sunnah_dhuhr_after:    '+٤ · سنة الظهر (بعد)',
      sunnah_maghrib_after:  '+٤ · سنة المغرب',
      sunnah_isha_after:     '+٤ · سنة العشاء',
      fajr_azkar:            '+٤ · أذكار الفجر',
      dhuhr_azkar:           '+٤ · أذكار الظهر',
      asr_azkar:             '+٤ · أذكار العصر',
      maghrib_azkar:         '+٤ · أذكار المغرب',
      isha_azkar:            '+٤ · أذكار العشاء',
      morning_azkar:         '+٤ · أذكار الصباح',
      evening_azkar:         '+٤ · أذكار المساء',
      tasbih:                'التسبيح',
      quran_any:             '+٥ · تلاوة القرآن',
      fasting:               '+١٥ · الصيام',
      sadaqah:               '+٥ · الصدقة',
      duha:                  '+٤ · الضحى',
      witr:                  '+٣ · الوتر',
      qiyam:                 '+١٠ · قيام الليل',
      perfect_day:           '+٢٥ · يوم مثالي',
      daily_streak_bonus:    '🔥 مكافأة السلسلة اليومية',
    } as Record<string, string>,
  },
}

const LEVELS = [
  { level: 1,  nameEn: 'Mubtadi\'',  nameAr: 'مبتدئ',   emoji: '🌱' },
  { level: 2,  nameEn: 'Talib',      nameAr: 'طالب',     emoji: '📖' },
  { level: 3,  nameEn: 'Musallin',   nameAr: 'مصلٍّ',    emoji: '🕌' },
  { level: 4,  nameEn: "Qa'im",      nameAr: 'قائم',     emoji: '🌙' },
  { level: 5,  nameEn: 'Dhakir',     nameAr: 'ذاكر',     emoji: '📿' },
  { level: 6,  nameEn: 'Mujahid',    nameAr: 'مجاهد',    emoji: '⚡' },
  { level: 7,  nameEn: 'Wali',       nameAr: 'ولي',      emoji: '💎' },
  { level: 8,  nameEn: 'Siddiq',     nameAr: 'صدّيق',    emoji: '✨' },
  { level: 9,  nameEn: 'Rabbani',    nameAr: 'رباني',    emoji: '🌟' },
  { level: 10, nameEn: 'Abd Allah',  nameAr: 'عبد الله', emoji: '👑' },
]

const BADGE_CATS = ['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'MILESTONE'] as const
type BadgeCat = typeof BADGE_CATS[number]

// ─── LEVEL CARD ───────────────────────────────────────────

function LevelCard({
  levelInfo,
  totalXp,
  lang,
  dir,
  t,
}: {
  levelInfo: any
  totalXp: number
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
}) {
  const lvl = LEVELS.find(l => l.level === levelInfo.current.level) ?? LEVELS[0]
  const progress = Math.min(100, Math.round(levelInfo.progress))
  const isMax = !levelInfo.nextLevel

  return (
    <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      {/* Top — level info */}
      <div
        className="px-5 pt-5 pb-4 flex items-center gap-4"
        style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}
      >
        {/* Level badge */}
        <div className="w-[64px] h-[64px] rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center flex-shrink-0">
          <span className="text-[28px]">{lvl.emoji}</span>
        </div>
        <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
            {t.level} {levelInfo.current.level}
          </p>
          <p className="text-[20px] font-semibold text-gray-900 leading-tight">
            {lang === 'ar' ? lvl.nameAr : lvl.nameEn}
          </p>
          <p className="text-[12px] text-gray-400 mt-[2px]">
            {t.yourXp}: <span className="font-semibold text-gray-700">
              {totalXp.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
            </span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between mb-2"
          style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
          <span className="text-[10px] text-gray-400">
            {isMax ? t.maxLevel : t.xpToNext(
              (levelInfo.nextLevel?.xp ?? 0) - totalXp
            )}
          </span>
          <span className="text-[10px] font-semibold text-emerald-600">{progress}%</span>
        </div>
        <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Level markers */}
        <div className="flex justify-between mt-3"
          style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
          {LEVELS.map(l => (
            <div
              key={l.level}
              title={lang === 'ar' ? l.nameAr : l.nameEn}
              className={cn(
                'w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] border transition-all',
                l.level <= levelInfo.current.level
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-gray-100 border-gray-200 text-gray-400'
              )}
            >
              {l.level}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── RECENT XP LOG ────────────────────────────────────────

function RecentXpLog({
  recentXp,
  lang,
  dir,
  t,
}: {
  recentXp: any[]
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
}) {
  if (recentXp.length === 0) return null

  return (
    <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
      <div className={cn(
        'px-4 py-[10px] border-b border-gray-100',
        dir === 'rtl' && 'text-right'
      )}>
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400',
          dir === 'rtl' && 'tracking-normal normal-case text-[11px]'
        )}>{t.recentXp}</p>
      </div>
      {recentXp.slice(0, 8).map((entry, i) => {
        const label = t.xpReasons[entry.reason] ?? `+${entry.points} · ${entry.reason}`
        return (
          <div
            key={i}
            className={cn(
              'flex items-center px-4 py-[8px]',
              i < 7 && 'border-b border-gray-100',
            )}
          >
            <span className="flex-1 text-[12px] text-gray-700">{label}</span>
            <span className="text-[13px] font-semibold text-emerald-600">+{entry.points}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── BADGE GALLERY ────────────────────────────────────────

function BadgeGallery({
  allBadges,
  lang,
  dir,
  t,
}: {
  allBadges: any[]
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
}) {
  const [filter, setFilter] = useState<BadgeCat>('ALL')
  const [showEarned, setShowEarned] = useState<'all' | 'earned' | 'locked'>('all')

  const filtered = allBadges.filter(b => {
    const catMatch = filter === 'ALL' || b.category === filter
    const earnedMatch = showEarned === 'all' || (showEarned === 'earned' ? b.earned : !b.earned)
    return catMatch && earnedMatch
  })

  const earnedCount = allBadges.filter(b => b.earned).length

  const catLabel: Record<BadgeCat, string> = {
    ALL:       t.all,
    DAILY:     t.daily,
    WEEKLY:    t.weekly,
    MONTHLY:   t.monthly,
    MILESTONE: t.milestone,
  }

  return (
    <div className="mx-4 mb-4">
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between mb-2',
      )}>
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400',
          dir === 'rtl' && 'tracking-normal normal-case text-[11px]'
        )}>{t.badges}</p>
        <span className="text-[11px] text-emerald-600 font-medium">
          {earnedCount} / {allBadges.length}
        </span>
      </div>

      {/* Category filter */}
      <div className="flex gap-[5px] mb-3 overflow-x-auto pb-1 scrollbar-hide"
        style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
        {BADGE_CATS.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              'flex-shrink-0 px-3 py-[5px] rounded-full text-[11px] font-medium border transition-all',
              filter === cat
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            {catLabel[cat]}
          </button>
        ))}
      </div>

      {/* Earned toggle */}
      <div className="flex gap-[5px] mb-3"
        style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
        {(['all', 'earned', 'locked'] as const).map(opt => (
          <button
            key={opt}
            onClick={() => setShowEarned(opt)}
            className={cn(
              'px-3 py-[4px] rounded-full text-[10px] font-medium border transition-all',
              showEarned === opt
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-400 border-gray-200'
            )}
          >
            {opt === 'all' ? t.all : opt === 'earned' ? t.earned : t.locked}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className={cn('text-[13px] text-gray-400 py-6 text-center', dir === 'rtl' && 'text-center')}>
          {t.noBadges}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map(badge => (
            <div
              key={badge.id}
              className={cn(
                'bg-white border rounded-[12px] p-3 flex flex-col items-center gap-1 transition-all',
                badge.earned
                  ? 'border-emerald-200 shadow-sm'
                  : 'border-gray-100 opacity-40'
              )}
            >
              <span className="text-[28px]">{badge.icon}</span>
              <p className="text-[10px] font-semibold text-gray-800 text-center leading-tight">
                {lang === 'ar' ? badge.nameAr : badge.nameEn}
              </p>
              {badge.earned && (
                <span className="text-[9px] text-emerald-600 font-medium">✓ {t.earned}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN GAMIFICATION SCREEN ─────────────────────────────

export default function Gamification() {
  const { lang, dir } = useLang()
  const t = T[lang]

  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gamification')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-8">

      {/* TOP BAR */}
      <div className={cn(
        'flex items-center px-4 pt-4 pb-3',
      )}>
        <h1 className="text-[20px] font-semibold text-gray-900">{t.title}</h1>
      </div>

      {loading ? (
        <>
          {[120, 80, 200].map((h, i) => (
            <div key={i} className="mx-4 mb-4 bg-gray-100 rounded-[14px] animate-pulse" style={{ height: h }}/>
          ))}
        </>
      ) : data ? (
        <>
          <LevelCard
            levelInfo={data.level}
            totalXp={data.totalXp}
            lang={lang}
            dir={dir}
            t={t}
          />
          <RecentXpLog
            recentXp={data.recentXp}
            lang={lang}
            dir={dir}
            t={t}
          />
          <BadgeGallery
            allBadges={data.allBadges}
            lang={lang}
            dir={dir}
            t={t}
          />
        </>
      ) : null}
    </div>
  )
}
