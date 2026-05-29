'use client'

import { useState, useEffect, useCallback } from 'react'

export type Period = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface ActivityStat {
  key: string
  nameEn: string
  nameAr: string
  category: string
  done: number
  total: number
  pct: number
  status: 'good' | 'warn' | 'bad'
}

export interface StreakStat {
  key: string
  nameEn: string
  nameAr: string
  current: number
  best: number
}

export interface SummaryData {
  period: Period
  totalDays: number
  overallScore: number
  overallStreak: { current: number; best: number }
  activities: ActivityStat[]
  streaks: StreakStat[]
  fasting: {
    ramadanDays: number
    mondayThursday: number
    whiteDays: number
    voluntary: number
    qadaRemaining: number
  }
}

export interface HeatmapDay {
  date: string
  hijriDay: number
  hijriMonth: number
  hijriYear: number
  pct: number
  level: 0 | 1 | 2 | 3
}

export interface TrendPoint {
  week: string
  istighfar: number
  salawat: number
}

export interface CounterData {
  istighfar: { today: number; week: number; month: number; allTime: number }
  salawat:   { today: number; week: number; month: number; allTime: number }
  trend: TrendPoint[]
}

export function useReports() {
  const [period, setPeriod]       = useState<Period>('weekly')
  const [summary, setSummary]     = useState<SummaryData | null>(null)
  const [heatmap, setHeatmap]     = useState<HeatmapDay[]>([])
  const [counters, setCounters]   = useState<CounterData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const fetchSummary = useCallback(async (p: Period) => {
    const res = await fetch(`/api/reporting/summary?period=${p}`)
    if (!res.ok) throw new Error('Failed to load summary')
    return res.json() as Promise<SummaryData>
  }, [])

  const fetchHeatmap = useCallback(async () => {
    const res = await fetch('/api/reporting/heatmap?months=3')
    if (!res.ok) throw new Error('Failed to load heatmap')
    const data = await res.json()
    return data.days as HeatmapDay[]
  }, [])

  const fetchCounters = useCallback(async () => {
    const res = await fetch('/api/reporting/counters')
    if (!res.ok) throw new Error('Failed to load counters')
    return res.json() as Promise<CounterData>
  }, [])

  // Load heatmap + counters once on mount
  useEffect(() => {
    Promise.all([fetchHeatmap(), fetchCounters()])
      .then(([h, c]) => { setHeatmap(h); setCounters(c) })
      .catch(e => setError(e.message))
  }, [fetchHeatmap, fetchCounters])

  // Reload summary when period changes
  useEffect(() => {
    setLoading(true)
    fetchSummary(period)
      .then(s => { setSummary(s); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [period, fetchSummary])

  return { period, setPeriod, summary, heatmap, counters, loading, error }
}
