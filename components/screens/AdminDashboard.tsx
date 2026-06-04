'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const T = {
  en: {
    title:          'Admin Dashboard',
    tier1:          'Growth & health',
    tier2:          'Activity: last 14 days',
    tier3:          'Conversion funnel',
    tier4:          'Engagement health',
    tier5:          'Acquisition channels',
    totalUsers:     'Total users',
    activeWeek:     'Weekly active',
    premium:        'Premium',
    newMonth:       'New this month',
    thisWeek:       'this week',
    vsLastWeek:     'vs last week',
    ofTotal:        'of total',
    conversion:     'conversion',
    streak7:        '7-day streak',
    streak30:       '30-day streak',
    atRisk:         'At risk',
    atRiskSub:      'No log in 14 days',
    refPipeline:    'Referral pipeline',
    refSent:        'Invites sent',
    refActivated:   'Activated',
    refRate:        'Activation rate',
    funnelRegistered:  'Registered',
    funnelOnboarding:  'Onboarding done',
    funnelLogged:      'Logged at least once',
    funnelActive:      'Active this week',
    funnelPremium:     'Premium',
    acqTitle:       'How users found us',
    acqUnknown:     'Not answered',
    users:          'Users',
    search:         'Search by name or email...',
    filterAll:      'All',
    filterPremium:  'Premium',
    filterFree:     'Free',
    grantPremium:   'Grant Premium',
    revokePremium:  'Revoke',
    loading:        'Loading...',
    prev:           'Prev',
    next:           'Next',
    sendReminders:  'Send monthly reminders now',
    sending:        'Sending...',
    sent:           'Sent',
    joined:         'Joined',
    logs:           'logs',
    lifetime:       'Lifetime',
    expires:        'Expires',
    noUsers:        'No users found.',
    actions:        'Quick actions',
  },
  ar: {
    title:          'لوحة الإدارة',
    tier1:          'النمو والصحة',
    tier2:          'النشاط - آخر 14 يوم',
    tier3:          'مسار التحويل',
    tier4:          'صحة الالتزام',
    tier5:          'قنوات الاكتساب',
    totalUsers:     'إجمالي المستخدمين',
    activeWeek:     'نشطون أسبوعياً',
    premium:        'بريميوم',
    newMonth:       'جدد هذا الشهر',
    thisWeek:       'هذا الأسبوع',
    vsLastWeek:     'مقارنة بالأسبوع الماضي',
    ofTotal:        'من الإجمالي',
    conversion:     'معدل التحويل',
    streak7:        'سلسلة 7 أيام',
    streak30:       'سلسلة 30 يوم',
    atRisk:         'في خطر',
    atRiskSub:      'لا سجل منذ 14 يوماً',
    refPipeline:    'مسار الإحالات',
    refSent:        'دعوات مُرسلة',
    refActivated:   'تفعيلات',
    refRate:        'معدل التفعيل',
    funnelRegistered:  'مسجلون',
    funnelOnboarding:  'أكملوا الإعداد',
    funnelLogged:      'سجلوا مرة على الأقل',
    funnelActive:      'نشطون هذا الأسبوع',
    funnelPremium:     'بريميوم',
    acqTitle:       'كيف وجدنا المستخدمون',
    acqUnknown:     'لم يجيبوا',
    users:          'المستخدمون',
    search:         'ابحث بالاسم أو البريد...',
    filterAll:      'الكل',
    filterPremium:  'بريميوم',
    filterFree:     'مجاني',
    grantPremium:   'منح بريميوم',
    revokePremium:  'إلغاء',
    loading:        'جاري التحميل...',
    prev:           'السابق',
    next:           'التالي',
    sendReminders:  'إرسال التذكيرات الشهرية',
    sending:        'جارٍ الإرسال...',
    sent:           'تم الإرسال',
    joined:         'انضم',
    logs:           'سجلات',
    lifetime:       'مدى الحياة',
    expires:        'تنتهي',
    noUsers:        'لا يوجد مستخدمون.',
    actions:        'إجراءات سريعة',
  },
}

const CHANNEL_LABELS: Record<string, string> = {
  friend:       '👥 Friend / Family',
  social:       '📱 Social media',
  search:       '🔍 Google / Search',
  islamic_site: '🕌 Islamic site',
  youtube:      '▶️ YouTube',
  referral:     '🎁 Referral link',
  other:        '💬 Other',
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data?.length) return null
  const W = 600, H = 72, pad = 8
  const max = Math.max(...data.map(d => d.count), 1)
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2)
    const y = H - pad - (d.count / max) * (H - pad * 2)
    return [x, y] as [number, number]
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length-1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }} preserveAspectRatio="none">
      <path d={area} fill="#05966920"/>
      <path d={line} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#059669"/>)}
    </svg>
  )
}

function SectionLabel({ label, dir }: { label: string; dir: string }) {
  return (
    <p className={cn('mx-4 mb-2 mt-5 text-[10px] font-bold uppercase tracking-widest text-gray-400',
      dir === 'rtl' && 'text-right tracking-normal text-[11px]')}>
      {label}
    </p>
  )
}

function KpiCard({ label, value, sub, trendDir }: {
  label: string; value: string | number
  sub?: string; trendDir?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-[12px] px-4 py-3">
      <p className="text-[11px] text-gray-400 mb-1">{label}</p>
      <p className="text-[22px] font-bold text-gray-900 leading-none">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub && (
        <p className={cn('text-[11px] mt-[5px]',
          trendDir === 'up' ? 'text-emerald-600' : trendDir === 'down' ? 'text-red-500' : 'text-gray-400')}>
          {trendDir === 'up' ? '▲ ' : trendDir === 'down' ? '▼ ' : ''}{sub}
        </p>
      )}
    </div>
  )
}

function FunnelRow({ label, count, total, color, dir }: {
  label: string; count: number; total: number; color: string; dir: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mb-3">
      <div className={cn('flex justify-between text-[12px] mb-[5px]', dir === 'rtl' && 'flex-row-reverse')}>
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-400">{count.toLocaleString()} <span className="text-gray-300">({pct}%)</span></span>
      </div>
      <div className="w-full h-[10px] bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }}/>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { lang, dir } = useLang()
  const t = T[lang]

  const [stats,          setStats]          = useState<any>(null)
  const [users,          setUsers]          = useState<any[]>([])
  const [pagination,     setPagination]     = useState({ page: 1, total: 0, pages: 1 })
  const [search,         setSearch]         = useState('')
  const [filter,         setFilter]         = useState('all')
  const [loadingStats,   setLoadingStats]   = useState(true)
  const [loadingUsers,   setLoadingUsers]   = useState(true)
  const [reminderStatus, setReminderStatus] = useState<'idle'|'sending'|'sent'>('idle')
  const [updatingUser,   setUpdatingUser]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoadingStats(false) })
      .catch(() => setLoadingStats(false))
  }, [])

  const loadUsers = useCallback(async (page = 1) => {
    setLoadingUsers(true)
    const params = new URLSearchParams({ page: String(page), search, filter })
    const res  = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setPagination(data.pagination ?? { page: 1, total: 0, pages: 1 })
    setLoadingUsers(false)
  }, [search, filter])

  useEffect(() => { loadUsers(1) }, [loadUsers])

  const setPremium = async (userId: string, grant: boolean) => {
    setUpdatingUser(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isPremium: grant }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium: grant } : u))
    setUpdatingUser(null)
  }

  const sendReminders = async () => {
    setReminderStatus('sending')
    await fetch('/api/admin/reminders', { method: 'POST' })
    setReminderStatus('sent')
    setTimeout(() => setReminderStatus('idle'), 3000)
  }

  const previewOnboarding = async () => {
    await fetch('/api/admin/preview-onboarding', { method: 'POST' })
    window.location.href = '/onboarding'
  }

  const wowTrend = stats
    ? (stats.users.newPrevWeek === 0 ? 'neutral' : stats.users.newThisWeek >= stats.users.newPrevWeek ? 'up' : 'down') as 'up'|'down'|'neutral'
    : undefined

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      <div className={cn('flex items-center justify-between px-4 pt-5 pb-3', dir === 'rtl' && 'flex-row-reverse')}>
        <h1 className="text-[20px] font-bold text-gray-900">{t.title}</h1>
        <span className="text-[11px] bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full">Admin</span>
      </div>

      {loadingStats ? (
        <div className="mx-4 space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-[80px] bg-gray-100 rounded-[12px] animate-pulse"/>)}
        </div>
      ) : stats && (
        <>
          {/* TIER 1 */}
          <SectionLabel label={t.tier1} dir={dir}/>
          <div className="px-4 grid grid-cols-2 gap-3">
            <KpiCard label={t.totalUsers}  value={stats.users.total}
              sub={`+${stats.users.newThisWeek} ${t.thisWeek}`} trendDir="up"/>
            <KpiCard label={t.activeWeek} value={stats.users.activeThisWeek}
              sub={`${stats.users.total > 0 ? Math.round((stats.users.activeThisWeek / stats.users.total) * 100) : 0}% ${t.ofTotal}`} trendDir="neutral"/>
            <KpiCard label={t.premium} value={stats.users.premium}
              sub={`${stats.users.total > 0 ? +(stats.users.premium / stats.users.total * 100).toFixed(1) : 0}% ${t.conversion}`} trendDir="up"/>
            <KpiCard label={t.newMonth} value={stats.users.newThisMonth}
              sub={`${t.thisWeek}: ${stats.users.newThisWeek} · ${t.vsLastWeek}: ${stats.users.newPrevWeek}`} trendDir={wowTrend}/>
          </div>

          {/* TIER 2: SPARKLINE */}
          <SectionLabel label={t.tier2} dir={dir}/>
          <div className="mx-4 bg-white border border-gray-200 rounded-[14px] p-4">
            <div className={cn('flex justify-between text-[11px] text-gray-400 mb-3', dir === 'rtl' && 'flex-row-reverse')}>
              <span>{stats.chart?.[0]?.date}</span>
              <span className="text-emerald-600 font-semibold">
                {stats.chart?.reduce((s: number, d: any) => s + d.count, 0).toLocaleString()} logs
              </span>
              <span>{stats.chart?.[stats.chart.length - 1]?.date}</span>
            </div>
            <Sparkline data={stats.chart ?? []}/>
          </div>

          {/* TIER 3: FUNNEL */}
          <SectionLabel label={t.tier3} dir={dir}/>
          <div className="mx-4 bg-white border border-gray-200 rounded-[14px] p-4">
            {stats.funnel && [
              { label: t.funnelRegistered, count: stats.funnel.registered,        color: '#059669' },
              { label: t.funnelOnboarding, count: stats.funnel.onboardingDone,    color: '#0d9488' },
              { label: t.funnelLogged,     count: stats.funnel.loggedAtLeastOnce, color: '#0284c7' },
              { label: t.funnelActive,     count: stats.funnel.activeThisWeek,    color: '#7c3aed' },
              { label: t.funnelPremium,    count: stats.funnel.premium,           color: '#b45309' },
            ].map((s, i) => (
              <FunnelRow key={i} label={s.label} count={s.count} total={stats.funnel.registered} color={s.color} dir={dir}/>
            ))}
          </div>

          {/* TIER 4: HEALTH */}
          <SectionLabel label={t.tier4} dir={dir}/>
          <div className="px-4 grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-[14px] p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">
                {lang === 'ar' ? 'السلاسل' : 'Streaks'}
              </p>
              <div className="flex flex-col gap-[10px]">
                <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
                  <span className="text-[12px] text-gray-500">🔥 {t.streak7}</span>
                  <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2 py-[2px] rounded-full">{stats.health?.streak7plus ?? 0}</span>
                </div>
                <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
                  <span className="text-[12px] text-gray-500">⭐ {t.streak30}</span>
                  <span className="text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2 py-[2px] rounded-full">{stats.health?.streak30plus ?? 0}</span>
                </div>
                <div className="h-px bg-gray-100"/>
                <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
                  <div className={dir === 'rtl' ? 'text-right' : ''}>
                    <p className="text-[12px] text-gray-500">⚠️ {t.atRisk}</p>
                    <p className="text-[10px] text-gray-300">{t.atRiskSub}</p>
                  </div>
                  <span className="text-[12px] font-bold text-amber-700 bg-amber-50 px-2 py-[2px] rounded-full">{stats.health?.atRisk ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-[14px] p-4">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">{t.refPipeline}</p>
              <div className="flex flex-col gap-[10px]">
                <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
                  <span className="text-[12px] text-gray-500">{t.refSent}</span>
                  <span className="text-[12px] font-bold text-gray-700">{stats.referrals?.sent ?? 0}</span>
                </div>
                <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
                  <span className="text-[12px] text-gray-500">{t.refActivated}</span>
                  <span className="text-[12px] font-bold text-emerald-700">{stats.referrals?.activated ?? 0}</span>
                </div>
                <div className="h-px bg-gray-100"/>
                <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
                  <span className="text-[12px] text-gray-500">{t.refRate}</span>
                  <span className="text-[12px] font-bold text-blue-700 bg-blue-50 px-2 py-[2px] rounded-full">{stats.referrals?.activationRate ?? 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* TIER 5: ACQUISITION */}
          {stats.acquisition?.length > 0 && (() => {
            const rows: { channel: string; count: number }[] = stats.acquisition
            const total = rows.reduce((s: number, r: any) => s + r.count, 0)
            return (
              <>
                <SectionLabel label={t.tier5} dir={dir}/>
                <div className="mx-4 bg-white border border-gray-200 rounded-[14px] p-4">
                  <div className="flex flex-col gap-3">
                    {rows.map((row: any) => {
                      const pct   = total > 0 ? Math.round((row.count / total) * 100) : 0
                      const label = CHANNEL_LABELS[row.channel] ?? (row.channel === 'unknown' ? `💬 ${t.acqUnknown}` : row.channel)
                      return (
                        <div key={row.channel}>
                          <div className={cn('flex justify-between text-[12px] mb-[4px]', dir === 'rtl' && 'flex-row-reverse')}>
                            <span className="text-gray-600">{label}</span>
                            <span className="text-gray-400">{row.count} <span className="text-gray-300">({pct}%)</span></span>
                          </div>
                          <div className="w-full h-[6px] bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )
          })()}
        </>
      )}

      {/* ACTIONS */}
      <SectionLabel label={t.actions} dir={dir}/>
      <div className="mx-4 mb-2">
        <button onClick={sendReminders} disabled={reminderStatus !== 'idle'}
          className={cn('w-full py-[12px] rounded-[12px] text-[13px] font-semibold transition-all',
            reminderStatus === 'sent'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gray-800 text-white active:opacity-80 disabled:opacity-50')}>
          {reminderStatus === 'idle' ? `🔔 ${t.sendReminders}` : reminderStatus === 'sending' ? t.sending : `✓ ${t.sent}`}
        </button>
      </div>
      <div className="mx-4 mb-5 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        <a href="/admin/azkar" className={cn('flex items-center gap-3 px-4 py-[13px] border-b border-gray-100 active:bg-gray-50', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[20px]">📿</span>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[14px] font-medium text-gray-900">{lang === 'ar' ? 'إدارة الأذكار' : 'Azkar Manager'}</p>
            <p className="text-[11px] text-gray-400">{lang === 'ar' ? 'أذكار الصباح والمساء والمخصصة' : 'Morning, Evening & Custom azkar'}</p>
          </div>
          <span className="text-gray-300">{dir === 'rtl' ? '‹' : '›'}</span>
        </a>
                <a href="/admin/calendar" className={cn('flex items-center gap-3 px-4 py-[13px] border-b border-gray-100 active:bg-gray-50', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[20px]">🌙</span>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[14px] font-medium text-gray-900">{lang === 'ar' ? 'إدارة التقويم الإسلامي' : 'Islamic Calendar Manager'}</p>
            <p className="text-[11px] text-gray-400">{lang === 'ar' ? 'ضبط مواعيد رؤية الهلال حسب الدولة' : 'Set moon-sighting dates per country'}</p>
          </div>
          <span className="text-gray-300">{dir === 'rtl' ? '‹' : '›'}</span>
        </a>
        <a href="/admin/promo" className={cn('flex items-center gap-3 px-4 py-[13px] border-b border-gray-100 active:bg-gray-50', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[20px]">🎁</span>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[14px] font-medium text-gray-900">{lang === 'ar' ? 'أكواد الترقية والمنح' : 'Promo Codes & Grants'}</p>
            <p className="text-[11px] text-gray-400">{lang === 'ar' ? 'إنشاء أكواد مجانية ومنح بريميوم مباشرة' : 'Create free codes and grant Premium directly'}</p>
          </div>
          <span className="text-gray-300">{dir === 'rtl' ? '‹' : '›'}</span>
        </a>
        <button onClick={previewOnboarding} className={cn('w-full flex items-center gap-3 px-4 py-[13px] active:bg-gray-50 text-left', dir === 'rtl' && 'flex-row-reverse text-right')}>
          <span className="text-[20px]">👁️</span>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[14px] font-medium text-gray-900">{lang === 'ar' ? 'معاينة الإعداد الأولي' : 'Preview Onboarding'}</p>
            <p className="text-[11px] text-gray-400">{lang === 'ar' ? 'شاهد تجربة الإعداد كما يراها المستخدم الجديد' : 'See the setup flow as a new user would'}</p>
          </div>
          <span className="text-gray-300">{dir === 'rtl' ? '‹' : '›'}</span>
        </button>
      </div>

      {/* USER LIST */}
      <SectionLabel label={t.users} dir={dir}/>
      <div className="mx-4 mb-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.search} dir={dir}
          className="w-full h-[40px] rounded-[10px] border border-gray-200 bg-white px-3 text-[13px] focus:outline-none focus:border-emerald-400"/>
      </div>
      <div className={cn('flex gap-2 px-4 mb-3', dir === 'rtl' && 'flex-row-reverse')}>
        {(['all', 'premium', 'free'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-[5px] rounded-full text-[11px] font-medium border transition-all',
              filter === f ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200')}>
            {f === 'all' ? t.filterAll : f === 'premium' ? t.filterPremium : t.filterFree}
          </button>
        ))}
      </div>

      <div className="mx-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden mb-4">
        {loadingUsers ? (
          <div className="h-[200px] flex items-center justify-center text-[13px] text-gray-400">{t.loading}</div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-gray-400">{t.noUsers}</div>
        ) : users.map((u, i) => (
          <div key={u.id} className={cn('px-4 py-3 flex flex-col gap-1', i < users.length - 1 && 'border-b border-gray-100')}>
            <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
              <div className={dir === 'rtl' ? 'text-right' : ''}>
                <p className="text-[13px] font-semibold text-gray-900">{u.name}</p>
                <p className="text-[11px] text-gray-400">{u.email}</p>
              </div>
              <div className={cn('flex items-center gap-2', dir === 'rtl' && 'flex-row-reverse')}>
                {u.isPremium && <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-[2px] rounded-full">⭐ {t.premium}</span>}
                {u.isAdmin  && <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-[2px] rounded-full">Admin</span>}
              </div>
            </div>
            <div className={cn('flex items-center gap-3 text-[10px] text-gray-400', dir === 'rtl' && 'flex-row-reverse')}>
              <span>{t.joined} {new Date(u.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span>{u._count?.dailyLogs ?? 0} {t.logs}</span>
              {u.isPremium && u.premiumExpiresAt  && <><span>·</span><span className="text-amber-600">{t.expires} {new Date(u.premiumExpiresAt).toLocaleDateString()}</span></>}
              {u.isPremium && !u.premiumExpiresAt && <><span>·</span><span className="text-emerald-600">{t.lifetime}</span></>}
            </div>
            <div className={cn('flex gap-2 mt-1', dir === 'rtl' && 'flex-row-reverse')}>
              {u.isPremium ? (
                <button onClick={() => setPremium(u.id, false)} disabled={updatingUser === u.id}
                  className="text-[11px] text-red-500 border border-red-100 rounded-full px-3 py-[4px] active:bg-red-50 disabled:opacity-50">
                  {updatingUser === u.id ? '...' : t.revokePremium}
                </button>
              ) : (
                <button onClick={() => setPremium(u.id, true)} disabled={updatingUser === u.id}
                  className="text-[11px] text-emerald-700 border border-emerald-200 rounded-full px-3 py-[4px] active:bg-emerald-50 disabled:opacity-50">
                  {updatingUser === u.id ? '...' : t.grantPremium}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className={cn('flex items-center justify-between px-4 pb-4', dir === 'rtl' && 'flex-row-reverse')}>
          <button onClick={() => loadUsers(pagination.page - 1)} disabled={pagination.page <= 1}
            className="text-[12px] text-gray-500 border border-gray-200 rounded-[8px] px-3 py-[6px] disabled:opacity-30">
            {t.prev}
          </button>
          <span className="text-[12px] text-gray-400">{pagination.page} / {pagination.pages}</span>
          <button onClick={() => loadUsers(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
            className="text-[12px] text-gray-500 border border-gray-200 rounded-[8px] px-3 py-[6px] disabled:opacity-30">
            {t.next}
          </button>
        </div>
      )}

    </div>
  )
}
