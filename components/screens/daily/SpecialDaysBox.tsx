'use client'

// BOX 6: Special Days — seasonal prayers (Taraweeh, Eid al-Fitr, Eid al-Adha).

import SunnahAlignedRow from './SunnahAlignedRow'
import SectionLabel from './SectionLabel'
import type { PrayerState, Lang, Dir, TDict } from './translations'

export default function SpecialDaysBox({
  t, lang, dir, gender, show, seasonal, isRamadan,
  prayer, updatePrayer,
}: {
  t: TDict
  lang: Lang
  dir: Dir
  gender: string | null
  show: (key: string) => boolean
  seasonal: string[]
  isRamadan: boolean
  prayer: PrayerState
  updatePrayer: (key: string, val: boolean | number) => void
}) {
  const visible =
    (show('taraweeh') && isRamadan) ||
    (show('eid_fitr') && seasonal.includes('eid_fitr')) ||
    (show('eid_adha') && seasonal.includes('eid_adha'))
  if (!visible) return null

  return (
    <div className="mx-4 mt-3">
      <SectionLabel text={lang === 'ar' ? 'أيام خاصة' : 'Special Days'} dir={dir}/>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        {show('taraweeh') && isRamadan && (
          <SunnahAlignedRow
            icon="🌙" label={t.taraweeh}
            checked={prayer.taraweehDone ?? false} onChange={v => updatePrayer('taraweehDone', v)}
            showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
            showMosque={!!gender}
            dir={dir}
          />
        )}
        {show('eid_fitr') && seasonal.includes('eid_fitr') && (
          <SunnahAlignedRow
            icon="🎉" label={t.eidFitr}
            checked={prayer.eidFitrDone ?? false} onChange={v => updatePrayer('eidFitrDone', v)}
            showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
            showMosque={!!gender}
            dir={dir}
          />
        )}
        {show('eid_adha') && seasonal.includes('eid_adha') && (
          <SunnahAlignedRow
            icon="🎉" label={t.eidAdha}
            checked={prayer.eidAdhaDone ?? false} onChange={v => updatePrayer('eidAdhaDone', v)}
            showSunnah={show('sunnah_rawatib')} showAzkar={show('prayer_azkar')}
            showMosque={!!gender}
            dir={dir}
          />
        )}
      </div>
    </div>
  )
}
