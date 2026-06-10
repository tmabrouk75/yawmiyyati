'use client'

// Period toggle — female users only. Prayers exempt, streak protected.

import type { Dir, TDict } from './translations'

export default function PeriodToggle({
  t, dir, isPeriod, onToggle,
}: {
  t: TDict
  dir: Dir
  isPeriod: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className={`mx-4 mt-3 rounded-[12px] px-[14px] py-[10px] flex items-center justify-between cursor-pointer border transition-colors ${isPeriod ? 'bg-rose-50 border-rose-300' : 'bg-white border-gray-200'}`}
    >
      <div className={dir === 'rtl' ? 'text-right' : ''}>
        <div className={`text-[13px] font-medium ${isPeriod ? 'text-rose-700' : 'text-gray-700'}`}>
          🌸 {t.period}
        </div>
        {isPeriod && (
          <div className="text-[11px] text-rose-500 mt-[1px]">{t.periodSub}</div>
        )}
      </div>
      <div className={`w-[38px] h-[22px] rounded-full transition-colors flex items-center px-[3px] ${isPeriod ? 'bg-rose-400' : 'bg-gray-200'}`}>
        <div className={`w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform ${isPeriod ? (dir === 'rtl' ? '-translate-x-[16px]' : 'translate-x-[16px]') : 'translate-x-0'}`}/>
      </div>
    </div>
  )
}
