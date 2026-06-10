'use client'

// Bottom-sheet overlay that shows the azkar text list (morning or evening).
// Pure presentational — receives the definitions, renders them, reports close.

import type { AzkarDef, Lang } from './translations'

export default function AzkarOverlay({
  title, defs, lang, dir, onClose,
}: {
  title: string
  defs: AzkarDef[]
  lang: Lang
  dir: string
  onClose: () => void
}) {
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
        <div className={`px-4 py-3 flex items-center justify-between flex-shrink-0`}>
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
              {defs.map((def, i) => (
                <div key={def.id} className="py-5">
                  <div className="flex items-start gap-3">
                    {/* Numbered circle */}
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-1">
                      {i + 1}
                    </div>
                    <div className={`flex-1 min-w-0 ${dir === 'rtl' ? 'text-right' : ''}`}>
                      {/* Arabic text — whitespace-pre-wrap handles multi-line entries */}
                      <p className="text-[17px] leading-[2] text-gray-900 whitespace-pre-wrap"
                         style={{ fontFamily: "var(--font-quran), 'Amiri', 'Scheherazade New', 'Traditional Arabic', serif" }}>
                        {def.textAr}
                      </p>
                      {/* Translation */}
                      {(lang === 'en' ? def.translationEn : def.translationAr) && (
                        <p className="text-[12px] text-gray-400 mt-2 leading-relaxed italic">
                          {lang === 'en' ? def.translationEn : def.translationAr}
                        </p>
                      )}
                      {/* Repetitions */}
                      <div className="mt-2">
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-[2px] font-semibold">
                          {lang === 'ar' ? `${def.repetitions} مرة` : `× ${def.repetitions}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
