// Configurable streak goal.
// The user picks which components a day must satisfy to keep their streak
// (see User.streakGoals). A day counts when every selected component is met.
// This is a pure function so it can be unit tested and reused.

export const STREAK_GOAL_KEYS = [
  'fard',
  'sunnah',
  'zikr',                    // post-prayer azkar
  'mosque',
  'qiyam_witr',
  'morning_evening_azkar',
  'quran',
] as const

export type StreakGoalKey = (typeof STREAK_GOAL_KEYS)[number]

export interface StreakDayData {
  prayer?: any
  dhikr?: any
  quran?: any
}

const FARDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

function componentMet(key: string, { prayer, dhikr, quran }: StreakDayData): boolean {
  switch (key) {
    case 'fard':
      return FARDS.every(p => prayer?.[`${p}Done`] || prayer?.[`${p}IsQada`])
    case 'sunnah':
      return ['fajrBefore', 'dhuhrBefore', 'dhuhrAfter', 'maghribAfter', 'ishaAfter'].every(s => prayer?.[s])
    case 'zikr':
      return ['fajrAzkar', 'dhuhrAzkar', 'asrAzkar', 'maghribAzkar', 'ishaAzkar'].every(s => prayer?.[s])
    case 'mosque':
      return FARDS.every(p => prayer?.[`${p}Mosque`])
    case 'qiyam_witr':
      return (prayer?.qiyamRakaat ?? 0) > 0 && !!prayer?.witrDone
    case 'morning_evening_azkar':
      return !!dhikr?.morningAzkarDone && !!dhikr?.eveningAzkarDone
    case 'quran':
      return (quran?.pagesRead ?? 0) > 0
    default:
      return true
  }
}

// A day meets the goal when every selected component is satisfied.
// Empty selection falls back to Fard so the streak never trivially counts every day.
export function computeStreakGoalMet(goals: string[] | null | undefined, data: StreakDayData): boolean {
  const selected = goals && goals.length > 0 ? goals : ['fard']
  return selected.every(g => componentMet(g, data))
}
