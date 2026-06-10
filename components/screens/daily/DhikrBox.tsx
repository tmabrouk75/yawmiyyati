'use client'

// BOX 2: Dhikr counters (istighfar, salawat).

import { NumberInput } from '@/components/ui/ActivityComponents'
import SectionLabel from './SectionLabel'
import type { Dir, TDict } from './translations'

export default function DhikrBox({
  t, dir, show, istighfarCount, salawatCount, updateDhikr,
}: {
  t: TDict
  dir: Dir
  show: (key: string) => boolean
  istighfarCount: number
  salawatCount: number
  updateDhikr: (key: string, val: boolean | number) => void
}) {
  if (!(show('morning_azkar') || show('evening_azkar') || show('istighfar') || show('salawat'))) return null

  return (
    <div className="mx-4 mt-3">
      <SectionLabel text={t.dhikr} dir={dir}/>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">

        {show('istighfar') && (
          <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100 gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0">🤲</span>
            <div className="flex-1">
              <div className="text-[13px] text-gray-900">{t.istighfar}</div>
              <div className="text-[10px] text-gray-400 mt-[1px]">{t.istighfarS}</div>
            </div>
            <NumberInput value={istighfarCount} onChange={v => updateDhikr('istighfarCount', v)} width="w-[64px]"/>
          </div>
        )}
        {show('salawat') && (
          <div className={`flex items-center px-[14px] py-[10px] gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0">💚</span>
            <div className="flex-1">
              <div className="text-[13px] text-gray-900">{t.salawat}</div>
              <div className="text-[10px] text-gray-400 mt-[1px]">{t.salawatS}</div>
            </div>
            <NumberInput value={salawatCount} onChange={v => updateDhikr('salawatCount', v)} width="w-[64px]"/>
          </div>
        )}
      </div>
    </div>
  )
}
