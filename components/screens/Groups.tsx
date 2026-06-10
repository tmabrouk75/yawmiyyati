'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:        'Groups',
    myGroups:     'My Groups',
    noGroups:     "You're not in any groups yet.",
    createGroup:  'Create a group',
    joinInfo:     'Get a Premium member to add you to their group.',
    premiumOnly:  'Creating groups requires Premium',
    upgrade:      'Upgrade',
    // Goal types
    goalTypes: {
      QURAN_KHATM: 'Quran Khatm',
      ISTIGHFAR:   'Istighfar',
      SALAWAT:     'Salawat',
      FASTING:     'Fasting Together',
      CUSTOM:      'Custom Goal',
    } as Record<string, string>,
    // Status
    completed:    'Completed 🎉',
    active:       'Active',
    deadline:     'Deadline',
    noDeadline:   'No deadline',
    members:      'members',
    owner:        'Owner',
    you:          'You',
    // Detail
    back:         'Back',
    totalProgress:'Group progress',
    myContrib:    'My contribution',
    addContrib:   'Add my contribution',
    addAmount:    'Enter amount',
    add:          'Add',
    memberList:   'Contributions',
    privacyNote:  'Only contribution numbers are visible to members.',
    addMember:    'Add member',
    enterEmail:   'Member\'s email',
    invite:       'Add',
    leaveGroup:   'Leave group',
    deleteGroup:  'Delete group',
    // Create form
    newGroup:     'New Group',
    groupName:    'Group name',
    goalType:     'Goal type',
    goalTarget:   'Target amount',
    goalDeadline: 'Deadline (optional)',
    create:       'Create Group',
    cancel:       'Cancel',
    loading:      'Loading...',
  },
  ar: {
    title:        'المجموعات',
    myGroups:     'مجموعاتي',
    noGroups:     'لست في أي مجموعة بعد.',
    createGroup:  'إنشاء مجموعة',
    joinInfo:     'اطلب من مشترك بريميوم إضافتك إلى مجموعته.',
    premiumOnly:  'إنشاء المجموعات يتطلب اشتراك بريميوم',
    upgrade:      'ترقية',
    goalTypes: {
      QURAN_KHATM: 'ختمة القرآن',
      ISTIGHFAR:   'الاستغفار',
      SALAWAT:     'الصلاة على النبي',
      FASTING:     'الصيام المشترك',
      CUSTOM:      'هدف مخصص',
    } as Record<string, string>,
    completed:    'اكتمل 🎉',
    active:       'نشط',
    deadline:     'الموعد النهائي',
    noDeadline:   'بلا موعد',
    members:      'أعضاء',
    owner:        'المنشئ',
    you:          'أنت',
    back:         'رجوع',
    totalProgress:'تقدم المجموعة',
    myContrib:    'مساهمتي',
    addContrib:   'أضف مساهمتي',
    addAmount:    'أدخل الكمية',
    add:          'إضافة',
    memberList:   'المساهمات',
    privacyNote:  'تظهر أرقام المساهمات فقط للأعضاء.',
    addMember:    'إضافة عضو',
    enterEmail:   'البريد الإلكتروني للعضو',
    invite:       'إضافة',
    leaveGroup:   'مغادرة المجموعة',
    deleteGroup:  'حذف المجموعة',
    newGroup:     'مجموعة جديدة',
    groupName:    'اسم المجموعة',
    goalType:     'نوع الهدف',
    goalTarget:   'الهدف الكمي',
    goalDeadline: 'الموعد النهائي (اختياري)',
    create:       'إنشاء المجموعة',
    cancel:       'إلغاء',
    loading:      'جارٍ التحميل...',
  },
}

// ─── PROGRESS BAR ─────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: pct >= 100 ? '#059669' : '#10b981',
        }}
      />
    </div>
  )
}

// ─── GROUP CARD ───────────────────────────────────────────

function GroupCard({
  group,
  lang,
  dir,
  t,
  onOpen,
}: {
  group: any
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
  onOpen: () => void
}) {
  const isComplete = group.progressPct >= 100
  return (
    <button
      onClick={onOpen}
      className={cn(
        'w-full bg-white border rounded-[14px] p-4 text-left mb-3 transition-all active:bg-gray-50',
        isComplete ? 'border-emerald-200' : 'border-gray-200'
      )}
    >
      <div className={cn('flex items-start justify-between mb-2')}>
        <div className={dir === 'rtl' ? 'text-right' : ''}>
          <p className="text-[14px] font-semibold text-gray-900">
            {lang === 'ar' ? group.nameAr : group.nameEn}
          </p>
          <p className="text-[11px] text-gray-400 mt-[1px]">
            {t.goalTypes[group.goalType] ?? group.goalType}
          </p>
        </div>
        <span className={cn(
          'text-[10px] font-semibold px-2 py-[3px] rounded-full flex-shrink-0',
          isComplete
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        )}>
          {isComplete ? t.completed : t.active}
        </span>
      </div>

      <ProgressBar pct={group.progressPct}/>

      <div className={cn('flex items-center justify-between mt-2')}>
        <span className="text-[11px] text-gray-400">
          {group.totalProgress.toLocaleString()} / {group.goalTarget.toLocaleString()} {group.goalUnit}
        </span>
        <span className="text-[11px] text-gray-400">
          {group.memberCount} {t.members}
        </span>
      </div>
    </button>
  )
}

// ─── CREATE GROUP SHEET ───────────────────────────────────

function CreateGroupSheet({
  dir,
  lang,
  t,
  onClose,
  onCreated,
}: {
  dir: 'ltr' | 'rtl'
  lang: 'en' | 'ar'
  t: typeof T['en']
  onClose: () => void
  onCreated: (g: any) => void
}) {
  const [form, setForm] = useState({
    nameEn: '', goalType: 'ISTIGHFAR', goalTarget: '', deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const GOAL_TYPES = ['QURAN_KHATM', 'ISTIGHFAR', 'SALAWAT', 'FASTING', 'CUSTOM']
  const GOAL_UNITS: Record<string, string> = {
    QURAN_KHATM: 'pages',
    ISTIGHFAR:   'count',
    SALAWAT:     'count',
    FASTING:     'days',
    CUSTOM:      'count',
  }

  const submit = async () => {
    if (!form.nameEn || !form.goalTarget) { setError('Fill all required fields'); return }
    setLoading(true)
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameEn:     form.nameEn,
        nameAr:     form.nameEn,
        goalType:   form.goalType,
        goalTarget: parseFloat(form.goalTarget),
        goalUnit:   GOAL_UNITS[form.goalType],
        deadline:   form.deadline || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    onCreated(data.group)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[20px] p-6 pb-8"
        dir={dir}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-[4px] rounded-full bg-gray-200"/>
        </div>
        <p className="text-[17px] font-semibold text-gray-900 mb-4">{t.newGroup}</p>

        <div className="flex flex-col gap-3">
          <input
            value={form.nameEn}
            onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
            placeholder={t.groupName}
            className="h-[44px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none focus:border-emerald-400"
          />
          <select
            value={form.goalType}
            onChange={e => setForm(f => ({ ...f, goalType: e.target.value }))}
            className="h-[44px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none"
          >
            {GOAL_TYPES.map(gt => (
              <option key={gt} value={gt}>{t.goalTypes[gt]}</option>
            ))}
          </select>
          <input
            type="number"
            value={form.goalTarget}
            onChange={e => setForm(f => ({ ...f, goalTarget: e.target.value }))}
            placeholder={t.goalTarget}
            className="h-[44px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none focus:border-emerald-400"
          />
          <input
            type="date"
            value={form.deadline}
            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            className="h-[44px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none"
          />
        </div>

        {error && <p className="text-[12px] text-red-500 mt-2">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-[12px] rounded-[12px] border border-gray-200 text-[14px] text-gray-500">{t.cancel}</button>
          <button onClick={submit} disabled={loading} className="flex-1 py-[12px] rounded-[12px] bg-emerald-600 text-white text-[14px] font-semibold disabled:opacity-50">
            {loading ? '...' : t.create}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── GROUPS LIST SCREEN ───────────────────────────────────

export default function Groups({ isPremium }: { isPremium: boolean }) {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [groups, setGroups]         = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/groups')
    const data = await res.json()
    setGroups(data.groups ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-8">
      <div className={cn('flex items-center justify-between px-4 pt-4 pb-3')}>
        <h1 className="text-[20px] font-semibold text-gray-900">{t.title}</h1>
        {isPremium && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-8 h-8 rounded-full bg-emerald-600 text-white text-[20px] flex items-center justify-center"
          >+</button>
        )}
      </div>

      <div className="px-4">
        {loading ? (
          [1,2].map(i => (
            <div key={i} className="h-[100px] bg-gray-100 rounded-[14px] animate-pulse mb-3"/>
          ))
        ) : groups.length > 0 ? (
          groups.map(g => (
            <GroupCard
              key={g.id} group={g} lang={lang} dir={dir} t={t}
              onOpen={() => router.push(`/groups/${g.id}`)}
            />
          ))
        ) : (
          <div className={cn('py-10 text-center', dir === 'rtl' && 'text-center')}>
            <p className="text-[32px] mb-3">👥</p>
            <p className="text-[14px] text-gray-500 mb-2">{t.noGroups}</p>
            {isPremium ? (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-3 px-5 py-[10px] rounded-full bg-emerald-600 text-white text-[13px] font-semibold"
              >
                {t.createGroup}
              </button>
            ) : (
              <>
                <p className="text-[12px] text-gray-400 mb-3">{t.joinInfo}</p>
                <button
                  onClick={() => router.push('/premium')}
                  className="px-5 py-[9px] rounded-full border border-amber-400 text-amber-600 text-[12px] font-semibold"
                >
                  {t.premiumOnly} · {t.upgrade}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGroupSheet
          dir={dir} lang={lang} t={t}
          onClose={() => setShowCreate(false)}
          onCreated={g => { setGroups(prev => [g, ...prev]); setShowCreate(false) }}
        />
      )}
    </div>
  )
}
