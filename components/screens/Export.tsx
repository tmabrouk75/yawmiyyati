'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const T = {
  en: {
    title:       'Export Data',
    back:        'Back',
    range:       'Date range',
    from:        'From',
    to:          'To',
    presets:     'Quick range',
    last30:      'Last 30 days',
    last90:      'Last 90 days',
    last180:     'Last 180 days',
    thisYear:    'This year',
    allTime:     'All time',
    exportCSV:   'Download CSV',
    exportPDF:   'Download PDF Summary',
    csvSub:      'Full day-by-day log. Opens in Excel or Google Sheets.',
    pdfSub:      'Summary report with charts. Shareable PDF.',
    exporting:   'Preparing...',
    premiumOnly: 'Export requires Premium',
    upgrade:     'Upgrade to Premium',
    privacyNote: 'Your data is exported directly to your device. Nothing is shared.',
  },
  ar: {
    title:       'تصدير البيانات',
    back:        'رجوع',
    range:       'نطاق التاريخ',
    from:        'من',
    to:          'إلى',
    presets:     'نطاق سريع',
    last30:      'آخر ٣٠ يومًا',
    last90:      'آخر ٩٠ يومًا',
    last180:     'آخر ١٨٠ يومًا',
    thisYear:    'هذه السنة',
    allTime:     'كل الوقت',
    exportCSV:   'تحميل CSV',
    exportPDF:   'تحميل تقرير PDF',
    csvSub:      'سجل يومي كامل. يفتح في Excel أو Google Sheets.',
    pdfSub:      'تقرير ملخص مع رسوم. ملف PDF قابل للمشاركة.',
    exporting:   'جارٍ التحضير...',
    premiumOnly: 'التصدير يتطلب بريميوم',
    upgrade:     'الترقية إلى بريميوم',
    privacyNote: 'بياناتك تُصدَّر مباشرة إلى جهازك ولا تُشارك مع أي طرف.',
  },
}

function dateStr(d: Date) { return d.toISOString().split('T')[0] }

export default function ExportScreen({ isPremium }: { isPremium: boolean }) {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const today  = new Date()
  const [from, setFrom]         = useState(dateStr(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())))
  const [to,   setTo]           = useState(dateStr(today))
  const [csvStatus,  setCsvStatus]  = useState<'idle' | 'loading' | 'done'>('idle')

  const setPreset = (days: number | 'year' | 'all') => {
    const toDate = new Date()
    let fromDate: Date
    if (days === 'year') {
      fromDate = new Date(toDate.getFullYear(), 0, 1)
    } else if (days === 'all') {
      fromDate = new Date('2020-01-01')
    } else {
      fromDate = new Date(toDate)
      fromDate.setDate(fromDate.getDate() - days)
    }
    setFrom(dateStr(fromDate))
    setTo(dateStr(toDate))
  }

  const downloadCSV = async () => {
    setCsvStatus('loading')
    const res = await fetch(`/api/export/csv?from=${from}&to=${to}`)
    if (!res.ok) { setCsvStatus('idle'); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `yawmiyyati-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setCsvStatus('done')
    setTimeout(() => setCsvStatus('idle'), 3000)
  }

  const inp = 'h-[40px] rounded-[10px] border border-gray-200 bg-white px-3 text-[13px] focus:outline-none focus:border-emerald-400'
  const lbl = cn('text-[11px] font-semibold text-gray-500 mb-1', dir === 'rtl' && 'text-right block')

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* TOP BAR */}
      <div className={cn('flex items-center gap-3 px-4 pt-4 pb-2', dir === 'rtl' && 'flex-row-reverse')}>
        <button onClick={() => router.back()} className="text-[13px] text-gray-400">
          {dir === 'rtl' ? '›' : '‹'} {t.back}
        </button>
      </div>
      <div className={cn('px-4 pb-4', dir === 'rtl' && 'text-right')}>
        <h1 className="text-[18px] font-semibold text-gray-900">{t.title}</h1>
      </div>

      {!isPremium ? (
        <div className="mx-4 bg-amber-50 border border-amber-100 rounded-[14px] p-6 flex flex-col items-center text-center gap-3">
          <span className="text-[36px]">📊</span>
          <p className="text-[14px] font-semibold text-amber-800">{t.premiumOnly}</p>
          <button
            onClick={() => router.push('/premium')}
            className="px-5 py-[10px] rounded-full bg-amber-600 text-white text-[13px] font-semibold"
          >
            {t.upgrade}
          </button>
        </div>
      ) : (
        <>
          {/* Date range */}
          <p className={cn('mx-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal normal-case text-[11px]')}>
            {t.range}
          </p>

          {/* Quick presets */}
          <div className="mx-4 mb-3 flex flex-wrap gap-2">
            {[
              { label: t.last30,   val: 30 as const },
              { label: t.last90,   val: 90 as const },
              { label: t.last180,  val: 180 as const },
              { label: t.thisYear, val: 'year' as const },
              { label: t.allTime,  val: 'all' as const },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => setPreset(p.val)}
                className="text-[11px] font-medium border border-gray-200 rounded-full px-3 py-[5px] bg-white text-gray-600 active:bg-gray-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mx-4 mb-5 bg-white border border-gray-200 rounded-[14px] p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={lbl}>{t.from}</p>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={cn(inp, 'w-full')}/>
              </div>
              <div>
                <p className={lbl}>{t.to}</p>
                <input type="date" value={to} onChange={e => setTo(e.target.value)} className={cn(inp, 'w-full')}/>
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="mx-4 flex flex-col gap-3">
            <div className="bg-white border border-gray-200 rounded-[14px] p-4">
              <div className={cn('mb-3', dir === 'rtl' && 'text-right')}>
                <p className="text-[13px] font-semibold text-gray-900">📄 CSV</p>
                <p className="text-[11px] text-gray-400 mt-[2px]">{t.csvSub}</p>
              </div>
              <button
                onClick={downloadCSV}
                disabled={csvStatus === 'loading'}
                className={cn(
                  'w-full py-[11px] rounded-[10px] text-[13px] font-semibold transition-all',
                  csvStatus === 'done'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-900 text-white disabled:opacity-50'
                )}
              >
                {csvStatus === 'idle' ? `⬇ ${t.exportCSV}`
                 : csvStatus === 'loading' ? t.exporting
                 : '✓ Downloaded'}
              </button>
            </div>

          </div>

          {/* Privacy note */}
          <p className={cn('mx-4 mt-4 text-[11px] text-gray-400 text-center', dir === 'rtl' && 'text-center')}>
            🔒 {t.privacyNote}
          </p>
        </>
      )}
    </div>
  )
}
