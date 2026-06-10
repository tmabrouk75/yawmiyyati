'use client'

// BOX 5: Sadaqah — checkbox + optional amount.

import { CheckBox } from '@/components/ui/ActivityComponents'
import SectionLabel from './SectionLabel'
import type { Dir, TDict } from './translations'

export default function SadaqahBox({
  t, dir, show, sadaqah, updateSadaqah,
}: {
  t: TDict
  dir: Dir
  show: (key: string) => boolean
  sadaqah: { gave: boolean; amount: string }
  updateSadaqah: (key: string, val: any) => void
}) {
  if (!show('sadaqah')) return null

  return (
    <div className="mx-4 mt-3">
      <SectionLabel text={t.sadaqah} dir={dir}/>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        <div className={`flex items-center px-[14px] py-[10px] gap-3`}>
          <span className="text-[14px] w-5 text-center flex-shrink-0">💛</span>
          <span className="flex-1 text-[13px] text-gray-900">{t.sadaqahLabel}</span>
          <input
            type="text"
            placeholder={t.amountPh}
            value={sadaqah.amount}
            onChange={e => updateSadaqah('amount', e.target.value)}
            className="w-[90px] h-[26px] rounded-[8px] border border-gray-200 bg-gray-50 text-[12px] px-2 focus:outline-none focus:border-emerald-500"
          />
          <CheckBox checked={sadaqah.gave} onChange={v => updateSadaqah('gave', v)}/>
        </div>
      </div>
    </div>
  )
}
