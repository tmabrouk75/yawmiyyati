'use client'

// Bottom-sheet overlay that shows the azkar list (morning or evening) with a
// per-dhikr countdown. Each dhikr has one centered box: press to count down,
// and at zero the same box becomes a check with a reset label inside it.
// Counts persist on the device (see useAzkarCounter) and reset the next day.

import { useState, useEffect, useRef } from 'react'
import type { AzkarDef, Lang } from './translations'
import { useAzkarCounter } from '@/hooks/useAzkarCounter'

const toArabicDigits = (n: number) =>
  String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d])

export default function AzkarOverlay({
  title, defs, lang, dir, dateKey, category, onAllComplete, onClose,
}: {
  title: string
  defs: AzkarDef[]
  lang: Lang
  dir: string
  dateKey: string
  category: string
  onAllComplete?: () => void
  onClose: () => void
}) {
  const { remaining, dec, reset, allDone } = useAzkarCounter(dateKey, category, defs)
  const [flashId, setFlashId] = useState<string | null>(null)
  const interacted = useRef(false)

  // Mark the whole set done once the user counts the last rep to zero.
  useEffect(() => {
    if (allDone && interacted.current) onAllComplete?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone])

  const fmt = (n: number) => (lang === 'ar' ? toArabicDigits(n) : String(n))

  const handleTap = (def: AzkarDef) => {
    interacted.current = true
    const cur = remaining(def.id)
    if (cur > 0) {
      dec(def.id)
      if (cur === 1) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([40, 30, 40])
        setFlashId(def.id)
        setTimeout(() => setFlashId(s => (s === def.id ? null : s)), 320)
      }
    } else {
      reset(def.id)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-end justify-center"
         onClick={onClose}>
      <div className="w-full max-w-[430px] bg-white rounded-t-[24px] overflow-hidden flex flex-col"
           style={{ maxHeight: '82vh', marginBottom: '58px' }}
           dir={dir}
           onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-[4px] rounded-full bg-gray-200"/>
        </div>
        {/* Title row */}
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-[18px]">
            ×
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto flex-1 pb-8 px-4">
          {defs.length === 0 ? (
            <p className="text-center text-[13px] text-gray-400 py-10">
              {lang === 'ar' ? 'لم تُضف أذكار بعد. أضفها من لوحة الإدارة.' : 'No azkar added yet. Add them from the Admin panel.'}
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {defs.map(def => {
                const rem = remaining(def.id)
                const done = rem <= 0
                return (
                  <div key={def.id} className="py-5">
                    <div className={dir === 'rtl' ? 'text-right' : ''}>
                      {/* Arabic recitation text (always shown) */}
                      <p className="text-[17px] leading-[2] text-gray-900 whitespace-pre-wrap"
                         style={{ fontFamily: "var(--font-quran), 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif" }}>
                        {def.textAr}
                      </p>
                      {/* Translation in the active language */}
                      {(lang === 'en' ? def.translationEn : def.translationAr) && (
                        <p className="text-[12px] text-gray-400 mt-2 leading-relaxed italic">
                          {lang === 'en' ? def.translationEn : def.translationAr}
                        </p>
                      )}
                    </div>
                    {/* Centered counter box, reachable by either thumb */}
                    <div className="flex justify-center mt-3">
                      <button
                        onClick={() => handleTap(def)}
                        aria-label={done
                          ? (lang === 'ar' ? 'مكتمل، اضغط للإعادة' : 'Completed, tap to reset')
                          : (lang === 'ar'
                              ? `اضغط للعدّ، المتبقي ${toArabicDigits(rem)} من ${toArabicDigits(def.repetitions)}`
                              : `Tap to count, ${rem} of ${def.repetitions} remaining`)}
                        className={[
                          'w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center select-none transition-transform active:scale-90',
                          done ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-emerald-500',
                          flashId === def.id ? 'scale-110' : '',
                        ].join(' ')}
                      >
                        {done ? (
                          <>
                            <span className="text-emerald-600 text-[20px] leading-none">✓</span>
                            <span className="text-emerald-700 text-[11px] mt-[2px]">↻ {lang === 'ar' ? 'إعادة' : 'Reset'}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-emerald-700 text-[22px] font-bold leading-none">{fmt(rem)}</span>
                            <span className="text-gray-400 text-[11px] mt-[2px]">{lang === 'ar' ? `من ${toArabicDigits(def.repetitions)}` : `of ${def.repetitions}`}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {/* Done button */}
        <div className="px-4 pb-6 pt-2 flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-[14px] rounded-[14px] bg-emerald-600 text-white text-[15px] font-semibold active:opacity-80">
            {lang === 'ar' ? 'تم' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  )
}
