'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const T = {
  en: {
    title:        'Promo Codes',
    newCode:      'Create New Code',
    codeLabel:    'Code',
    codePh:       'e.g. RAMADAN2025',
    type:         'Type',
    types: {
      FREE_PREMIUM: '🎁 Free Premium',
      DISCOUNT:     '💰 Discount %',
      TRIAL:        '⏱ Trial Period',
      THEME_UNLOCK: '🎨 Unlock Theme',
    },
    days:         'Premium days (0 = lifetime)',
    discount:     'Discount %',
    themeKey:     'Theme key (from DB)',
    themeKeyPh:   'e.g. sakura-spring',
    labelEn:      'Label (English)',
    labelAr:      'Label (Arabic)',
    labelEnPh:    'e.g. Ramadan Gift',
    labelArPh:    'مثال: هدية رمضان',
    desc:         'Admin note',
    descPh:       'Internal note. Not shown to users.',
    maxUses:      'Max uses (0 = unlimited)',
    expires:      'Expires (leave blank = never)',
    create:       'Create Code',
    creating:     'Creating...',
    created:      'Created ✓',
    // List
    active:       'Active',
    inactive:     'Inactive',
    used:         'used',
    of:           'of',
    unlimited:    'unlimited',
    never:        'Never',
    lifetime:     'Lifetime',
    deactivate:   'Deactivate',
    activate:     'Activate',
    delete:       'Delete',
    usages:       'Recent uses',
    noUsages:     'Not used yet',
    // Grant
    grantTitle:   'Grant Premium Directly',
    grantEmail:   'User email',
    grantDays:    'Days (0 = lifetime)',
    grantReason:  'Reason (optional)',
    grant:        'Grant Premium',
    revoke:       'Revoke Premium',
    granting:     'Processing...',
    grantOk:      'Done ✓',
    loading:      'Loading...',
    noCodes:      'No promo codes yet.',
    copyCode:     'Copy',
    copied:       'Copied!',
  },
  ar: {
    title:        'أكواد الترقية',
    newCode:      'إنشاء كود جديد',
    codeLabel:    'الكود',
    codePh:       'مثال: RAMADAN2025',
    type:         'النوع',
    types: {
      FREE_PREMIUM: '🎁 بريميوم مجاني',
      DISCOUNT:     '💰 خصم %',
      TRIAL:        '⏱ فترة تجريبية',
      THEME_UNLOCK: '🎨 فتح ثيم',
    },
    days:         'أيام البريميوم (٠ = مدى الحياة)',
    discount:     'نسبة الخصم %',
    themeKey:     'مفتاح الثيم (من قاعدة البيانات)',
    themeKeyPh:   'مثال: sakura-spring',
    labelEn:      'التسمية (إنجليزي)',
    labelAr:      'التسمية (عربي)',
    labelEnPh:    'e.g. Ramadan Gift',
    labelArPh:    'مثال: هدية رمضان',
    desc:         'ملاحظة إدارية',
    descPh:       'ملاحظة داخلية. لا تظهر للمستخدمين.',
    maxUses:      'الحد الأقصى للاستخدام (٠ = غير محدود)',
    expires:      'تاريخ الانتهاء (فارغ = لا ينتهي)',
    create:       'إنشاء الكود',
    creating:     'جارٍ الإنشاء...',
    created:      'تم الإنشاء ✓',
    active:       'فعّال',
    inactive:     'غير فعّال',
    used:         'استُخدم',
    of:           'من',
    unlimited:    'غير محدود',
    never:        'لا ينتهي',
    lifetime:     'مدى الحياة',
    deactivate:   'إلغاء التفعيل',
    activate:     'تفعيل',
    delete:       'حذف',
    usages:       'آخر الاستخدامات',
    noUsages:     'لم يُستخدم بعد',
    grantTitle:   'منح بريميوم مباشرة',
    grantEmail:   'البريد الإلكتروني للمستخدم',
    grantDays:    'الأيام (٠ = مدى الحياة)',
    grantReason:  'السبب (اختياري)',
    grant:        'منح بريميوم',
    revoke:       'إلغاء بريميوم',
    granting:     'جارٍ المعالجة...',
    grantOk:      'تم ✓',
    loading:      'جارٍ التحميل...',
    noCodes:      'لا توجد أكواد بعد.',
    copyCode:     'نسخ',
    copied:       'تم النسخ!',
  },
}

// ─── CODE CARD ────────────────────────────────────────────

function CodeCard({
  code,
  lang,
  dir,
  t,
  onToggle,
  onDelete,
}: {
  code: any
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const usedOf = code.maxUses === 0
    ? `${code.usedCount} ${t.used} (${t.unlimited})`
    : `${code.usedCount} ${t.of} ${code.maxUses} ${t.used}`

  const copy = () => {
    navigator.clipboard.writeText(code.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const typeColors: Record<string, string> = {
    FREE_PREMIUM: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    DISCOUNT:     'bg-amber-50 text-amber-700 border-amber-200',
    TRIAL:        'bg-blue-50 text-blue-700 border-blue-200',
    THEME_UNLOCK: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  return (
    <div className={cn(
      'bg-white border rounded-[12px] p-4 mb-3',
      code.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
    )}>
      {/* Row 1 — code + type */}
      <div className={cn('flex items-start justify-between mb-2', dir === 'rtl' && 'flex-row-reverse')}>
        <div className={cn('flex items-center gap-2', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[16px] font-bold text-gray-900 font-mono tracking-wide">
            {code.code}
          </span>
          <button onClick={copy} className="text-[10px] text-gray-400 border border-gray-200 rounded px-2 py-[2px]">
            {copied ? t.copied : t.copyCode}
          </button>
        </div>
        <span className={cn('text-[10px] font-semibold border rounded-full px-2 py-[3px]', typeColors[code.type])}>
          {t.types[code.type as keyof typeof t.types]}
        </span>
      </div>

      {/* Row 2 — details */}
      <div className={cn('flex flex-wrap gap-x-4 gap-y-1 mb-2 text-[11px] text-gray-500', dir === 'rtl' && 'flex-row-reverse')}>
        <span>
          {code.type === 'FREE_PREMIUM' || code.type === 'TRIAL'
            ? code.premiumDays === 0 ? t.lifetime : `${code.premiumDays}d premium`
            : code.type === 'THEME_UNLOCK'
            ? `🎨 ${code.themeKey ?? 'N/A'}`
            : `${code.discountPct}% off`}
        </span>
        <span>{usedOf}</span>
        <span>
          {code.expiresAt
            ? new Date(code.expiresAt).toLocaleDateString()
            : t.never}
        </span>
        {code.description && <span className="text-gray-400 italic">{code.description}</span>}
      </div>

      {/* Row 3 — recent usages */}
      {code.usages?.length > 0 && (
        <div className="mb-3">
          <p className={cn('text-[10px] font-semibold text-gray-400 mb-1', dir === 'rtl' && 'text-right')}>{t.usages}</p>
          {code.usages.slice(0, 3).map((u: any) => (
            <div key={u.id} className={cn('flex items-center gap-2 text-[11px] text-gray-500', dir === 'rtl' && 'flex-row-reverse')}>
              <span className="text-emerald-500">✓</span>
              <span>{u.user.name}</span>
              <span className="text-gray-300">·</span>
              <span>{u.user.email}</span>
              <span className="text-gray-300">·</span>
              <span>{new Date(u.redeemedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={cn('flex gap-2', dir === 'rtl' && 'flex-row-reverse')}>
        <button
          onClick={() => onToggle(code.id, !code.isActive)}
          className={cn(
            'text-[11px] border rounded-full px-3 py-[4px] font-medium',
            code.isActive
              ? 'text-amber-600 border-amber-200'
              : 'text-emerald-600 border-emerald-200'
          )}
        >
          {code.isActive ? t.deactivate : t.activate}
        </button>
        <button
          onClick={() => onDelete(code.id)}
          className="text-[11px] text-red-400 border border-red-100 rounded-full px-3 py-[4px]"
        >
          {t.delete}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN SCREEN ──────────────────────────────────────────

export default function AdminPromo() {
  const { lang, dir } = useLang()
  const t = T[lang]

  const [codes,    setCodes]    = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  // Create form
  const [form, setForm] = useState({
    code: '', type: 'FREE_PREMIUM', premiumDays: '30', discountPct: '0', themeKey: '',
    labelEn: '', labelAr: '', description: '', maxUses: '1', expiresAt: '',
  })
  const [createStatus, setCreateStatus] = useState<'idle' | 'creating' | 'created'>('idle')

  // Grant form
  const [grant, setGrant] = useState({ email: '', days: '30', reason: '', action: 'grant' })
  const [grantStatus, setGrantStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [grantResult, setGrantResult] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/promo')
    const data = await res.json()
    setCodes(data.codes ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createCode = async () => {
    setCreateStatus('creating')
    const res = await fetch('/api/admin/promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setCreateStatus('created')
      setForm({ code: '', type: 'FREE_PREMIUM', premiumDays: '30', discountPct: '0', themeKey: '', labelEn: '', labelAr: '', description: '', maxUses: '1', expiresAt: '' })
      await load()
      setTimeout(() => setCreateStatus('idle'), 2000)
    } else {
      setCreateStatus('idle')
    }
  }

  const toggleCode = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, isActive } : c))
  }

  const deleteCode = async (id: string) => {
    await fetch(`/api/admin/promo?id=${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  const grantPremium = async () => {
    setGrantStatus('loading')
    const res = await fetch('/api/admin/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:     grant.email,
        isPremium: grant.action === 'grant',
        days:      grant.action === 'grant' ? parseInt(grant.days) : undefined,
        reason:    grant.reason || undefined,
      }),
    })
    const data = await res.json()
    setGrantResult(data.action ?? data.error ?? 'Done')
    setGrantStatus('done')
    setTimeout(() => { setGrantStatus('idle'); setGrantResult('') }, 3000)
  }

  const inp = 'w-full h-[38px] rounded-[8px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400'
  const lbl = cn('text-[10px] font-semibold text-gray-500 mb-1', dir === 'rtl' && 'text-right')

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* TOP BAR */}
      <div className={cn('px-4 pt-5 pb-3', dir === 'rtl' && 'text-right')}>
        <h1 className="text-[20px] font-bold text-gray-900">{t.title}</h1>
      </div>

      {/* ══ GRANT PREMIUM DIRECTLY ══ */}
      <div className="mx-4 mb-5 bg-white border border-gray-200 rounded-[14px] p-4">
        <p className={cn('text-[13px] font-semibold text-gray-900 mb-3', dir === 'rtl' && 'text-right')}>
          {t.grantTitle}
        </p>
        <div className="flex flex-col gap-2">
          <div>
            <p className={lbl}>{t.grantEmail}</p>
            <input value={grant.email} onChange={e => setGrant(g => ({ ...g, email: e.target.value }))}
              placeholder="user@email.com" dir="ltr" className={inp}/>
          </div>
          {/* Grant / Revoke toggle */}
          <div className="flex gap-2">
            {(['grant', 'revoke'] as const).map(a => (
              <button key={a} onClick={() => setGrant(g => ({ ...g, action: a }))}
                className={cn('flex-1 py-[7px] rounded-[8px] text-[12px] font-semibold border transition-all',
                  grant.action === a
                    ? a === 'grant' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-500 text-white border-red-500'
                    : 'bg-white text-gray-500 border-gray-200'
                )}>
                {a === 'grant' ? t.grant : t.revoke}
              </button>
            ))}
          </div>
          {grant.action === 'grant' && (
            <div>
              <p className={lbl}>{t.grantDays}</p>
              <input type="number" value={grant.days} onChange={e => setGrant(g => ({ ...g, days: e.target.value }))}
                min="0" className={cn(inp, 'w-1/2')}/>
            </div>
          )}
          <div>
            <p className={lbl}>{t.grantReason}</p>
            <input value={grant.reason} onChange={e => setGrant(g => ({ ...g, reason: e.target.value }))}
              placeholder={t.descPh} dir={dir} className={inp}/>
          </div>
          <button onClick={grantPremium} disabled={!grant.email || grantStatus !== 'idle'}
            className={cn('w-full py-[10px] rounded-[10px] text-[13px] font-semibold transition-all',
              grantStatus === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-800 text-white disabled:opacity-40')}>
            {grantStatus === 'idle'    ? (grant.action === 'grant' ? t.grant : t.revoke)
             : grantStatus === 'loading' ? t.granting
             : grantResult || t.grantOk}
          </button>
        </div>
      </div>

      {/* ══ CREATE CODE FORM ══ */}
      <div className="mx-4 mb-5 bg-white border border-gray-200 rounded-[14px] p-4">
        <p className={cn('text-[13px] font-semibold text-gray-900 mb-3', dir === 'rtl' && 'text-right')}>{t.newCode}</p>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className={lbl}>{t.codeLabel}</p>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder={t.codePh} dir="ltr" className={inp}/>
            </div>
            <div>
              <p className={lbl}>{t.type}</p>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                {Object.entries(t.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {form.type === 'THEME_UNLOCK' ? (
              <div>
                <p className={lbl}>{t.themeKey}</p>
                <input value={form.themeKey} onChange={e => setForm(f => ({ ...f, themeKey: e.target.value.toLowerCase() }))}
                  placeholder={t.themeKeyPh} dir="ltr" className={inp}/>
              </div>
            ) : form.type !== 'DISCOUNT' ? (
              <div>
                <p className={lbl}>{t.days}</p>
                <input type="number" value={form.premiumDays} onChange={e => setForm(f => ({ ...f, premiumDays: e.target.value }))} min="0" className={inp}/>
              </div>
            ) : (
              <div>
                <p className={lbl}>{t.discount}</p>
                <input type="number" value={form.discountPct} onChange={e => setForm(f => ({ ...f, discountPct: e.target.value }))} min="1" max="100" className={inp}/>
              </div>
            )}
            <div>
              <p className={lbl}>{t.maxUses}</p>
              <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} min="0" className={inp}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className={lbl}>{t.labelEn}</p>
              <input value={form.labelEn} onChange={e => setForm(f => ({ ...f, labelEn: e.target.value }))} placeholder={t.labelEnPh} className={inp}/>
            </div>
            <div>
              <p className={lbl}>{t.labelAr}</p>
              <input value={form.labelAr} onChange={e => setForm(f => ({ ...f, labelAr: e.target.value }))} placeholder={t.labelArPh} dir="rtl" className={inp}/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className={lbl}>{t.expires}</p>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className={inp}/>
            </div>
            <div>
              <p className={lbl}>{t.desc}</p>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t.descPh} className={inp}/>
            </div>
          </div>
          <button onClick={createCode} disabled={!form.code || createStatus !== 'idle'}
            className={cn('w-full py-[11px] rounded-[10px] text-[13px] font-semibold transition-all mt-1',
              createStatus === 'created' ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white disabled:opacity-40')}>
            {createStatus === 'idle' ? t.create : createStatus === 'creating' ? t.creating : t.created}
          </button>
        </div>
      </div>

      {/* ══ CODE LIST ══ */}
      <div className="mx-4">
        {loading ? (
          [1,2].map(i => <div key={i} className="h-[100px] bg-gray-100 rounded-[12px] animate-pulse mb-3"/>)
        ) : codes.length === 0 ? (
          <p className={cn('text-[13px] text-gray-400 py-6 text-center', dir === 'rtl' && 'text-center')}>{t.noCodes}</p>
        ) : (
          codes.map(c => (
            <CodeCard key={c.id} code={c} lang={lang} dir={dir} t={t}
              onToggle={toggleCode} onDelete={deleteCode}/>
          ))
        )}
      </div>

    </div>
  )
}
