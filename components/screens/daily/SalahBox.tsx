'use client'

// BOX 1: the unified Salah table — column headers, Fajr, morning azkar row,
// Duha, the four main prayers (with Jumu'ah override on Friday), evening azkar
// row after Asr, Qiyam, Witr.

import { Fragment } from 'react'
import { CheckBox, NumberInput } from '@/components/ui/ActivityComponents'
import PrayerRow from './PrayerRow'
import SunnahAlignedRow from './SunnahAlignedRow'
import SectionLabel from './SectionLabel'
import { PRAYERS_FAJR, PRAYERS_MAIN } from './translations'
import type { PrayerState, Lang, Dir, TDict } from './translations'

export default function SalahBox({
  t, lang, dir, gender, show, isFriday,
  prayer, morningAzkarDone, eveningAzkarDone,
  updatePrayer, updateFard, updateDhikr,
  onOpenMorningAzkar, onOpenEveningAzkar, onOpenAfterSalahAzkar,
}: {
  t: TDict
  lang: Lang
  dir: Dir
  gender: string | null
  show: (key: string) => boolean
  isFriday: boolean
  prayer: PrayerState
  morningAzkarDone: boolean
  eveningAzkarDone: boolean
  updatePrayer: (key: string, val: boolean | number) => void
  updateFard: (pKey: string, done: boolean, isQada: boolean) => void
  updateDhikr: (key: string, val: boolean | number) => void
  onOpenMorningAzkar: () => void
  onOpenEveningAzkar: () => void
  onOpenAfterSalahAzkar: () => void
}) {
  return (
    <div className="mx-4 mt-3">
      <SectionLabel text={t.salah} dir={dir}/>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        {/* Column header row — only show columns that are enabled */}
        <div className={`flex items-center px-[14px] pt-[8px] pb-[2px] border-b border-gray-100`}>
          <div className="flex-1"/>
          <div className={`flex items-center gap-[10px] flex-shrink-0`}>
            {/* Mosque column header — males only */}
            {gender && (
              <div className="w-[22px] text-center text-[12px] leading-none" title={lang === 'ar' ? 'في المسجد' : 'In mosque'}>🕌</div>
            )}
            {show('sunnah_rawatib') && (
              <div className="w-[22px] text-center text-[8px] leading-tight whitespace-pre-line font-medium text-gray-400">{t.sunBef}</div>
            )}
            <div className="w-[22px] text-center text-[8px] leading-tight font-semibold text-emerald-700">{t.fard}</div>
            {show('sunnah_rawatib') && (
              <div className="w-[22px] text-center text-[8px] leading-tight whitespace-pre-line font-medium text-gray-400">{t.sunAft}</div>
            )}
            {show('prayer_azkar') && (
              <div className="w-[22px] text-center text-[8px] leading-tight font-medium text-blue-500">{t.azkar}</div>
            )}
          </div>
        </div>

        {/* 1. Fajr */}
        {PRAYERS_FAJR.map(p => (
          <PrayerRow
            key={p.key}
            pKey={p.key}
            isMale={!!gender}
            hasBefore={p.hasBefore && show('sunnah_rawatib')}
            hasAfter={p.hasAfter && show('sunnah_rawatib')}
            hasAzkar={show('prayer_azkar')}
            rakaat={p.rakaat}
            state={prayer}
            onChange={updatePrayer}
            onFardChange={updateFard}
            lang={lang}
            dir={dir}
            t={t}
          />
        ))}

        {/* Morning Azkar — after Fajr, before Duha */}
        {show('morning_azkar') && (
          <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0">🌅</span>
            <span className={`flex-1 text-[13px] text-gray-700 ${dir === 'rtl' ? 'text-right' : ''}`}>{t.morning}</span>
            <div className={`flex items-center gap-2 flex-shrink-0`}>
              <button onClick={onOpenMorningAzkar}
                className="h-[26px] px-2 rounded-[8px] flex items-center gap-1 text-[10px] font-medium bg-blue-50 border border-blue-200 text-blue-500 active:bg-blue-100 flex-shrink-0">
                <span>📖</span>
                <span>{lang === 'ar' ? 'اقرأ' : 'Read'}</span>
              </button>
              <CheckBox checked={morningAzkarDone} onChange={v => updateDhikr('morningAzkarDone', v)} variant="azkar"/>
            </div>
          </div>
        )}

        {/* 2. Duha — after Fajr, before Dhuhr */}
        {show('duha') && (
          <SunnahAlignedRow
            icon="☀️" label={t.duha}
            checked={prayer.duhaDone} onChange={v => updatePrayer('duhaDone', v)}
            showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
            showMosque={!!gender}
            dir={dir}
          />
        )}

        {/* 3. Dhuhr (→ Jumu'ah on Friday), Asr, Maghrib, Isha */}
        {PRAYERS_MAIN.map(p => {
          const isJumuah = isFriday && p.key === 'dhuhr'
          return (
            <Fragment key={p.key}>
              <PrayerRow
                pKey={p.key}
                isMale={!!gender}
                hasBefore={p.hasBefore && show('sunnah_rawatib')}
                hasAfter={p.hasAfter && show('sunnah_rawatib')}
                hasAzkar={show('prayer_azkar')}
                rakaat={isJumuah ? 2 : p.rakaat}
                state={prayer}
                onChange={updatePrayer}
                onFardChange={updateFard}
                lang={lang}
                dir={dir}
                t={t}
                overrideLabel={isJumuah ? t.jumuah : undefined}
                overrideSub={isJumuah
                  ? (lang === 'ar' ? 'فرض · ٢ ركعات' : 'Fard · 2 rakaat')
                  : undefined}
              />
              {p.key === 'asr' && show('evening_azkar') && (
                <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3`}>
                  <span className="text-[14px] w-5 text-center flex-shrink-0">🌆</span>
                  <span className={`flex-1 text-[13px] text-gray-700 ${dir === 'rtl' ? 'text-right' : ''}`}>{t.evening}</span>
                  <div className={`flex items-center gap-2 flex-shrink-0`}>
                    <button onClick={onOpenEveningAzkar}
                      className="h-[26px] px-2 rounded-[8px] flex items-center gap-1 text-[10px] font-medium bg-blue-50 border border-blue-200 text-blue-500 active:bg-blue-100 flex-shrink-0">
                      <span>📖</span>
                      <span>{lang === 'ar' ? 'اقرأ' : 'Read'}</span>
                    </button>
                    <CheckBox checked={eveningAzkarDone} onChange={v => updateDhikr('eveningAzkarDone', v)} variant="azkar"/>
                  </div>
                </div>
              )}
            </Fragment>
          )
        })}

        {/* 4. Qiyam al-Layl — before Witr */}
        {show('qiyam') && (
          <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0">⭐</span>
            <div className="flex-1">
              <div className="text-[13px] text-gray-900">{t.qiyam}</div>
              <div className="text-[10px] text-gray-400 mt-[1px]">{t.qiyamS}</div>
            </div>
            <NumberInput value={prayer.qiyamRakaat} onChange={v => updatePrayer('qiyamRakaat', v)} placeholder="0"/>
          </div>
        )}

        {/* 5. Witr — after Qiyam */}
        {show('witr') && (
          <SunnahAlignedRow
            icon="🌙" label={t.witr}
            checked={prayer.witrDone} onChange={v => updatePrayer('witrDone', v)}
            showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
            showMosque={!!gender}
            dir={dir}
          />
        )}

        {/* After-salah Azkar — placed after Isha and the night prayers; per-prayer checkboxes stay in the rows above */}
        {show('prayer_azkar') && (
          <div className={`flex items-center px-[14px] py-[10px] border-t border-gray-100 gap-3`}>
            <span className="text-[14px] w-5 text-center flex-shrink-0">🤲</span>
            <span className={`flex-1 text-[13px] text-gray-700 ${dir === 'rtl' ? 'text-right' : ''}`}>{lang === 'ar' ? 'أذكار بعد الصلاة' : 'After-salah azkar'}</span>
            <div className={`flex items-center gap-2 flex-shrink-0`}>
              <button onClick={onOpenAfterSalahAzkar}
                className="h-[26px] px-2 rounded-[8px] flex items-center gap-1 text-[10px] font-medium bg-blue-50 border border-blue-200 text-blue-500 active:bg-blue-100 flex-shrink-0">
                <span>📖</span>
                <span>{lang === 'ar' ? 'اقرأ' : 'Read'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Jumu'ah is rendered inline as the Dhuhr row on Fridays — no separate row needed */}
      </div>
    </div>
  )
}
