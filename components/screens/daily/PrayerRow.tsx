'use client'

// One fard prayer row with its checkbox columns (mosque / sunnah / fard / azkar).
// Presentational — all state lives in the useDailyEntryState hook.

import { CheckBox, FardCheckBox, FardState } from '@/components/ui/ActivityComponents'
import type { PrayerState, PrayerKey, Lang, Dir, TDict } from './translations'

// Convert two booleans ↔ FardState enum
export function getFardState(done: boolean, isQada: boolean): FardState {
  if (isQada) return 'qadaa'
  if (done)   return 'done'
  return 'unchecked'
}
export function fardStateToBools(s: FardState) {
  return { done: s !== 'unchecked', isQada: s === 'qadaa' }
}

export default function PrayerRow({
  pKey, hasBefore, hasAfter, hasAzkar, isMale, rakaat, state, onChange, onFardChange, lang, dir, t,
  overrideLabel, overrideSub,
}: {
  pKey:           PrayerKey
  hasBefore:      boolean
  hasAfter:       boolean
  hasAzkar:       boolean
  isMale:         boolean   // show mosque column
  rakaat:         number
  state:          PrayerState
  onChange:       (key: string, val: any) => void
  onFardChange:   (pKey: string, done: boolean, isQada: boolean) => void
  lang:           Lang
  dir:            Dir
  t:              TDict
  overrideLabel?: string
  overrideSub?:   string
}) {
  const fardState = getFardState(
    (state as any)[`${pKey}Done`],
    (state as any)[`${pKey}IsQada`]
  )

  const handleFard = (next: FardState) => {
    const { done, isQada } = fardStateToBools(next)
    onFardChange(pKey, done, isQada)
  }

  const label = overrideLabel ?? (t[pKey as keyof typeof t] as string)
  const sub   = overrideSub ?? (lang === 'ar' ? `فرض · ${rakaat} ركعات` : `Fard · ${rakaat} rakaat`)
  const mosqueChecked = (state as any)[`${pKey}Mosque`] ?? false

  return (
    <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100`}>

      {/* Prayer name */}
      <div className={`flex-1 min-w-0 ${dir === 'rtl' ? 'text-right' : ''}`}>
        <div className="text-[13px] font-medium text-gray-900">{label}</div>
        <div className="text-[10px] text-gray-400 mt-[1px]">{sub}</div>
        {fardState === 'qadaa' && (
          <span className="text-[9px] font-semibold text-red-700 mt-[2px] block">
            {lang === 'ar' ? '● قضاء' : '● Qadaa'}
          </span>
        )}
      </div>

      {/* Checkbox columns */}
      <div className={`flex items-center gap-[10px] flex-shrink-0`}>

        {/* Mosque (Jama'ah) column — males only, leftmost */}
        {isMale && (
          <CheckBox
            checked={mosqueChecked}
            onChange={v => {
              onChange(`${pKey}Mosque`, v)
              if (v) onFardChange(pKey, true, false)
            }}
            variant="mosque"
          />
        )}

        {hasBefore
          ? <CheckBox checked={(state as any)[`${pKey}Before`] ?? false} onChange={v => onChange(`${pKey}Before`, v)}/>
          : <div className="w-[22px] h-[22px] opacity-0 pointer-events-none"/>
        }

        {/* Fard — 3-state: unchecked / done / qadaa */}
        <FardCheckBox state={fardState} onChange={handleFard}/>

        {hasAfter
          ? <CheckBox checked={(state as any)[`${pKey}After`] ?? false} onChange={v => onChange(`${pKey}After`, v)}/>
          : <div className="w-[22px] h-[22px] opacity-0 pointer-events-none"/>
        }

        {hasAzkar && (
          <CheckBox checked={(state as any)[`${pKey}Azkar`] ?? false} onChange={v => onChange(`${pKey}Azkar`, v)} variant="azkar"/>
        )}

      </div>
    </div>
  )
}
