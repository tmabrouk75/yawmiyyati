'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:         'Islamic Calendar',
    sub:           'Set actual moon-sighting dates per country',
    year:          'Hijri Year',
    selectMonth:   'Select month to configure',
    eventTypes:    { MONTH_START: 'Month Start', EID_FITR: 'Eid al-Fitr', EID_ADHA: 'Eid al-Adha' },
    calculatedDate:'Calculated date (algorithm)',
    countries:     'Country confirmations',
    addCountry:    'Add country',
    selectCountry: 'Select country...',
    offset:        'Day offset',
    confirmedDate: 'Confirmed date',
    source:        'Source (optional)',
    sourcePh:      'e.g. Official announcement, ISNA, Moon sighting committee',
    save:          'Save',
    saving:        'Saving...',
    saved:         'Saved ✓',
    remove:        'Remove',
    notes:         'Notes (optional)',
    notesPlaceholder: 'e.g. Based on Saudi official announcement',
    offsetLabels:  {
      '-1': '−1 day (day before calculated)',
       '0': 'Same day as calculated',
       '1': '+1 day after calculated',
       '2': '+2 days after calculated',
    },
    loading:       'Loading...',
    noMonth:       'Select a month above to manage its dates',
    months: [
      '', 'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
      'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah',
    ],
  },
  ar: {
    title:         'التقويم الإسلامي',
    sub:           'تحديد مواعيد رؤية الهلال حسب الدولة',
    year:          'السنة الهجرية',
    selectMonth:   'اختر الشهر لضبطه',
    eventTypes:    { MONTH_START: 'بداية الشهر', EID_FITR: 'عيد الفطر', EID_ADHA: 'عيد الأضحى' },
    calculatedDate:'التاريخ المحتسب (خوارزمية)',
    countries:     'تأكيدات الدول',
    addCountry:    'إضافة دولة',
    selectCountry: 'اختر دولة...',
    offset:        'فارق الأيام',
    confirmedDate: 'التاريخ المؤكد',
    source:        'المصدر (اختياري)',
    sourcePh:      'مثال: إعلان رسمي، لجنة رؤية الهلال',
    save:          'حفظ',
    saving:        'جارٍ الحفظ...',
    saved:         'تم الحفظ ✓',
    remove:        'حذف',
    notes:         'ملاحظات (اختياري)',
    notesPlaceholder: 'مثال: بناءً على إعلان المملكة العربية السعودية',
    offsetLabels: {
      '-1': '−١ يوم (قبل المحتسب)',
       '0': 'نفس يوم المحتسب',
       '1': '+١ يوم بعد المحتسب',
       '2': '+٢ يوم بعد المحتسب',
    },
    loading:       'جارٍ التحميل...',
    noMonth:       'اختر شهراً من القائمة أعلاه لضبط مواعيده',
    months: [
      '', 'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
      'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
    ],
  },
}

const OFFSETS = ['-1', '0', '1', '2']

// ─── ADD COUNTRY ROW ──────────────────────────────────────

function AddCountryRow({
  allCountries,
  existingCodes,
  calculatedDate,
  dir,
  lang,
  t,
  onAdd,
}: {
  allCountries: any[]
  existingCodes: Set<string>
  calculatedDate: string
  dir: 'ltr' | 'rtl'
  lang: 'en' | 'ar'
  t: typeof T['en']
  onAdd: (ov: any) => void
}) {
  const [code,   setCode]   = useState('')
  const [offset, setOffset] = useState('0')
  const [date,   setDate]   = useState(calculatedDate)
  const [source, setSource] = useState('')

  const available = allCountries.filter(c => !existingCodes.has(c.code))

  const handleAdd = () => {
    if (!code) return
    const country = allCountries.find(c => c.code === code)
    onAdd({
      countryCode:    code,
      countryNameEn:  country?.nameEn ?? code,
      countryNameAr:  country?.nameAr ?? code,
      dayOffset:      parseInt(offset),
      confirmedDate:  date,
      source:         source || null,
      isNew:          true,
    })
    setCode(''); setOffset('0'); setDate(calculatedDate); setSource('')
  }

  return (
    <div className={cn(
      'bg-gray-50 border border-dashed border-gray-300 rounded-[10px] p-3 flex flex-col gap-2',
      dir === 'rtl' && 'text-right'
    )}>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={code}
          onChange={e => setCode(e.target.value)}
          className="h-[36px] rounded-[8px] border border-gray-200 bg-white px-2 text-[12px] focus:outline-none"
          dir={dir}
        >
          <option value="">{t.selectCountry}</option>
          {available.map(c => (
            <option key={c.code} value={c.code}>
              {lang === 'ar' ? c.nameAr : c.nameEn} ({c.code})
            </option>
          ))}
        </select>
        <select
          value={offset}
          onChange={e => {
            setOffset(e.target.value)
            // Auto-compute confirmed date
            const base = new Date(calculatedDate)
            base.setDate(base.getDate() + parseInt(e.target.value))
            setDate(base.toISOString().split('T')[0])
          }}
          className="h-[36px] rounded-[8px] border border-gray-200 bg-white px-2 text-[12px] focus:outline-none"
        >
          {OFFSETS.map(o => (
            <option key={o} value={o}>{t.offsetLabels[o as keyof typeof t.offsetLabels]}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-gray-500 mb-1">{t.confirmedDate}</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full h-[34px] rounded-[8px] border border-gray-200 bg-white px-2 text-[12px] focus:outline-none"
          />
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">{t.source}</p>
          <input
            type="text"
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder={t.sourcePh}
            className="w-full h-[34px] rounded-[8px] border border-gray-200 bg-white px-2 text-[12px] focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={!code}
        className="w-full py-[8px] rounded-[8px] bg-emerald-600 text-white text-[12px] font-semibold disabled:opacity-40"
      >
        + {t.addCountry}
      </button>
    </div>
  )
}

// ─── EVENT PANEL ──────────────────────────────────────────

function EventPanel({
  event,
  allCountries,
  lang,
  dir,
  t,
  onSaved,
}: {
  event: any
  allCountries: any[]
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
  onSaved: () => void
}) {
  const [overrides,  setOverrides]  = useState<any[]>(event.countryOverrides ?? [])
  const [calcDate,   setCalcDate]   = useState(event.calculatedDate)
  const [notes,      setNotes]      = useState(event.notes ?? '')
  const [status,     setStatus]     = useState<'idle' | 'saving' | 'saved'>('idle')

  const existingCodes = new Set(overrides.map((o: any) => o.countryCode))

  const save = async () => {
    setStatus('saving')
    await fetch('/api/admin/calendar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hijriYear:       event.hijriYear,
        hijriMonth:      event.hijriMonth,
        eventType:       event.eventType,
        calculatedDate:  calcDate,
        notes,
        overrides: overrides.map(o => ({
          countryCode:   o.countryCode,
          dayOffset:     o.dayOffset,
          confirmedDate: o.confirmedDate,
          source:        o.source,
        })),
      }),
    })
    setStatus('saved')
    setTimeout(() => { setStatus('idle'); onSaved() }, 1500)
  }

  const removeOverride = async (ov: any) => {
    if (!ov.isNew && ov.id) {
      await fetch(`/api/admin/calendar?overrideId=${ov.id}`, { method: 'DELETE' })
    }
    setOverrides(prev => prev.filter(o => o.countryCode !== ov.countryCode))
  }

  const eventLabel = t.eventTypes[event.eventType as keyof typeof t.eventTypes]

  return (
    <div className="bg-white border border-gray-200 rounded-[12px] overflow-hidden mb-3">
      {/* Header */}
      <div className={cn(
        'px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between',
      )}>
        <div className={dir === 'rtl' ? 'text-right' : ''}>
          <p className="text-[13px] font-semibold text-gray-900">{eventLabel}</p>
          <p className="text-[11px] text-gray-500 mt-[1px]">
            {t.calculatedDate}: {event.calculatedDate}
          </p>
        </div>
        <button
          onClick={save}
          disabled={status !== 'idle'}
          className={cn(
            'px-4 py-[7px] rounded-[8px] text-[12px] font-semibold transition-all',
            status === 'saved'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-emerald-600 text-white disabled:opacity-50'
          )}
        >
          {status === 'idle' ? t.save : status === 'saving' ? t.saving : t.saved}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Calculated date override */}
        <div>
          <p className={cn('text-[10px] font-semibold text-gray-500 mb-1', dir === 'rtl' && 'text-right')}>
            {t.calculatedDate}
          </p>
          <input
            type="date"
            value={calcDate}
            onChange={e => setCalcDate(e.target.value)}
            className="h-[36px] w-full rounded-[8px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Notes */}
        <div>
          <p className={cn('text-[10px] font-semibold text-gray-500 mb-1', dir === 'rtl' && 'text-right')}>{t.notes}</p>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t.notesPlaceholder}
            dir={dir}
            className="h-[36px] w-full rounded-[8px] border border-gray-200 bg-gray-50 px-3 text-[12px] focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Country overrides list */}
        {overrides.length > 0 && (
          <div>
            <p className={cn('text-[10px] font-semibold text-gray-500 mb-2', dir === 'rtl' && 'text-right')}>
              {t.countries}
            </p>
            <div className="flex flex-col gap-2">
              {overrides.map((ov: any) => (
                <div
                  key={ov.countryCode}
                  className={cn(
                    'flex items-center gap-2 bg-gray-50 rounded-[8px] px-3 py-2',
                  )}
                >
                  {/* Flag emoji via country code */}
                  <span className="text-[18px] flex-shrink-0">
                    {String.fromCodePoint(...ov.countryCode.split('').map((c: string) => 0x1F1E6 + c.charCodeAt(0) - 65))}
                  </span>
                  <div className={cn('flex-1 min-w-0', dir === 'rtl' && 'text-right')}>
                    <p className="text-[12px] font-semibold text-gray-800">
                      {lang === 'ar' ? ov.countryNameAr : ov.countryNameEn}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {ov.confirmedDate}
                      {ov.dayOffset !== 0 && (
                        <span className={ov.dayOffset > 0 ? 'text-amber-600' : 'text-blue-600'}>
                          {' '}({ov.dayOffset > 0 ? '+' : ''}{ov.dayOffset}d)
                        </span>
                      )}
                      {ov.source && <span className="text-gray-400"> · {ov.source}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => removeOverride(ov)}
                    className="text-[10px] text-red-400 border border-red-100 rounded-full px-2 py-[3px] flex-shrink-0"
                  >
                    {t.remove}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add country row */}
        <AddCountryRow
          allCountries={allCountries}
          existingCodes={existingCodes}
          calculatedDate={calcDate}
          dir={dir}
          lang={lang}
          t={t}
          onAdd={ov => setOverrides(prev => [...prev, ov])}
        />
      </div>
    </div>
  )
}

// ─── MAIN CALENDAR MANAGER ────────────────────────────────

export default function AdminCalendar() {
  const { lang, dir } = useLang()
  const t = T[lang]

  const currentHijriYear = new Date().getFullYear() - 578  // rough estimate, replaced on load
  const [year,          setYear]          = useState(1447)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [events,        setEvents]        = useState<any[]>([])
  const [allCountries,  setAllCountries]  = useState<any[]>([])
  const [loading,       setLoading]       = useState(false)

  const loadEvents = useCallback(async (y: number, m?: number) => {
    setLoading(true)
    const params = new URLSearchParams({ year: String(y) })
    if (m) params.set('month', String(m))
    const res = await fetch(`/api/admin/calendar?${params}`)
    const data = await res.json()
    setEvents(data.events ?? [])
    setAllCountries(data.countries ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadEvents(year, selectedMonth ?? undefined) }, [year, selectedMonth, loadEvents])

  const monthEvents = selectedMonth
    ? events.filter(e => e.hijriMonth === selectedMonth)
    : []

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* TOP BAR */}
      <div className={cn('px-4 pt-5 pb-2', dir === 'rtl' && 'text-right')}>
        <h1 className="text-[20px] font-bold text-gray-900">{t.title}</h1>
        <p className="text-[12px] text-gray-400 mt-[2px]">{t.sub}</p>
      </div>

      {/* Year selector */}
      <div className={cn('flex items-center gap-3 px-4 mb-4')}>
        <p className="text-[12px] font-semibold text-gray-600">{t.year}:</p>
        <div className="flex gap-2">
          {[1446, 1447, 1448].map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={cn(
                'px-3 py-[5px] rounded-full text-[12px] font-medium border transition-all',
                year === y
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-200'
              )}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Month grid */}
      <div className="px-4 mb-5">
        <p className={cn('text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'tracking-normal normal-case text-[11px] text-right')}>
          {t.selectMonth}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const hasOverrides = events.some(e => e.hijriMonth === m && e.countryOverrides?.length > 0)
            const isEid = m === 10 || m === 12
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m === selectedMonth ? null : m)}
                className={cn(
                  'py-[10px] rounded-[10px] text-center border transition-all',
                  selectedMonth === m
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200',
                )}
              >
                <p className="text-[11px] font-semibold leading-tight">
                  {lang === 'ar' ? t.months[m] : t.months[m]}
                </p>
                <p className="text-[9px] text-current opacity-60 mt-[1px]">{m}</p>
                <div className="flex justify-center gap-1 mt-1">
                  {hasOverrides && <span className="w-[5px] h-[5px] rounded-full bg-emerald-400 inline-block"/>}
                  {isEid && <span className="w-[5px] h-[5px] rounded-full bg-amber-400 inline-block"/>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Event panels */}
      {selectedMonth === null ? (
        <div className={cn('px-4 py-6 text-center text-[13px] text-gray-400', dir === 'rtl' && 'text-center')}>
          {t.noMonth}
        </div>
      ) : loading ? (
        <div className="px-4">
          {[1,2].map(i => (
            <div key={i} className="h-[120px] bg-gray-100 rounded-[12px] animate-pulse mb-3"/>
          ))}
        </div>
      ) : (
        <div className="px-4">
          {monthEvents.map(event => (
            <EventPanel
              key={`${event.hijriMonth}-${event.eventType}`}
              event={event}
              allCountries={allCountries}
              lang={lang}
              dir={dir}
              t={t}
              onSaved={() => loadEvents(year, selectedMonth)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
