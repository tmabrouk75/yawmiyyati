'use client'

// Single-checkbox row (Duha, Witr, Taraweeh, Eid) whose checkbox sits in the
// Sunnah-After column so it lines up with the prayer table above it.

import { CheckBox } from '@/components/ui/ActivityComponents'
import type { Dir } from './translations'

export default function SunnahAlignedRow({
  icon, label, checked, onChange,
  showSunnah, showAzkar, showMosque = false, dir, isFirst = false,
}: {
  icon: string; label: string; checked: boolean
  onChange: (v: boolean) => void
  showSunnah: boolean; showAzkar: boolean
  showMosque?: boolean  // placeholder to keep column alignment for male users
  dir: Dir; isFirst?: boolean
}) {
  return (
    <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3`}>
      <span className="text-[14px] w-5 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1 text-[13px] text-gray-700">{label}</span>
      {/* Mirror the column grid of PrayerRow — keep alignment with fard rows */}
      <div className={`flex items-center gap-[10px] flex-shrink-0`}>
        {showMosque && <div className="w-[22px] h-[22px]"/>}{/* Mosque placeholder */}
        {showSunnah && <div className="w-[22px] h-[22px]"/>}{/* SunBef placeholder */}
        <div className="w-[22px] h-[22px]"/>{/* Fard placeholder */}
        <CheckBox checked={checked} onChange={onChange}/>
        {showAzkar && <div className="w-[22px] h-[22px]"/>}{/* Azkar placeholder */}
      </div>
    </div>
  )
}
