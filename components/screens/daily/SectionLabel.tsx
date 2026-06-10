'use client'

// The small uppercase label above each daily-entry box.

import type { Dir } from './translations'

export default function SectionLabel({ text, dir }: { text: string; dir: Dir }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 mb-[6px] px-[2px] ${dir === 'rtl' ? 'text-right tracking-normal text-[11px] normal-case' : ''}`}>
      {text}
    </p>
  )
}
