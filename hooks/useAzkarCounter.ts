'use client'

// Per-dhikr countdown for the morning / evening azkar overlay.
// Counts live in localStorage keyed by date + category, so they survive
// closing the app and reset on their own at the next day's start (new date key).

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface CountDef {
  id: string
  repetitions: number
}

const keyFor = (date: string, category: string) => `yw_azkar_count_${date}_${category}`

export function useAzkarCounter(date: string, category: string, defs: CountDef[]) {
  const storageKey = keyFor(date, category)
  // Stable signature so we only re-init when the actual definitions change,
  // not on every render (defs is a fresh array reference each time).
  const defsSig = useMemo(
    () => defs.map(d => `${d.id}:${d.repetitions}`).join('|'),
    [defs],
  )

  const [counts, setCounts] = useState<Record<string, number>>({})

  // Keep latest defs available to callbacks without retriggering them.
  const defsRef = useRef(defs)
  defsRef.current = defs
  const repFor = (id: string) => defsRef.current.find(d => d.id === id)?.repetitions ?? 0

  useEffect(() => {
    let stored: Record<string, number> = {}
    try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}') } catch {}
    const init: Record<string, number> = {}
    defs.forEach(d => { init[d.id] = (d.id in stored) ? stored[d.id] : d.repetitions })
    setCounts(init)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, defsSig])

  const persist = useCallback((next: Record<string, number>) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }, [storageKey])

  // Decrement one rep (no-op if already at zero).
  const dec = useCallback((id: string) => {
    setCounts(prev => {
      const cur = (id in prev) ? prev[id] : repFor(id)
      if (cur <= 0) return prev
      const next = { ...prev, [id]: cur - 1 }
      persist(next)
      return next
    })
  }, [persist])

  const reset = useCallback((id: string) => {
    setCounts(prev => {
      const next = { ...prev, [id]: repFor(id) }
      persist(next)
      return next
    })
  }, [persist])

  const remaining = (id: string) => (id in counts) ? counts[id] : repFor(id)

  const allDone = defs.length > 0 && defs.every(d => remaining(d.id) <= 0)

  return { counts, remaining, dec, reset, allDone }
}
