'use client'

// All state + persistence for the Daily Entry screen.
// Components render; this hook owns the data and talks to /api/activities/*.

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import type { PrayerState, AzkarDef } from '@/components/screens/daily/translations'

// Format a Date as local YYYY-MM-DD (not toISOString, which shifts to UTC)
export function toLocalIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface DailyEntryInitial {
  initialPrayer?: any
  initialDhikr?: any
  initialQuran?: any
  initialFasting?: any
  initialSadaqah?: any
  initialQada?: number
  initialIsPeriod?: boolean
}

export function useDailyEntryState(today: Date, init: DailyEntryInitial) {
  const {
    initialPrayer, initialDhikr, initialQuran, initialFasting, initialSadaqah,
    initialQada = 0, initialIsPeriod = false,
  } = init

  const { lang } = useLang()

  // ── Prayer state — unified structure
  const [prayer, setPrayer] = useState<PrayerState>({
    fajrDone:     initialPrayer?.fajrDone     ?? false,
    fajrIsQada:   initialPrayer?.fajrIsQada   ?? false,
    dhuhrDone:    initialPrayer?.dhuhrDone    ?? false,
    dhuhrIsQada:  initialPrayer?.dhuhrIsQada  ?? false,
    asrDone:      initialPrayer?.asrDone      ?? false,
    asrIsQada:    initialPrayer?.asrIsQada    ?? false,
    maghribDone:  initialPrayer?.maghribDone  ?? false,
    maghribIsQada:initialPrayer?.maghribIsQada ?? false,
    ishaDone:     initialPrayer?.ishaDone     ?? false,
    ishaIsQada:   initialPrayer?.ishaIsQada   ?? false,
    fajrMosque:    initialPrayer?.fajrMosque    ?? false,
    dhuhrMosque:   initialPrayer?.dhuhrMosque   ?? false,
    asrMosque:     initialPrayer?.asrMosque     ?? false,
    maghribMosque: initialPrayer?.maghribMosque ?? false,
    ishaMosque:    initialPrayer?.ishaMosque    ?? false,
    fajrBefore:   initialPrayer?.fajrBefore   ?? false,
    dhuhrBefore:  initialPrayer?.dhuhrBefore  ?? false,
    dhuhrAfter:   initialPrayer?.dhuhrAfter   ?? false,
    maghribAfter: initialPrayer?.maghribAfter ?? false,
    ishaAfter:    initialPrayer?.ishaAfter    ?? false,
    fajrAzkar:    initialPrayer?.fajrAzkar    ?? false,
    dhuhrAzkar:   initialPrayer?.dhuhrAzkar   ?? false,
    asrAzkar:     initialPrayer?.asrAzkar     ?? false,
    maghribAzkar: initialPrayer?.maghribAzkar ?? false,
    ishaAzkar:    initialPrayer?.ishaAzkar    ?? false,
    duhaDone:     initialPrayer?.duhaDone     ?? false,
    witrDone:     initialPrayer?.witrDone     ?? false,
    qiyamRakaat:  initialPrayer?.qiyamRakaat  ?? 0,
  })

  // ── Dhikr state
  const [dhikr, setDhikr] = useState({
    morningAzkarDone: initialDhikr?.morningAzkarDone ?? false,
    eveningAzkarDone: initialDhikr?.eveningAzkarDone ?? false,
    istighfarCount:   initialDhikr?.istighfarCount   ?? 0,
    salawatCount:     initialDhikr?.salawatCount     ?? 0,
    tasbihCount:      initialDhikr?.tasbihCount      ?? 0,
  })

  // ── Quran state
  const [quran, setQuran] = useState({ pagesRead: initialQuran?.pagesRead ?? 0, kahfDone: initialQuran?.kahfDone ?? false })
  const [surahChecks, setSurahChecks] = useState<Record<string, boolean>>(
    Object.fromEntries((initialQuran?.surahChecks ?? []).map((c: any) => [c.userSurahId, c.isDone]))
  )

  // ── Fasting state
  const [fasting, setFasting] = useState({
    isFasting: initialFasting?.isFasting ?? false,
    fastingType: initialFasting?.fastingType ?? 'VOLUNTARY',
    isQada: initialFasting?.isQada ?? false,
    comment: initialFasting?.comment ?? '',
  })
  const [qadaRemaining, setQadaRemaining] = useState(initialQada)

  // ── Sadaqah state
  const [sadaqah, setSadaqah] = useState({ gave: initialSadaqah?.gave ?? false, amount: initialSadaqah?.amount ?? '' })

  // ── Period state (female users only)
  const [isPeriod, setIsPeriod] = useState(initialIsPeriod)

  // ── Azkar definitions for the read overlays
  const [morningAzkarDefs, setMorningAzkarDefs] = useState<AzkarDef[]>([])
  const [eveningAzkarDefs, setEveningAzkarDefs] = useState<AzkarDef[]>([])

  useEffect(() => {
    const L = lang === 'ar' ? 'AR' : 'EN'
    Promise.all([
      fetch(`/api/azkar?category=MORNING&language=${L}`).then(r => r.json()),
      fetch(`/api/azkar?category=EVENING&language=${L}`).then(r => r.json()),
    ]).then(([m, e]) => {
      setMorningAzkarDefs(m.azkar ?? [])
      setEveningAzkarDefs(e.azkar ?? [])
    }).catch(() => {})
  }, [lang])

  // ── Save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<NodeJS.Timeout>()
  const dateIso = toLocalIso(today)

  const save = useCallback(async (section: string, data: any) => {
    setSaveStatus('saving')
    try {
      await fetch(`/api/activities/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateIso, ...data }),
      })
      setSaveStatus('saved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000)
    } catch { setSaveStatus('idle') }
  }, [dateIso])

  const debounce = useCallback((section: string, data: any) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(section, data), 800)
  }, [save])

  // ── Handlers
  const updatePrayer = (key: string, val: boolean | number) => {
    const next = { ...prayer, [key]: val }
    setPrayer(next)
    debounce('prayer', next)
  }

  // Atomic fard update — sets Done + IsQada in one setState to avoid stale closure overwrite
  const updateFard = useCallback((pKey: string, done: boolean, isQada: boolean) => {
    setPrayer(prev => {
      const next = { ...prev, [`${pKey}Done`]: done, [`${pKey}IsQada`]: isQada }
      debounce('prayer', next)
      return next
    })
  }, [debounce])

  const updateDhikr = (key: string, val: boolean | number) => {
    const next = { ...dhikr, [key]: val }
    setDhikr(next)
    debounce('dhikr', next)
  }

  const updateQuran = (key: string, val: any) => {
    const next = { ...quran, [key]: val }
    setQuran(next)
    debounce('quran', { ...next, surahChecks: Object.entries(surahChecks).map(([id, done]) => ({ userSurahId: id, isDone: done })) })
  }

  const updateSurah = (id: string, val: boolean) => {
    const next = { ...surahChecks, [id]: val }
    setSurahChecks(next)
    debounce('quran', { ...quran, surahChecks: Object.entries(next).map(([surahId, done]) => ({ userSurahId: surahId, isDone: done })) })
  }

  const updateFasting = (patch: Partial<typeof fasting>) => {
    const next = { ...fasting, ...patch }
    setFasting(next)
    debounce('fasting', next)
  }

  const markAsQada = async () => {
    const next = { ...fasting, isFasting: true, isQada: true }
    setFasting(next)
    const res = await fetch('/api/activities/fasting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateIso, ...next }),
    })
    const data = await res.json()
    if (data.qadaRemaining !== undefined) setQadaRemaining(data.qadaRemaining)
  }

  const updateSadaqah = (key: string, val: any) => {
    const next = { ...sadaqah, [key]: val }
    setSadaqah(next)
    debounce('sadaqah', next)
  }

  const togglePeriod = async () => {
    const next = !isPeriod
    setIsPeriod(next)
    await fetch('/api/activities/period', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateIso, isPeriod: next }),
    })
  }

  return {
    // state
    prayer, dhikr, quran, surahChecks, fasting, qadaRemaining, sadaqah,
    isPeriod, saveStatus, morningAzkarDefs, eveningAzkarDefs,
    // handlers
    updatePrayer, updateFard, updateDhikr, updateQuran, updateSurah,
    updateFasting, markAsQada, updateSadaqah, togglePeriod,
  }
}
