'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

type AzkarCategory = 'MORNING' | 'EVENING' | 'AFTER_SALAH' | 'AFTER_SALAH_FM' | 'CUSTOM'
type AzkarLang = 'EN' | 'AR'

interface AzkarDef {
  id: string
  category: AzkarCategory
  language: AzkarLang
  textAr: string
  transliteration: string | null
  translationEn: string | null
  translationAr: string | null
  repetitions: number
  sortOrder: number
  isActive: boolean
}

const CAT_LABELS: Record<AzkarCategory, { en: string; ar: string; icon: string }> = {
  MORNING:     { en: 'Morning Azkar',  ar: 'أذكار الصباح',     icon: '🌅' },
  EVENING:     { en: 'Evening Azkar',  ar: 'أذكار المساء',     icon: '🌆' },
  AFTER_SALAH:    { en: 'After Salah',  ar: 'بعد الصلاة',  icon: '🤲' },
  AFTER_SALAH_FM: { en: 'Fajr/Maghrib', ar: 'الفجر/المغرب', icon: '🌅' },
  CUSTOM:         { en: 'Custom / Other', ar: 'أذكار مخصصة',      icon: '📿' },
}

const CATS: AzkarCategory[] = ['MORNING', 'EVENING', 'AFTER_SALAH', 'AFTER_SALAH_FM', 'CUSTOM']

const LANGS: AzkarLang[] = ['AR', 'EN']
const LANG_LABELS: Record<AzkarLang, { en: string; ar: string }> = {
  AR: { en: 'Arabic',  ar: 'العربية' },
  EN: { en: 'English', ar: 'الإنجليزية' },
}

const EMPTY_FORM = { category: 'MORNING' as AzkarCategory, language: 'AR' as AzkarLang, textAr: '', transliteration: '', translationEn: '', translationAr: '', repetitions: 1 }

export default function AdminAzkar() {
  const { lang, dir } = useLang()
  const router = useRouter()

  const [azkar,      setAzkar]      = useState<AzkarDef[]>([])
  const [loading,    setLoading]    = useState(true)
  const [activeLang, setActiveLang] = useState<AzkarLang>('AR')
  const [activeTab,  setActiveTab]  = useState<AzkarCategory>('MORNING')
  const [showForm,   setShowForm]   = useState(false)
  const [editItem,   setEditItem]   = useState<AzkarDef | null>(null)
  const [form,       setForm]       = useState({ ...EMPTY_FORM })
  const [saving,     setSaving]     = useState(false)
  const [loadError,  setLoadError]  = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Drag-to-reorder state (works with mouse cursor and touch via Pointer Events)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dragRef = useRef<string | null>(null)
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    fetch('/api/admin/azkar')
      .then(r => { if (!r.ok) throw new Error('load failed'); return r.json() })
      .then(d => { setAzkar(d.azkar ?? []); setLoading(false) })
      .catch(() => { setLoadError(true); setLoading(false) })
  }, [])

  const showError = (msg: string) => {
    setActionError(msg)
    setTimeout(() => setActionError(null), 4000)
  }
  const FAIL_MSG = lang === 'ar' ? 'فشلت العملية، حاول مرة أخرى' : 'Action failed, please try again'

  const tabItems = azkar.filter(a => a.category === activeTab && a.language === activeLang).sort((a, b) => a.sortOrder - b.sortOrder)

  const openAdd = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, category: activeTab, language: activeLang })
    setShowForm(true)
  }

  const openEdit = (item: AzkarDef) => {
    setEditItem(item)
    setForm({
      category:      item.category,
      language:      item.language,
      textAr:        item.textAr,
      transliteration: item.transliteration ?? '',
      translationEn: item.translationEn ?? '',
      translationAr: item.translationAr ?? '',
      repetitions:   item.repetitions,
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.textAr.trim()) return
    setSaving(true)
    const body = {
      category:      form.category,
      language:      form.language,
      textAr:        form.textAr.trim(),
      transliteration: form.transliteration.trim() || null,
      translationEn: form.translationEn.trim() || null,
      translationAr: form.translationAr.trim() || null,
      repetitions:   form.repetitions,
    }

    try {
      if (editItem) {
        const res = await fetch('/api/admin/azkar', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editItem.id, ...body }),
        })
        const data = await res.json()
        if (!res.ok || !data.azkar) throw new Error(data.error ?? 'save failed')
        setAzkar(prev => prev.map(a => a.id === editItem.id ? data.azkar : a))
      } else {
        const res = await fetch('/api/admin/azkar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok || !data.azkar) throw new Error(data.error ?? 'save failed')
        setAzkar(prev => [...prev, data.azkar])
      }
      setShowForm(false)
    } catch (err) {
      const reason = err instanceof Error && err.message !== 'save failed' ? ` (${err.message})` : ''
      showError(FAIL_MSG + reason)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد الحذف؟' : 'Delete this azkar?')) return
    try {
      const res = await fetch(`/api/admin/azkar?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      setAzkar(prev => prev.filter(a => a.id !== id))
    } catch {
      showError(FAIL_MSG)
    }
  }

  const toggleActive = async (item: AzkarDef) => {
    try {
      const res = await fetch('/api/admin/azkar', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      })
      const data = await res.json()
      if (!res.ok || !data.azkar) throw new Error(data.error ?? 'toggle failed')
      setAzkar(prev => prev.map(a => a.id === item.id ? data.azkar : a))
    } catch {
      showError(FAIL_MSG)
    }
  }

  // Drag-to-reorder within the current tab+language group. Persists the new
  // order (debounced) to /api/admin/azkar/reorder, which writes sortOrder.
  const saveOrder = (ids: string[]) => {
    if (reorderTimer.current) clearTimeout(reorderTimer.current)
    reorderTimer.current = setTimeout(() => {
      fetch('/api/admin/azkar/reorder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: ids }),
      }).then(r => { if (!r.ok) throw new Error() }).catch(() => showError(FAIL_MSG))
    }, 500)
  }

  const onDragStart = (e: React.PointerEvent, id: string) => {
    dragRef.current = id
    setDragId(id)
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }

  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const row = el?.closest('[data-azkar-id]') as HTMLElement | null
    const oid = row?.getAttribute('data-azkar-id')
    if (oid && oid !== dragRef.current) setOverId(oid)
  }

  const onDragEnd = () => {
    const from = dragRef.current
    const to = overId
    if (from && to && from !== to) {
      setAzkar(prev => {
        const group = prev
          .filter(a => a.category === activeTab && a.language === activeLang)
          .sort((a, b) => a.sortOrder - b.sortOrder)
        const fi = group.findIndex(a => a.id === from)
        const ti = group.findIndex(a => a.id === to)
        if (fi === -1 || ti === -1) return prev
        const reordered = [...group]
        const [moved] = reordered.splice(fi, 1)
        reordered.splice(ti, 0, moved)
        const orderMap = new Map(reordered.map((a, i) => [a.id, i]))
        saveOrder(reordered.map(a => a.id))
        return prev.map(a => orderMap.has(a.id) ? { ...a, sortOrder: orderMap.get(a.id)! } : a)
      })
    }
    setDragId(null)
    setOverId(null)
    dragRef.current = null
  }

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* Action error toast */}
      {actionError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg">
          {actionError}
        </div>
      )}

      {/* Header */}
      <div className={cn('flex items-center gap-3 px-4 pt-5 pb-3')}>
        <button onClick={() => router.push('/admin')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 text-[18px]">
          {dir === 'rtl' ? '›' : '‹'}
        </button>
        <h1 className="text-[20px] font-bold text-gray-900">
          {lang === 'ar' ? 'إدارة الأذكار' : 'Azkar Manager'}
        </h1>
        <span className="text-[11px] bg-red-100 text-red-700 font-semibold px-2 py-1 rounded-full ms-auto">Admin</span>
      </div>

      {/* Language tabs */}
      <div className="px-4 mb-3">
        <p className="text-[11px] font-medium text-gray-400 mb-1">{lang === 'ar' ? 'لغة الأذكار' : 'Azkar Language'}</p>
        <div className={cn('flex gap-2')}>
          {LANGS.map(lng => (
            <button key={lng} onClick={() => setActiveLang(lng)}
              className={cn('flex-1 py-[8px] rounded-[10px] text-[12px] font-semibold border transition-all',
                activeLang === lng ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200')}>
              {lang === 'ar' ? LANG_LABELS[lng].ar : LANG_LABELS[lng].en}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className={cn('flex gap-2 px-4 mb-4 overflow-x-auto')}>
        {CATS.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)}
            className={cn('flex-shrink-0 px-3 py-[8px] rounded-[10px] text-[12px] font-semibold border transition-all whitespace-nowrap',
              activeTab === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-500 border-gray-200')}>
            {CAT_LABELS[cat].icon} {lang === 'ar' ? CAT_LABELS[cat].ar : CAT_LABELS[cat].en}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="mx-4 mb-4">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-[80px] bg-gray-100 rounded-[14px] animate-pulse"/>)}
          </div>
        ) : loadError ? (
          <div className="bg-white border border-red-200 rounded-[14px] p-8 text-center">
            <p className="text-[14px] font-medium text-red-600 mb-3">
              {lang === 'ar' ? 'تعذر تحميل الأذكار' : 'Could not load azkar'}
            </p>
            <button onClick={() => location.reload()}
              className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-[6px] font-semibold">
              {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : tabItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-[14px] p-8 text-center">
            <p className="text-[32px] mb-2">{CAT_LABELS[activeTab].icon}</p>
            <p className="text-[14px] font-medium text-gray-900 mb-1">
              {lang === 'ar' ? 'لا أذكار بعد' : 'No azkar yet'}
            </p>
            <p className="text-[12px] text-gray-400">
              {lang === 'ar' ? 'اضغط + لإضافة أول ذكر' : 'Tap + to add the first one'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tabItems.map((item) => (
              <div key={item.id} data-azkar-id={item.id}
                className={cn('bg-white border rounded-[14px] p-4 transition-all',
                  item.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60',
                  dragId === item.id && 'opacity-40 ring-2 ring-emerald-400',
                  overId === item.id && dragId !== item.id && 'ring-2 ring-emerald-300 bg-emerald-50/40')}>
                <div className={cn('flex items-start justify-between gap-2')}>
                  {/* Drag handle: press and drag with the cursor (or finger) to reorder */}
                  <div
                    onPointerDown={(e) => onDragStart(e, item.id)}
                    onPointerMove={onDragMove}
                    onPointerUp={onDragEnd}
                    onPointerCancel={onDragEnd}
                    role="button"
                    aria-label={lang === 'ar' ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                    className="flex-shrink-0 self-center text-gray-300 hover:text-gray-500 text-[18px] leading-none cursor-grab active:cursor-grabbing touch-none select-none px-1">
                    ⠿
                  </div>
                  <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
                    <p className="text-[16px] leading-relaxed text-gray-900 mb-1" style={{ fontFamily: "var(--font-quran), 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif" }}>
                      {item.textAr}
                    </p>
                    {item.transliteration && (
                      <p className="text-[11px] text-emerald-700/80 mb-[2px]">{item.transliteration}</p>
                    )}
                    {item.translationEn && (
                      <p className="text-[11px] text-gray-400 mb-[2px]">{item.translationEn}</p>
                    )}
                    {item.translationAr && (
                      <p className="text-[11px] text-gray-400 mb-[2px]">{item.translationAr}</p>
                    )}
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-[2px]">
                      {lang === 'ar' ? `× ${item.repetitions}` : `× ${item.repetitions}`}
                    </span>
                  </div>
                  <div className={cn('flex items-center gap-2 flex-shrink-0')}>
                    <button onClick={() => toggleActive(item)}
                      className={cn('text-[10px] px-2 py-[4px] rounded-full border font-medium',
                        item.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200')}>
                      {item.isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'مخفي' : 'Hidden')}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-[14px]">
                      ✏️
                    </button>
                    <button onClick={() => remove(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 text-[14px]">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="px-4">
        <button onClick={openAdd}
          className="w-full py-[13px] rounded-[14px] bg-emerald-600 text-white text-[14px] font-semibold active:opacity-80">
          + {lang === 'ar' ? 'إضافة ذكر جديد' : 'Add New Azkar'}
        </button>
      </div>

      {/* Add/Edit form sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
             onClick={() => setShowForm(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[20px] p-5 pb-8 flex flex-col gap-3"
               style={{ maxHeight: '90vh', overflowY: 'auto' }}
               dir={dir}
               onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-1">
              <div className="w-10 h-[4px] rounded-full bg-gray-200"/>
            </div>
            <p className="text-[17px] font-bold text-gray-900 mb-1">
              {editItem ? (lang === 'ar' ? 'تعديل الذكر' : 'Edit Azkar') : (lang === 'ar' ? 'إضافة ذكر' : 'Add Azkar')}
              <span className="ms-2 align-middle text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-[2px]">
                {lang === 'ar' ? LANG_LABELS[form.language].ar : LANG_LABELS[form.language].en}
              </span>
            </p>

            {/* Category selector */}
            <div>
              <p className="text-[11px] text-gray-400 mb-2">{lang === 'ar' ? 'الفئة' : 'Category'}</p>
              <div className={cn('flex gap-2')}>
                {CATS.map(cat => (
                  <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={cn('flex-1 py-[7px] rounded-[8px] text-[11px] font-medium border transition-all',
                      form.category === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-500 border-gray-200')}>
                    {CAT_LABELS[cat].icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Arabic text */}
            <div>
              <p className="text-[11px] text-gray-400 mb-1">{lang === 'ar' ? 'نص الذكر (عربي) *' : 'Arabic text *'}</p>
              <textarea value={form.textAr} onChange={e => setForm(f => ({ ...f, textAr: e.target.value }))}
                dir="rtl" rows={6}
                placeholder="اللهم..."
                className="w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] focus:outline-none focus:border-emerald-400 leading-relaxed"
                style={{ fontFamily: "var(--font-quran), 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif", minHeight: '120px', resize: 'vertical' }}/>
            </div>

            {/* Transliteration */}
            <div>
              <p className="text-[11px] text-gray-400 mb-1">{lang === 'ar' ? 'النطق اللاتيني (Transliteration)' : 'Transliteration'}</p>
              <input value={form.transliteration} onChange={e => setForm(f => ({ ...f, transliteration: e.target.value }))}
                dir="ltr" placeholder="Subhana Allahi wa bihamdih..."
                className="w-full h-[40px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400"/>
            </div>

            {/* Translation EN */}
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Translation (English)</p>
              <input value={form.translationEn} onChange={e => setForm(f => ({ ...f, translationEn: e.target.value }))}
                dir="ltr" placeholder="O Allah..."
                className="w-full h-[40px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400"/>
            </div>

            {/* Translation AR */}
            <div>
              <p className="text-[11px] text-gray-400 mb-1">{lang === 'ar' ? 'ترجمة المعنى (اختياري)' : 'Meaning in Arabic (optional)'}</p>
              <input value={form.translationAr} onChange={e => setForm(f => ({ ...f, translationAr: e.target.value }))}
                dir="rtl" placeholder="اللهم..."
                className="w-full h-[40px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400"/>
            </div>

            {/* Repetitions */}
            <div>
              <p className="text-[11px] text-gray-400 mb-1">{lang === 'ar' ? 'عدد التكرار' : 'Repetitions'}</p>
              <div className={cn('flex items-center gap-3')}>
                <button onClick={() => setForm(f => ({ ...f, repetitions: Math.max(1, f.repetitions - 1) }))}
                  className="w-9 h-9 rounded-[8px] border border-gray-200 text-[18px] flex items-center justify-center active:bg-gray-50">−</button>
                <input
                  type="number" inputMode="numeric" min={1} max={1000}
                  value={form.repetitions}
                  onChange={e => {
                    const n = parseInt(e.target.value, 10)
                    setForm(f => ({ ...f, repetitions: Number.isNaN(n) ? 1 : Math.min(1000, Math.max(1, n)) }))
                  }}
                  className="w-20 h-9 rounded-[8px] border border-gray-200 text-center text-[18px] font-bold text-gray-900 focus:outline-none focus:border-emerald-400"
                />
                <button onClick={() => setForm(f => ({ ...f, repetitions: f.repetitions + 1 }))}
                  className="w-9 h-9 rounded-[8px] border border-gray-200 text-[18px] flex items-center justify-center active:bg-gray-50">+</button>
              </div>
            </div>

            <div className={cn('flex gap-3 mt-2')}>
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-[12px] rounded-[12px] border border-gray-200 text-[14px] text-gray-500">
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={save} disabled={!form.textAr.trim() || saving}
                className="flex-1 py-[12px] rounded-[12px] bg-emerald-600 text-white text-[14px] font-semibold disabled:opacity-40">
                {saving ? '...' : (lang === 'ar' ? 'حفظ' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
