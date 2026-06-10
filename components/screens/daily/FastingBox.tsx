'use client'

// BOX 4: Fasting — today's fast (with seasonal subtitle/variant), qada option,
// and the Ramadan qada counter.

import { CheckBox } from '@/components/ui/ActivityComponents'
import SectionLabel from './SectionLabel'
import type { Dir, TDict } from './translations'

export interface FastingState {
  isFasting: boolean
  fastingType: string
  isQada: boolean
  comment: string
}

export default function FastingBox({
  t, dir, show, fastSubtitle, fastVariant,
  fasting, qadaRemaining, updateFasting, markAsQada,
}: {
  t: TDict
  dir: Dir
  show: (key: string) => boolean
  fastSubtitle: string
  fastVariant: 'default' | 'ramadan' | 'monday' | 'whitedays'
  fasting: FastingState
  qadaRemaining: number
  updateFasting: (patch: Partial<FastingState>) => void
  markAsQada: () => void
}) {
  if (!(show('ramadan_fast') || show('monday_thursday') || show('white_days') || show('voluntary_fast'))) return null

  return (
    <div className="mx-4 mt-3">
      <SectionLabel text={t.fasting} dir={dir}/>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        <div className={`flex items-center px-[14px] py-[10px] gap-3`}>
          <span className="text-[14px] w-5 text-center flex-shrink-0">🌙</span>
          <div className="flex-1">
            <div className="text-[13px] text-gray-900">{t.fastToday}</div>
            <div className="text-[10px] text-gray-400 mt-[1px]">{fastSubtitle}</div>
          </div>
          <CheckBox
            checked={fasting.isFasting}
            onChange={v => updateFasting({ isFasting: v })}
            variant={fastVariant}
          />
        </div>
        {/* Qada option — shown when fasting and qada remaining */}
        {fasting.isFasting && qadaRemaining > 0 && (
          <div className={`flex items-center px-[14px] py-[9px] border-t border-gray-100 gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0 opacity-0">·</span>
            <div className="flex-1">
              <div className="text-[12px] text-gray-600">{t.fastQada}</div>
            </div>
            <CheckBox
              checked={fasting.isQada ?? false}
              onChange={v => updateFasting({ isQada: v })}
            />
          </div>
        )}
        {qadaRemaining > 0 && (
          <div className={`mx-[14px] mb-[10px] mt-1 bg-gray-50 rounded-[10px] px-3 py-[9px] flex items-center justify-between border-t border-gray-100`}>
            <div>
              <div className="text-[11px] text-gray-500">{t.qada}</div>
              <div className="text-[12px] font-semibold text-red-500">{t.qdaRemaining(qadaRemaining)}</div>
            </div>
            <button onClick={markAsQada} className="text-[10px] text-gray-500 border border-gray-200 bg-white rounded-[8px] px-3 py-1">
              {t.qdaCountBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
