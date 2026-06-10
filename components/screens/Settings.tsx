'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang, LangToggle } from '@/contexts/LanguageContext'
import {
  SettingsGroup, SectionHeader, SettingsRow,
  Toggle, Badge, Avatar,
} from '@/components/ui/SettingsComponents'
import { cn } from '@/lib/utils'
import { SURAHS } from '@/lib/quran/surahs'
import { toHijri } from '@/lib/hijri'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:         'Settings',
    // Profile
    sProfile:      'Profile',
    editName:      'Edit name',
    gender:        'Gender',
    genderMale:    'Male',
    genderFemale:  'Female',
    genderHint:    'Used to show the Days of Special Time tracker on the home screen',
    premium:       'Premium',
    free:          'Free',
    upgradePremium:'Upgrade to Premium',
    // Language
    sLanguage:     'Language',
    langLabel:     'App language',
    // Activities
    sActivities:   'My Activities',
    activitiesHint:'Choose what appears on your home screen',
    // Surahs
    sSurahs:       'Daily Surahs',
    surahsHint:    'Add Surahs to check off daily',
    addSurah:      'Add a Surah',
    removeSurah:   'Remove',
    surahMax:      'Maximum 10 daily Surahs reached',
    surahSearch:   'Search surahs...',
    // Qada
    sQada:         "Ramadan Qada'",
    qadaYear:      'Hijri year',
    qadaOwed:      'Days I owe',
    qadaSave:      'Save',
    qadaSaved:     'Saved ✓',
    qadaHint:      'Set how many Ramadan fasting days you still need to compensate',
    // Reminders
    sReminders:    'Reminders',
    remindersOn:   'Monthly reminders',
    remindersHint: 'Sent on the 1st of each Hijri month',
    emailReminders:'Email reminders',
    // Account
    sAccount:      'Account',
    support:       'Contact Support',
    supportSub:    'Report an issue or send feedback',
    logout:        'Sign out',
    deleteAccount: 'Delete account',
    // Categories
    catSalah:      'Salah',
    catDhikr:      'Dhikr & Azkar',
    catQuran:      'Quran',
    catFasting:    'Fasting',
    catSadaqah:    'Sadaqah',
  },
  ar: {
    title:         'الإعدادات',
    sProfile:      'الملف الشخصي',
    editName:      'تعديل الاسم',
    gender:        'الجنس',
    genderMale:    'ذكر',
    genderFemale:  'أنثى',
    genderHint:    'يُستخدم لإظهار متابعة أيام الظروف الخاصة في الشاشة الرئيسية',
    premium:       'بريميوم',
    free:          'مجاني',
    upgradePremium:'الترقية إلى بريميوم',
    sLanguage:     'اللغة',
    langLabel:     'لغة التطبيق',
    sActivities:   'نشاطاتي',
    activitiesHint:'اختر ما يظهر على شاشتك الرئيسية',
    sSurahs:       'السور اليومية',
    surahsHint:    'أضف سوراً لتتابعها يومياً',
    addSurah:      'إضافة سورة',
    removeSurah:   'حذف',
    surahMax:      'وصلت الحد الأقصى (١٠ سور)',
    surahSearch:   'ابحث عن سورة...',
    sQada:         'قضاء رمضان',
    qadaYear:      'السنة الهجرية',
    qadaOwed:      'أيام القضاء',
    qadaSave:      'حفظ',
    qadaSaved:     'تم الحفظ ✓',
    qadaHint:      'حدد عدد أيام رمضان التي لم تصمها وتحتاج إلى قضائها',
    sReminders:    'التذكيرات',
    remindersOn:   'تذكيرات شهرية',
    remindersHint: 'تُرسل في أول كل شهر هجري',
    emailReminders:'تذكيرات بريدية',
    sAccount:      'الحساب',
    support:       'تواصل مع الدعم',
    supportSub:    'الإبلاغ عن مشكلة أو إرسال ملاحظة',
    logout:        'تسجيل الخروج',
    deleteAccount: 'حذف الحساب',
    catSalah:      'الصلاة',
    catDhikr:      'الذكر والأذكار',
    catQuran:      'القرآن',
    catFasting:    'الصيام',
    catSadaqah:    'الصدقة',
  },
}

// ─── TYPES ────────────────────────────────────────────────

interface Activity {
  id: string
  key: string
  nameEn: string
  nameAr: string
  category: string
  isEnabled: boolean
  canDisable: boolean   // false = fard prayers — toggle is locked always-on
  sortOrder: number
}

interface UserSurah {
  id: string
  surahNumber: number
  surahNameEn: string
  surahNameAr: string
  sortOrder: number
}

interface UserAzkarItem {
  id: string
  textAr: string
  translationEn: string | null
  translationAr: string | null
  repetitions: number
}

interface AzkarDefItem {
  id: string
  textAr: string
  translationEn: string | null
  translationAr: string | null
  repetitions: number
}

interface QadaRecord {
  id: string
  ramadanYear: number
  totalOwed: number
  totalCompensated: number
}

interface SettingsProps {
  user: {
    name: string; email: string; language: string; theme: string
    isPremium: boolean; remindersEnabled: boolean; emailReminders: boolean
    isAdmin?: boolean; gender?: string | null
  }
  userActivities: Activity[]
  userSurahs: UserSurah[]
  qadaRecords: QadaRecord[]
  userAzkars?: UserAzkarItem[]
}

// ─── CATEGORY ICON MAP ────────────────────────────────────

const CAT_ICON: Record<string, string> = {
  SALAH:   '🕌',
  DHIKR:   '📿',
  QURAN:   '📖',
  FASTING: '🌙',
  SADAQAH: '💛',
}

// ─── SURAH PICKER SHEET ───────────────────────────────────

function SurahPicker({
  existingNumbers,
  lang,
  dir,
  t,
  onAdd,
  onClose,
}: {
  existingNumbers: Set<number>
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
  onAdd: (s: { surahNumber: number; surahNameEn: string; surahNameAr: string }) => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')

  const filtered = SURAHS.filter(s => {
    if (existingNumbers.has(s.number)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.nameEn.toLowerCase().includes(q) ||
      s.nameAr.includes(search) ||
      String(s.number).includes(search)
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[20px] overflow-hidden flex flex-col"
        style={{ maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
        dir={dir}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-[4px] rounded-full bg-gray-200"/>
        </div>
        {/* Search */}
        <div className="px-4 py-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.surahSearch}
            dir={dir}
            className="w-full h-[40px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none focus:border-emerald-400"
            autoFocus
          />
        </div>
        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 pb-6">
          {filtered.map(s => (
            <button
              key={s.number}
              onClick={() => { onAdd({ surahNumber: s.number, surahNameEn: s.nameEn, surahNameAr: s.nameAr }); onClose() }}
              className={cn(
                'flex items-center w-full py-[11px] border-b border-gray-100 gap-3',
              )}
            >
              <span className="text-[12px] text-gray-400 w-7 text-center flex-shrink-0">
                {s.number}
              </span>
              <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
                <div className="text-[14px] text-gray-900">
                  {lang === 'ar' ? s.nameAr : s.nameEn}
                </div>
                {lang === 'en' && (
                  <div className="text-[11px] text-gray-400">{s.nameAr}</div>
                )}
              </div>
              <span className="text-emerald-500 text-[18px]">+</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-[13px] py-8">No surahs found</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── NAME EDIT SHEET ──────────────────────────────────────

function EditNameSheet({
  current,
  dir,
  t,
  onSave,
  onClose,
}: {
  current: string
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [val, setVal] = useState(current)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[20px] p-6 pb-8"
        onClick={e => e.stopPropagation()}
        dir={dir}
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-[4px] rounded-full bg-gray-200"/>
        </div>
        <p className="text-[16px] font-semibold text-gray-900 mb-4">{t.editName}</p>
        <input
          type="text"
          value={val}
          onChange={e => setVal(e.target.value)}
          dir={dir}
          className="w-full h-[48px] rounded-[12px] border border-gray-200 bg-gray-50 px-4 text-[15px] focus:outline-none focus:border-emerald-400 mb-4"
          autoFocus
        />
        <button
          onClick={() => { if (val.trim()) { onSave(val.trim()); onClose() } }}
          className="w-full py-[14px] rounded-[12px] bg-emerald-600 text-white text-[15px] font-semibold"
        >
          {t.qadaSave}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN SETTINGS COMPONENT ──────────────────────────────

export default function Settings({
  user: initialUser,
  userActivities: initialActivities,
  userSurahs: initialSurahs,
  qadaRecords: initialQada,
  userAzkars: initialAzkars = [],
}: SettingsProps) {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  // ── State
  const [user, setUser]             = useState(initialUser)
  const [activities, setActivities] = useState(initialActivities)
  const [surahs, setSurahs]         = useState(initialSurahs)
  const [userAzkars, setUserAzkars] = useState<UserAzkarItem[]>(initialAzkars)
  const [azkarDefs,  setAzkarDefs]  = useState<AzkarDefItem[]>([])
  const [showAzkarPicker, setShowAzkarPicker] = useState(false)
  const [showAzkarForm,   setShowAzkarForm]   = useState(false)
  const [azkarFormText,   setAzkarFormText]   = useState('')
  const [azkarFormTrans,  setAzkarFormTrans]  = useState('')
  const [azkarFormReps,   setAzkarFormReps]   = useState(1)
  const [savingAzkar,     setSavingAzkar]     = useState(false)
  const [qadaRecords, setQadaRecords] = useState(initialQada)

  // ── UI state
  const [showSurahPicker, setShowSurahPicker] = useState(false)
  const [showEditName, setShowEditName]       = useState(false)
  const [qadaSaveStatus, setQadaSaveStatus]   = useState<Record<number, 'idle' | 'saving' | 'saved'>>({})

  // Qada input state per year
  const hijri = toHijri(new Date())
  const [qadaInputs, setQadaInputs] = useState<Record<number, number>>(
    Object.fromEntries(initialQada.map(r => [r.ramadanYear, r.totalOwed]))
  )
  // Ensure current year exists
  if (!qadaInputs[hijri.year]) qadaInputs[hijri.year] = 0

  // ── Save helpers
  const patchUser = useCallback(async (data: object) => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }, [])

  const toggleActivity = useCallback(async (id: string, current: boolean) => {
    const next = activities.map(a =>
      a.id === id ? { ...a, isEnabled: !current } : a
    )
    setActivities(next)
    await fetch('/api/settings/activities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates: [{ id, isEnabled: !current }] }),
    })
  }, [activities])

  const addAzkarFromDef = async (def: AzkarDefItem) => {
    if (userAzkars.length >= 20) return
    const res = await fetch('/api/azkar/user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ azkarDefinitionId: def.id, textAr: def.textAr, translationEn: def.translationEn, translationAr: def.translationAr, repetitions: def.repetitions }),
    })
    const data = await res.json()
    if (res.ok) setUserAzkars(prev => [...prev, data.azkar])
  }

  const addAzkarCustom = async () => {
    if (!azkarFormText.trim() || savingAzkar) return
    setSavingAzkar(true)
    const res = await fetch('/api/azkar/user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textAr: azkarFormText.trim(), translationEn: azkarFormTrans.trim() || null, repetitions: azkarFormReps }),
    })
    const data = await res.json()
    if (res.ok) { setUserAzkars(prev => [...prev, data.azkar]); setAzkarFormText(''); setAzkarFormTrans(''); setAzkarFormReps(1); setShowAzkarForm(false) }
    setSavingAzkar(false)
  }

  const removeUserAzkar = async (id: string) => {
    setUserAzkars(prev => prev.filter(a => a.id !== id))
    await fetch('/api/azkar/user?id=' + id, { method: 'DELETE' })
  }

  const loadAzkarDefs = async () => {
    if (azkarDefs.length > 0) return
    const res = await fetch('/api/azkar?category=CUSTOM')
    const data = await res.json()
    setAzkarDefs(data.azkar ?? [])
  }

    const addSurah = useCallback(async (s: { surahNumber: number; surahNameEn: string; surahNameAr: string }) => {
    const res = await fetch('/api/settings/surahs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    if (res.ok) {
      const data = await res.json()
      setSurahs(prev => [...prev, data.surah])
    }
  }, [])

  const removeSurah = useCallback(async (id: string) => {
    setSurahs(prev => prev.filter(s => s.id !== id))
    await fetch(`/api/settings/surahs?id=${id}`, { method: 'DELETE' })
  }, [])

  const saveName = useCallback(async (name: string) => {
    setUser(u => ({ ...u, name }))
    await patchUser({ name })
  }, [patchUser])

  const saveQada = useCallback(async (year: number) => {
    setQadaSaveStatus(s => ({ ...s, [year]: 'saving' }))
    const res = await fetch('/api/settings/qada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ramadanYear: year, totalOwed: qadaInputs[year] }),
    })
    const data = await res.json()
    if (res.ok) {
      setQadaRecords(prev => {
        const exists = prev.find(r => r.ramadanYear === year)
        if (exists) return prev.map(r => r.ramadanYear === year ? data.record : r)
        return [...prev, data.record]
      })
      setQadaSaveStatus(s => ({ ...s, [year]: 'saved' }))
      setTimeout(() => setQadaSaveStatus(s => ({ ...s, [year]: 'idle' })), 2000)
    }
  }, [qadaInputs])

  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false)
  const [showChangePassword,  setShowChangePassword]  = useState(false)
  const [changePwCurrent,     setChangePwCurrent]     = useState('')
  const [changePwNew,         setChangePwNew]         = useState('')
  const [changePwError,       setChangePwError]       = useState('')
  const [changePwStatus,      setChangePwStatus]      = useState<'idle'|'loading'|'done'>('idle')
  const [deletePassword,      setDeletePassword]      = useState('')
  const [deleteError,         setDeleteError]         = useState('')
  const [deletingAccount,     setDeletingAccount]     = useState(false)

  const logout = useCallback(async () => {
    await fetch('/api/auth/me', { method: 'POST' })
    router.push('/welcome')
    router.refresh()
  }, [router])

  const changePassword = async () => {
    if (!changePwCurrent || !changePwNew) { setChangePwError(lang === 'ar' ? 'أدخل كلا كلمتي المرور' : 'Enter both passwords'); return }
    if (changePwNew.length < 8) { setChangePwError(lang === 'ar' ? '٨ أحرف على الأقل' : 'At least 8 characters'); return }
    setChangePwStatus('loading')
    const res  = await fetch('/api/auth/change-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword: changePwCurrent, newPassword: changePwNew }),
    })
    const data = await res.json()
    if (res.ok) {
      setChangePwStatus('done')
      setTimeout(() => { setShowChangePassword(false); setChangePwStatus('idle'); setChangePwCurrent(''); setChangePwNew('') }, 1500)
    } else {
      setChangePwError(data.error ?? (lang === 'ar' ? 'فشل التغيير' : 'Failed to change'))
      setChangePwStatus('idle')
    }
  }

  const deleteAccount = async () => {
    setDeletingAccount(true)
    const res = await fetch('/api/auth/account', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password: deletePassword }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/welcome')
      router.refresh()
    } else {
      setDeleteError(data.error ?? (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'))
      setDeletingAccount(false)
    }
  }

  // ── Group activities by category
  const byCategory = activities.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {} as Record<string, Activity[]>)

  const catOrder = ['SALAH', 'DHIKR', 'QURAN', 'FASTING', 'SADAQAH']
  const catLabel: Record<string, string> = {
    SALAH:   t.catSalah,
    DHIKR:   t.catDhikr,
    QURAN:   t.catQuran,
    FASTING: t.catFasting,
    SADAQAH: t.catSadaqah,
  }

  const existingSurahNumbers = new Set(surahs.map(s => s.surahNumber))

  // ── Qada years to show — current year always + any existing records
  const qadaYears = Array.from(new Set([
    hijri.year,
    ...qadaRecords.map(r => r.ramadanYear),
  ])).sort((a, b) => b - a)

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-8">

      {/* ── TOP BAR */}
      <div className={cn(
        'flex items-center justify-between px-4 pt-4 pb-2',
      )}>
        <div className={cn('flex items-center gap-2')}>
          <button
            onClick={() => router.push('/today')}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors text-gray-500',
            )}
            aria-label="Back to Today"
          >
            {dir === 'rtl' ? '›' : '‹'}
          </button>
          <h1 className="text-[20px] font-semibold text-gray-900">{t.title}</h1>
        </div>
        <LangToggle className="!bg-gray-100 [&_button]:!text-gray-600" />
      </div>

      {/* ══════ 1. PROFILE ══════ */}
      <SectionHeader title={t.sProfile} dir={dir}/>
      <SettingsGroup>
        <div className={cn(
          'flex items-center gap-4 px-[14px] py-[14px] border-b border-gray-100',
        )}>
          <Avatar name={user.name} size={48}/>
          <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
            <p className="text-[15px] font-medium text-gray-900">{user.name}</p>
            <p className="text-[12px] text-gray-400">{user.email}</p>
          </div>
          <Badge label={user.isPremium ? t.premium : t.free} color={user.isPremium ? 'gold' : 'gray'}/>
        </div>
        <SettingsRow
          icon="✏️"
          label={t.editName}
          dir={dir}
          onPress={() => setShowEditName(true)}
        />
        {/* Gender selector */}
        <div className={cn('px-[14px] py-[12px] border-b border-gray-100', dir === 'rtl' && 'text-right')}>
          <div className={cn('flex items-center justify-between mb-[8px]')}>
            <span className="text-[13px] font-medium text-gray-900">⚧ {(t as any).gender}</span>
          </div>
          <p className="text-[11px] text-gray-400 mb-[8px]">{(t as any).genderHint}</p>
          <div className={cn('flex gap-2')}>
            {(['male', 'female'] as const).map(g => (
              <button
                key={g}
                onClick={async () => {
                  const newGender = user.gender === g ? null : g
                  setUser({ ...user, gender: newGender } as any)
                  await patchUser({ gender: newGender })
                  // Force server components (Today page) to re-render with new gender
                  router.refresh()
                }}
                className={cn(
                  'flex-1 py-[6px] rounded-[8px] text-[12px] font-medium border transition-colors',
                  user.gender === g
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                )}
              >
                {g === 'male' ? (t as any).genderMale : (t as any).genderFemale}
              </button>
            ))}
          </div>
        </div>
        {!user.isPremium && (
          <SettingsRow
            icon="⭐"
            label={t.upgradePremium}
            dir={dir}
            isLast
            onPress={() => router.push('/premium')}
            right={<Badge label="Premium" color="gold"/>}
          />
        )}
        {user.isPremium && <div/>}
      </SettingsGroup>

      {/* ══════ 2. MY ACTIVITIES ══════ */}
      <SectionHeader title={t.sActivities} dir={dir}/>
      <p className={cn(
        'mx-4 mb-2 text-[12px] text-gray-400',
        dir === 'rtl' && 'text-right'
      )}>{t.activitiesHint}</p>

      {catOrder.map(cat => {
        const acts = byCategory[cat]
        if (!acts || acts.length === 0) return null
        return (
          <div key={cat} className="mb-3">
            <p className={cn(
              'mx-4 mb-1 text-[11px] font-semibold text-gray-400',
              dir === 'rtl' ? 'text-right' : ''
            )}>
              {CAT_ICON[cat]} {catLabel[cat]}
            </p>
            <SettingsGroup>
              {acts.map((a, i) => (
                <SettingsRow
                  key={a.id}
                  label={lang === 'ar' ? a.nameAr : a.nameEn}
                  sublabel={!a.canDisable ? (lang === 'ar' ? 'مطلوب دائماً' : 'Always required') : undefined}
                  dir={dir}
                  isLast={i === acts.length - 1}
                  right={
                    a.canDisable ? (
                      <Toggle
                        value={a.isEnabled}
                        onChange={() => toggleActivity(a.id, a.isEnabled)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-[2px] rounded-full">
                          {lang === 'ar' ? 'ثابت' : 'Fixed'}
                        </span>
                        <Toggle value={true} onChange={() => {}} disabled={true}/>
                      </div>
                    )
                  }
                />
              ))}
            </SettingsGroup>
          </div>
        )
      })}

      {/* ══════ 3. DAILY SURAHS ══════ */}
      <SectionHeader title={t.sSurahs} dir={dir}/>
      <p className={cn(
        'mx-4 mb-2 text-[12px] text-gray-400',
        dir === 'rtl' && 'text-right'
      )}>{t.surahsHint}</p>
      <SettingsGroup>
        {surahs.map((s, i) => (
          <SettingsRow
            key={s.id}
            label={lang === 'ar' ? s.surahNameAr : s.surahNameEn}
            sublabel={lang === 'ar' ? s.surahNameEn : s.surahNameAr}
            dir={dir}
            isLast={i === surahs.length - 1 && surahs.length >= 10}
            right={
              <button
                onClick={() => removeSurah(s.id)}
                className="text-[12px] text-red-400 border border-red-100 rounded-[7px] px-2 py-1"
              >
                {t.removeSurah}
              </button>
            }
          />
        ))}
        {surahs.length < 10 ? (
          <SettingsRow
            icon="➕"
            label={t.addSurah}
            dir={dir}
            isLast
            onPress={() => setShowSurahPicker(true)}
          />
        ) : (
          <div className={cn(
            'px-[14px] py-[10px] text-[12px] text-amber-600',
            dir === 'rtl' && 'text-right'
          )}>
            {t.surahMax}
          </div>
        )}
      </SettingsGroup>

      {/* ══════ MY AZKAR ══════ */}
      <SectionHeader title={(t as any).sAzkar} dir={dir}/>
      <p className={cn('mx-4 mb-2 text-[12px] text-gray-400', dir === 'rtl' && 'text-right')}>{(t as any).azkarHint}</p>
      <SettingsGroup>
        {userAzkars.map((a, i) => (
          <SettingsRow key={a.id}
            label={a.textAr}
            sublabel={(lang === 'en' ? a.translationEn : null) ?? undefined}
            dir={dir}
            isLast={i === userAzkars.length - 1 && userAzkars.length >= 20}
            right={
              <button onClick={() => removeUserAzkar(a.id)}
                className="text-[12px] text-red-400 border border-red-100 rounded-[7px] px-2 py-1">
                {(t as any).removeAzkar}
              </button>
            }
          />
        ))}
        {userAzkars.length < 20 ? (
          <>
            <SettingsRow icon="📿" label={(t as any).browseAzkar} dir={dir}
              onPress={async () => { await loadAzkarDefs(); setShowAzkarPicker(true) }}/>
            <SettingsRow icon="✏️" label={(t as any).addCustom} dir={dir} isLast
              onPress={() => setShowAzkarForm(true)}/>
          </>
        ) : (
          <div className={cn('px-[14px] py-[10px] text-[12px] text-amber-600', dir === 'rtl' && 'text-right')}>
            {(t as any).azkarMax}
          </div>
        )}
        {userAzkars.length === 0 && (
          <div className={cn('px-[14px] py-[10px] text-[12px] text-gray-400', dir === 'rtl' && 'text-right')}>
            {(t as any).noAzkar}
          </div>
        )}
      </SettingsGroup>

      {/* ══════ 4. QADA' ══════ */}
      <SectionHeader title={t.sQada} dir={dir}/>
      <p className={cn(
        'mx-4 mb-2 text-[12px] text-gray-400',
        dir === 'rtl' && 'text-right'
      )}>{t.qadaHint}</p>
      <SettingsGroup>
        {qadaYears.map((year, i) => {
          const record = qadaRecords.find(r => r.ramadanYear === year)
          const compensated = record?.totalCompensated ?? 0
          const status = qadaSaveStatus[year] ?? 'idle'

          return (
            <div
              key={year}
              className={cn(
                'px-[14px] py-[12px] flex items-center gap-3',
                i < qadaYears.length - 1 && 'border-b border-gray-100',
              )}
            >
              <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
                <p className="text-[13px] font-medium text-gray-900">
                  {t.qadaYear}: {year}
                </p>
                {compensated > 0 && (
                  <p className="text-[11px] text-emerald-600 mt-[1px]">
                    {compensated} {lang === 'ar' ? 'أيام منجزة' : 'compensated'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={qadaInputs[year] ?? 0}
                  onChange={e => setQadaInputs(p => ({ ...p, [year]: Math.min(30, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  className="w-[52px] h-[34px] rounded-[8px] border border-gray-200 bg-gray-50 text-center text-[14px] font-medium focus:outline-none focus:border-emerald-400"
                />
                <button
                  onClick={() => saveQada(year)}
                  disabled={status === 'saving'}
                  className={cn(
                    'px-3 py-[7px] rounded-[8px] text-[12px] font-medium transition-all',
                    status === 'saved'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-emerald-600 text-white active:opacity-80'
                  )}
                >
                  {status === 'saved' ? t.qadaSaved : t.qadaSave}
                </button>
              </div>
            </div>
          )
        })}
      </SettingsGroup>

      {/* ══════ 5. REMINDERS ══════ */}
      <SectionHeader title={t.sReminders} dir={dir}/>
      <SettingsGroup>
        <SettingsRow
          icon="🔔"
          label={t.remindersOn}
          sublabel={t.remindersHint}
          dir={dir}
          right={
            <Toggle
              value={user.remindersEnabled}
              onChange={async v => {
                setUser(u => ({ ...u, remindersEnabled: v }))
                await patchUser({ remindersEnabled: v })
              }}
            />
          }
        />
        <SettingsRow
          icon="📧"
          label={t.emailReminders}
          dir={dir}
          isLast
          right={
            <Toggle
              value={user.emailReminders}
              disabled={!user.remindersEnabled}
              onChange={async v => {
                setUser(u => ({ ...u, emailReminders: v }))
                await patchUser({ emailReminders: v })
              }}
            />
          }
        />
      </SettingsGroup>

      {/* Admin panel is always visible in the left sidebar on desktop */}

      {/* ══════ ACCOUNT */}
      <SectionHeader title={t.sAccount} dir={dir}/>
      <SettingsGroup>
        <SettingsRow
          icon="🕌"
          label={lang === 'ar' ? 'مواقيت الصلاة والتنبيهات' : 'Prayer Times & Notifications'}
          dir={dir}
          onPress={() => router.push('/prayer-times')}
        />
        <SettingsRow
          icon="🎨"
          label={lang === 'ar' ? 'الثيمات' : 'Themes'}
          dir={dir}
          onPress={() => router.push('/themes')}
        />
        <SettingsRow
          icon="🎁"
          label={lang === 'ar' ? 'الإحالات والنقاط' : 'Referrals & Points'}
          sublabel={lang === 'ar' ? 'ادعُ أصدقاءك واكسب نقاطاً' : 'Invite friends & earn points'}
          dir={dir}
          onPress={() => router.push('/referral')}
        />
        <SettingsRow
          icon="💬"
          label={t.support}
          sublabel={t.supportSub}
          dir={dir}
          onPress={() => router.push('/support')}
        />
        <SettingsRow
          icon="🔑"
          label={lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
          dir={dir}
          onPress={() => setShowChangePassword(true)}
        />
        <SettingsRow
          icon="🚪"
          label={t.logout}
          dir={dir}
          onPress={logout}
        />
        <SettingsRow
          icon="🗑️"
          label={t.deleteAccount}
          dir={dir}
          isLast
          danger
          onPress={() => setShowDeleteConfirm(true)}
        />
      </SettingsGroup>

      {/* App version */}
      <p className={cn('text-center text-[11px] text-gray-300 mt-6', dir === 'rtl' && 'text-center')}>
        Yawmiyyati v1.0
      </p>
      <div className="flex justify-center gap-4 mt-2 pb-2">
        <a href="/privacy" className="text-[11px] text-gray-300 underline underline-offset-2">
          {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </a>
        <a href="/terms" className="text-[11px] text-gray-300 underline underline-offset-2">
          {lang === 'ar' ? 'شروط الاستخدام' : 'Terms of Service'}
        </a>
      </div>

      {/* ── Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowChangePassword(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[20px] p-6 pb-8" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4"><div className="w-10 h-[4px] rounded-full bg-gray-200"/></div>
            <p className="text-[17px] font-semibold text-gray-900 mb-4">
              {lang === 'ar' ? '🔑 تغيير كلمة المرور' : '🔑 Change Password'}
            </p>
            <div className="flex flex-col gap-3">
              <input type="password" value={changePwCurrent} onChange={e => { setChangePwCurrent(e.target.value); setChangePwError('') }}
                placeholder={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current password'} dir="ltr"
                className="h-[44px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none focus:border-emerald-400"/>
              <input type="password" value={changePwNew} onChange={e => { setChangePwNew(e.target.value); setChangePwError('') }}
                placeholder={lang === 'ar' ? 'كلمة المرور الجديدة (٨ أحرف+)' : 'New password (8+ chars)'} dir="ltr"
                className="h-[44px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none focus:border-emerald-400"/>
            </div>
            {changePwError && <p className="text-[12px] text-red-500 mt-2">{changePwError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowChangePassword(false)} className="flex-1 py-[12px] rounded-[12px] border border-gray-200 text-[14px] text-gray-500">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={changePassword} disabled={changePwStatus !== 'idle'}
                className={cn('flex-1 py-[12px] rounded-[12px] text-[14px] font-semibold transition-all',
                  changePwStatus === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white disabled:opacity-50')}>
                {changePwStatus === 'idle' ? (lang === 'ar' ? 'تغيير' : 'Change')
                 : changePwStatus === 'loading' ? '...'
                 : '✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[20px] p-6 pb-8"
            dir={dir}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-[4px] rounded-full bg-gray-200"/>
            </div>
            <p className="text-[17px] font-bold text-red-600 mb-2">
              {lang === 'ar' ? '⚠️ حذف الحساب' : '⚠️ Delete Account'}
            </p>
            <p className={cn('text-[13px] text-gray-500 mb-4', dir === 'rtl' && 'text-right')}>
              {lang === 'ar'
                ? 'سيتم حذف جميع بياناتك نهائياً ولا يمكن التراجع عن هذا. أدخل كلمة مرورك للتأكيد.'
                : 'All your data will be permanently deleted and cannot be undone. Enter your password to confirm.'}
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              placeholder={lang === 'ar' ? 'كلمة المرور' : 'Your password'}
              dir="ltr"
              className="w-full h-[44px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] mb-2 focus:outline-none focus:border-red-400"
            />
            {deleteError && <p className="text-[12px] text-red-500 mb-3">{deleteError}</p>}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError('') }}
                className="flex-1 py-[12px] rounded-[12px] border border-gray-200 text-[14px] text-gray-500"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={deleteAccount}
                disabled={deletingAccount}
                className="flex-1 py-[12px] rounded-[12px] bg-red-600 text-white text-[14px] font-semibold disabled:opacity-50"
              >
                {deletingAccount ? '...' : (lang === 'ar' ? 'حذف الحساب' : 'Delete Account')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals */}
      {showSurahPicker && (
        <SurahPicker
          existingNumbers={existingSurahNumbers}
          lang={lang}
          dir={dir}
          t={t}
          onAdd={addSurah}
          onClose={() => setShowSurahPicker(false)}
        />
      )}
      {showEditName && (
        <EditNameSheet
          current={user.name}
          dir={dir}
          t={t}
          onSave={saveName}
          onClose={() => setShowEditName(false)}
        />
      )}
    </div>
  )
}
