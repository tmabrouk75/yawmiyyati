'use client'

// BOX 3: Quran — pages counter, daily surahs (inline or collapsible), Surah Al-Kahf on Friday.

import { useState } from 'react'
import { CheckBox, NumberInput } from '@/components/ui/ActivityComponents'
import SectionLabel from './SectionLabel'
import type { Dir, Lang, TDict } from './translations'

export interface UserSurah {
  id: string
  surahNumber: number
  surahNameEn: string
  surahNameAr: string
}

export default function QuranBox({
  t, lang, dir, show, isFriday,
  quran, surahChecks, userSurahs,
  updateQuran, updateSurah,
}: {
  t: TDict
  lang: Lang
  dir: Dir
  show: (key: string) => boolean
  isFriday: boolean
  quran: { pagesRead: number; kahfDone: boolean }
  surahChecks: Record<string, boolean>
  userSurahs: UserSurah[]
  updateQuran: (key: string, val: any) => void
  updateSurah: (id: string, val: boolean) => void
}) {
  // Purely local UI state — whether the surah list is expanded
  const [surahsOpen, setSurahsOpen] = useState(false)

  if (!(show('quran_pages') || show('daily_surahs') || show('surah_kahf'))) return null

  return (
    <div className="mx-4 mt-3">
      <SectionLabel text={t.quran} dir={dir}/>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        {show('quran_pages') && (
          <div className={`flex items-center px-[14px] py-[10px] border-b border-gray-100 gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0">📖</span>
            <div className="flex-1">
              <div className="text-[13px] text-gray-900">{t.pages}</div>
              <div className="text-[10px] text-gray-400 mt-[1px]">{t.pagesS}</div>
            </div>
            <NumberInput value={quran.pagesRead} onChange={v => updateQuran('pagesRead', v)} max={604}/>
          </div>
        )}
        {show('daily_surahs') && userSurahs.length > 0 && (() => {
          const doneCount = userSurahs.filter(s => surahChecks[s.id]).length
          const total     = userSurahs.length
          const surahRow  = (s: UserSurah) => (
            <div key={s.id} className="flex items-center gap-3 py-[9px] border-b border-gray-100 last:border-b-0" style={{ paddingInlineStart: '40px', paddingInlineEnd: '14px' }}>
              <span className="flex-1 text-[13px] text-gray-900">{lang === 'ar' ? s.surahNameAr : s.surahNameEn}</span>
              <CheckBox checked={surahChecks[s.id] ?? false} onChange={v => updateSurah(s.id, v)}/>
            </div>
          )
          // 1–2 surahs: show inline, no toggle
          if (total <= 2) {
            return <>{userSurahs.map(surahRow)}</>
          }
          // 3+ surahs: collapsible with X/Y counter
          return (
            <>
              <div className={`flex items-center justify-between px-[14px] py-[10px] border-b border-gray-100 cursor-pointer`}
                onClick={() => setSurahsOpen(!surahsOpen)}>
                <div className={`flex items-center gap-2`}>
                  <span className="text-[15px]">📚</span>
                  <span className="text-[13px] text-gray-900">{t.surahs}</span>
                </div>
                <div className={`flex items-center gap-2`}>
                  <span className={`text-[11px] font-bold px-2 py-[2px] rounded-full ${doneCount === total ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {doneCount}/{total}
                  </span>
                  <span className={`text-gray-400 text-[12px] transition-transform inline-block ${surahsOpen ? 'rotate-180' : ''}`}>▾</span>
                </div>
              </div>
              {surahsOpen && userSurahs.map(surahRow)}
            </>
          )
        })()}
        {show('surah_kahf') && isFriday && (
          <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0">📖</span>
            <span className="flex-1 text-[13px] text-gray-900">{lang === 'ar' ? 'سورة الكهف' : 'Surah Al-Kahf'}</span>
            <CheckBox checked={quran.kahfDone} onChange={v => updateQuran('kahfDone', v)}/>
          </div>
        )}
      </div>
    </div>
  )
}
