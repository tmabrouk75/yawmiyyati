'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:         'Admin Dashboard',
    stats:         'Platform overview',
    totalUsers:    'Total users',
    premium:       'Premium',
    activeWeek:    'Active this week',
    newMonth:      'New this month',
    totalLogs:     'Total daily logs',
    avgLogs:       'Avg logs / user',
    avgPages:      'Avg Quran pages / user',
    avgIstighfar:  'Avg Istighfar / user',
    avgSalawat:    'Avg Salawat / user',
    groups:        'Active groups',
    refTotal:      'Total referrals',
    refActivated:  'Activated',
    refPending:    'Pending',
    refRedeemed:   'Points redeemed',
    acquisition:   'How users found us',
    acqUnknown:    'Not answered',
    users:         'Users',
    search:        'Search by name or email...',
    filterAll:     'All',
    filterPremium: 'Premium',
    filterFree:    'Free',
    grantPremium:  'Grant Premium',
    revokePremium: 'Revoke',
    makeAdmin:     'Make admin',
    loading:       'Loading...',
    prev:          '← Prev',
    next:          'Next →',
    sendReminders: 'Send monthly reminders now',
    sending:       'Sending...',
    sent:          'Sent ✓',
    joined:        'Joined',
    logs:          'logs',
    lifetime:      'Lifetime',
    expires:       'Expires',
    noUsers:       'No users found.',
  },
  ar: {
    title:         'لوحة الإدارة',
    stats:         'نظرة عامة',
    totalUsers:    'إجمالي المستخدمين',
    premium:       'بريميوم',
    activeWeek:    'نشطون هذا الأسبوع',
    newMonth:      'جدد هذا الشهر',
    totalLogs:     'إجمالي السجلات اليومية',
    avgLogs:       'متوسط السجلات / مستخدم',
    avgPages:      'متوسط صفحات القرآن / مستخدم',
    avgIstighfar:  'متوسط الاستغفار / مستخدم',
    avgSalawat:    'متوسط الصلاة على النبي / مستخدم',
    groups:        'المجموعات النشطة',
    refTotal:      'إجمالي الإحالات',
    refActivated:  'مفعّلة',
    refPending:    'في الانتظار',
    refRedeemed:   'نقاط مستبدلة',
    acquisition:   'كيف وجدنا المستخدمون',
    acqUnknown:    'لم يُجب',
    users:         'المستخدمون',
    search:        'ابحث بالاسم أو البريد...',
    filterAll:     'الكل',
    filterPremium: 'بريميوم',
    filterFree:    'مجاني',
    grantPremium:  'منح بريميوم',
    revokePremium: 'إلغاء',
    makeAdmin:     'جعله مسؤولاً',
    loading:       'جارٍ التحميل...',
    prev:          '→ السابق',
    next:          'التالي ←',
    sendReminders: 'إرسال تذكيرات شهرية الآن',
    sending:       'جارٍ الإرسال...',
    sent:          'تم الإرسال ✓',
    joined:        'انضم',
    logs:          'سجل',
    lifetime:      'دائم',
    expires:       'ينتهي',
    noUsers:       'لا يوجد مستخدمون.',
  },
}

// ─── STAT CARD ────────────────────────────────────────────

function StatCard({ label, value, color = 'gray' }: { label: string; value: string | number; color?: string }) {
  const colors: Record<string, string> = {
    green:  'text-emerald-600',
    amber:  'text-amber-600',
    blue:   'text-blue-600',
    gray:   'text-gray-800',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-[12px] px-4 py-3">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={cn('text-[22px] font-bold', colors[color])}>{value.toLocaleString()}</p>
    </div>
  )
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────

export default function AdminDashboard() {
  const { lang, dir } = useLang()
  const t = T[lang]

  const [stats, setStats]           = useState<any>(null)
  const [users, setUsers]           = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [reminderStatus, setReminderStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  // ── Load stats
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoadingStats(false) })
  }, [])

  // ── Load users
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

  // ── Grant/Revoke Premium
  const setPremium = async (userId: string, grant: boolean) => {
    setUpdatingUser(userId)
    await fetch('/api/admin/users', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, isPremium: grant }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isPremium: grant } : u))
    setUpdatingUser(null)
  }

  // ── Send reminders manually
  const sendReminders = async () => {
    setReminderStatus('sending')
    await fetch('/api/admin/reminders', { method: 'POST' })
    setReminderStatus('sent')
    setTimeout(() => setReminderStatus('idle'), 3000)
  }

  // ── Preview onboarding
  const previewOnboarding = async () => {
    await fetch('/api/admin/preview-onboarding', { method: 'POST' })
    window.location.href = '/onboarding'
  }

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* TOP BAR */}
      <div className={cn('flex items-center justify-between px-4 pt-5 pb-3', dir === 'rtl' && 'flex-row-reverse')}>
        <h1 className="text-[20px] font-bold text-gray-900">{t.title}</h1>
        <span className="text-[11px] bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full">Admin</span>
      </div>

      {/* ── STATS ── */}
      <p className={cn('mx-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400', dir === 'rtl' && 'text-right tracking-normal')}>{t.stats}</p>
      {loadingStats ? (
        <div className="mx-4 h-[120px] bg-gray-100 rounded-[12px] animate-pulse mb-4"/>
      ) : stats && (
        <>
          <div className="px-4 grid grid-cols-2 gap-3 mb-3">
            <StatCard label={t.totalUsers}  value={stats.users.total}         color="blue"/>
            <StatCard label={t.premium}     value={stats.users.premium}       color="amber"/>
            <StatCard label={t.activeWeek}  value={stats.users.activeThisWeek} color="green"/>
            <StatCard label={t.newMonth}    value={stats.users.newThisMonth}  color="gray"/>
          </div>
          <div className="px-4 grid grid-cols-2 gap-3 mb-3">
            <StatCard label={t.totalLogs}    value={stats.activity.totalDailyLogs}           color="gray"/>
            <StatCard label={t.avgLogs}      value={stats.activity.avgLogsPerUser}            color="gray"/>
            <StatCard label={t.avgPages}     value={stats.activity.avgPagesPerUser}           color="green"/>
            <StatCard label={t.avgIstighfar} value={stats.activity.avgIstighfarPerUser}       color="blue"/>
          </div>
          <div className="px-4 grid grid-cols-2 gap-3 mb-3">
            <StatCard label={t.avgSalawat}   value={stats.activity.avgSalawatPerUser}         color="green"/>
            <StatCard label={t.groups}       value={stats.groups.active}                      color="amber"/>
          </div>
          <div className="px-4 grid grid-cols-2 gap-3 mb-3">
            <StatCard label={t.refTotal}     value={stats.referrals?.total       ?? 0} color="blue"/>
            <StatCard label={t.refActivated} value={stats.referrals?.activated   ?? 0} color="green"/>
            <StatCard label={t.refPending}   value={stats.referrals?.pending     ?? 0} color="amber"/>
            <StatCard label={t.refRedeemed}  value={stats.referrals?.redemptions ?? 0} color="gray"/>
          </div>

          {/* Acquisition analytics */}
          {stats.acquisition?.length > 0 && (() => {
            const rows: { channel: string; count: number }[] = stats.acquisition
            const total = rows.reduce((s: number, r: { channel: string; count: number }) => s + r.count, 0)
            const CHANNEL_LABELS: Record<string, string> = {
              friend:       '👥 Friend / Family',
              social:       '📱 Social media',
              search:       '🔍 Google / Search',
              islamic_site: '🕌 Islamic site',
              youtube:      '▶️ YouTube',
              referral:     '🎁 Referral link',
              other:        '💬 Other',
              unknown:      t.acqUnknown,
            }
            return (
              <div className="mx-4 mb-5 bg-white border border-gray-200 rounded-[14px] p-4">
                <p className={cn('text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3', dir === 'rtl' && 'text-right tracking-normal')}>
                  {t.acquisition}
                </p>
                <div className="flex flex-col gap-[10px]">
                  {rows.map((row: { channel: string; count: number }) => {
                    const pct = total > 0 ? Math.round((row.count / total) * 100) : 0
                    const label = CHANNEL_LABELS[row.channel] ?? row.channel
                    return (
                      <div key={row.channel}>
                        <div className={cn('flex justify-between text-[12px] mb-[4px]', dir === 'rtl' && 'flex-row-reverse')}>
                          <span className="text-gray-700">{label}</span>
                          <span className="text-gray-400 font-medium">{row.count} <span className="text-gray-300">({pct}%)</span></span>
                        </div>
                        <div className="w-full h-[6px] bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </>
      )}

      {/* ── REMINDERS ── */}
      <div className="mx-4 mb-5">
        <button
          onClick={sendReminders}
          disabled={reminderStatus !== 'idle'}
          className={cn(
            'w-full py-[12px] rounded-[12px] text-[13px] font-semibold transition-all',
            reminderStatus === 'sent'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-gray-800 text-white active:opacity-80 disabled:opacity-50'
          )}
        >
          {reminderStatus === 'idle'    ? `🔔 ${t.sendReminders}`
           : reminderStatus === 'sending' ? t.sending
           : t.sent}
        </button>
      </div>

      {/* ── QUICK LINKS ── */}
      <div className="mx-4 mb-5 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        <a href="/admin/calendar"
          className={cn('flex items-center gap-3 px-4 py-[13px] border-b border-gray-100 active:bg-gray-50', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[20px]">🌙</span>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[14px] font-medium text-gray-900">{lang === 'ar' ? 'إدارة التقويم الإسلامي' : 'Islamic Calendar Manager'}</p>
            <p className="text-[11px] text-gray-400">{lang === 'ar' ? 'ضبط مواعيد رؤية الهلال حسب الدولة' : 'Set moon-sighting dates per country'}</p>
          </div>
          <span className="text-gray-300 text-[16px]">{dir === 'rtl' ? '‹' : '›'}</span>
        </a>
        <a href="/admin/promo"
          className={cn('flex items-center gap-3 px-4 py-[13px] border-b border-gray-100 active:bg-gray-50', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[20px]">🎁</span>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[14px] font-medium text-gray-900">{lang === 'ar' ? 'أكواد الترقية والمنح' : 'Promo Codes & Grants'}</p>
            <p className="text-[11px] text-gray-400">{lang === 'ar' ? 'إنشاء أكواد مجانية ومنح بريميوم مباشرة' : 'Create free codes and grant Premium directly'}</p>
          </div>
          <span className="text-gray-300 text-[16px]">{dir === 'rtl' ? '‹' : '›'}</span>
        </a>
        <button
          onClick={previewOnboarding}
          className={cn('w-full flex items-center gap-3 px-4 py-[13px] active:bg-gray-50 text-left', dir === 'rtl' && 'flex-row-reverse')}
        >
          <span className="text-[20px]">👁️</span>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[14px] font-medium text-gray-900">{lang === 'ar' ? 'معاينة الإعداد الأولي' : 'Preview Onboarding'}</p>
            <p className="text-[11px] text-gray-400">{lang === 'ar' ? 'شاهد تجربة الإعداد كما يراها المستخدم الجديد' : 'See the setup flow as a new user would'}</p>
          </div>
          <span className="text-gray-300 text-[16px]">{dir === 'rtl' ? '‹' : '›'}</span>
        </button>
      </div>

      {/* ── USERS ── */}
      <p className={cn('mx-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400', dir === 'rtl' && 'text-right tracking-normal')}>{t.users}</p>

      {/* Search */}
      <div className="mx-4 mb-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.search}
          dir={dir}
          className="w-full h-[40px] rounded-[10px] border border-gray-200 bg-white px-3 text-[13px] focus:outline-none focus:border-emerald-400"
        />
      </div>

      {/* Filter pills */}
      <div className={cn('flex gap-2 px-4 mb-3', dir === 'rtl' && 'flex-row-reverse')}>
        {(['all', 'premium', 'free'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-[5px] rounded-full text-[11px] font-medium border transition-all',
              filter === f
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-500 border-gray-200'
            )}
          >
            {f === 'all' ? t.filterAll : f === 'premium' ? t.filterPremium : t.filterFree}
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="mx-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden mb-4">
        {loadingUsers ? (
          <div className="h-[200px] flex items-center justify-center text-[13px] text-gray-400">{t.loading}</div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-gray-400">{t.noUsers}</div>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              className={cn(
                'px-4 py-3 flex flex-col gap-1',
                i < users.length - 1 && 'border-b border-gray-100'
              )}
            >
              {/* Row 1 — name + status */}
              <div className={cn('flex items-center justify-between', dir === 'rtl' && 'flex-row-reverse')}>
                <div className={dir === 'rtl' ? 'text-right' : ''}>
                  <p className="text-[13px] font-semibold text-gray-900">{u.name}</p>
                  <p className="text-[11px] text-gray-400">{u.email}</p>
                </div>
                <div className={cn('flex items-center gap-2', dir === 'rtl' && 'flex-row-reverse')}>
                  {u.isPremium && (
                    <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-[2px] rounded-full">
                      ⭐ {t.premium}
                    </span>
                  )}
                  {u.isAdmin && (
                    <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-[2px] rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2 — meta */}
              <div className={cn('flex items-center gap-3 text-[10px] text-gray-400', dir === 'rtl' && 'flex-row-reverse')}>
                <span>{t.joined} {new Date(u.createdAt).toLocaleDateString()}</span>
                <span>·</span>
                <span>{u._count.dailyLogs} {t.logs}</span>
                {u.isPremium && u.premiumExpiresAt && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600">{t.expires} {new Date(u.premiumExpiresAt).toLocaleDateString()}</span>
                  </>
                )}
                {u.isPremium && !u.premiumExpiresAt && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-600">{t.lifetime}</span>
                  </>
                )}
              </div>

              {/* Row 3 — actions */}
              <div className={cn('flex gap-2 mt-1', dir === 'rtl' && 'flex-row-reverse')}>
                {u.isPremium ? (
                  <button
                    onClick={() => setPremium(u.id, false)}
                    disabled={updatingUser === u.id}
                    className="text-[11px] text-red-500 border border-red-100 rounded-full px-3 py-[4px] active:bg-red-50 disabled:opacity-50"
                  >
                    {updatingUser === u.id ? '...' : t.revokePremium}
                  </button>
                ) : (
                  <button
                    onClick={() => setPremium(u.id, true)}
                    disabled={updatingUser === u.id}
                    className="text-[11px] text-emerald-700 border border-emerald-200 rounded-full px-3 py-[4px] active:bg-emerald-50 disabled:opacity-50"
                  >
                    {updatingUser === u.id ? '...' : t.grantPremium}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className={cn('flex items-center justify-between px-4 mb-4', dir === 'rtl' && 'flex-row-reverse')}>
          <button
            onClick={() => loadUsers(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="text-[12px] text-gray-500 border border-gray-200 rounded-[8px] px-3 py-[6px] disabled:opacity-30"
          >
            {t.prev}
          </button>
          <span className="text-[12px] text-gray-400">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => loadUsers(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="text-[12px] text-gray-500 border border-gray-200 rounded-[8px] px-3 py-[6px] disabled:opacity-30"
          >
            {t.next}
          </button>
        </div>
      )}

    </div>
  )
}
