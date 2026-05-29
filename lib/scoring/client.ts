// Client-side score calculator — mirrors the server XP engine
// Used to show live score on Today screen without a round-trip

export interface ScoreBreakdown {
  salah:   number
  sunnah:  number
  azkar:   number
  dhikr:   number
  quran:   number
  fasting: number
  sadaqah: number
  mosque:  number   // 10 pts per fard prayer in mosque (male users)
  bonus:   number
  streak:  number
  total:   number
}

const SCORE = {
  fard:              20,
  fard_qadaa:        10,
  sunnah_slot:        4,
  azkar_slot:         4,
  morning_azkar:      4,
  evening_azkar:      4,
  tasbih_per_10:      1,
  tasbih_max:        10,
  quran_any:          5,
  fasting:           15,
  sadaqah:            5,
  witr:               3,
  duha:               4,
  qiyam_any:         10,
  mosque_per_prayer: 10,  // per fard prayer checked as mosque
  perfect_day:       25,
  streak_per_day:    10,  // per streak day
  streak_7plus:      10,  // bonus at 7-day milestone
  streak_30plus:     10,  // bonus at 30-day milestone
}

export function computeDayScore(
  prayer:    any,
  dhikr:     any,
  quran:     any,
  fasting:   any,
  sadaqah:   any,
  streakDays: number,
  enabledKeys: Set<string>,
): ScoreBreakdown {

  let salah    = 0
  let sunnah   = 0
  let azkar    = 0
  let dhikrPts = 0
  let quranPts = 0
  let fastPts  = 0
  let sadPts   = 0
  let mosquePts = 0
  let bonus    = 0
  let streak   = 0

  // ── Salah Fard — 0 if any missed entirely
  const FARDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
  const anyMissed = FARDS.some(p =>
    !prayer?.[`${p}Done`] && !prayer?.[`${p}IsQada`]
  )

  if (!anyMissed) {
    for (const p of FARDS) {
      salah += prayer?.[`${p}IsQada`] ? SCORE.fard_qadaa : SCORE.fard
    }
  }

  // ── Sunnah rawatib
  if (enabledKeys.has('sunnah_rawatib')) {
    const slots = ['fajrBefore','dhuhrBefore','dhuhrAfter','maghribAfter','ishaAfter']
    for (const slot of slots) {
      if (prayer?.[slot]) sunnah += SCORE.sunnah_slot
    }
  }

  // ── Post-prayer azkar
  if (enabledKeys.has('prayer_azkar')) {
    const azkarSlots = ['fajrAzkar','dhuhrAzkar','asrAzkar','maghribAzkar','ishaAzkar']
    for (const slot of azkarSlots) {
      if (prayer?.[slot]) azkar += SCORE.azkar_slot
    }
  }

  // ── Duha / Witr / Qiyam
  if (enabledKeys.has('duha')  && prayer?.duhaDone)         salah += SCORE.duha
  if (enabledKeys.has('witr')  && prayer?.witrDone)         salah += SCORE.witr
  if (enabledKeys.has('qiyam') && (prayer?.qiyamRakaat > 0)) salah += SCORE.qiyam_any

  // ── Dhikr
  if (enabledKeys.has('morning_azkar') && dhikr?.morningAzkarDone) dhikrPts += SCORE.morning_azkar
  if (enabledKeys.has('evening_azkar') && dhikr?.eveningAzkarDone) dhikrPts += SCORE.evening_azkar
  if (enabledKeys.has('tasbih') && (dhikr?.tasbihCount > 0)) {
    dhikrPts += Math.min(SCORE.tasbih_max, Math.floor(dhikr.tasbihCount / 10))
  }

  // ── Quran
  if (enabledKeys.has('quran_pages') && (quran?.pagesRead > 0)) quranPts += SCORE.quran_any

  // ── Fasting
  if (fasting?.isFasting) fastPts += SCORE.fasting

  // ── Sadaqah
  if (enabledKeys.has('sadaqah') && sadaqah?.gave) sadPts += SCORE.sadaqah

  // ── Mosque (Jama'ah) — 10 pts per fard prayer checked as in-mosque
  for (const p of FARDS) {
    if (prayer?.[`${p}Mosque`]) mosquePts += SCORE.mosque_per_prayer
  }

  // ── Perfect day bonus (salah-based)
  const allFardDone    = !anyMissed
  const sunnahComplete = !enabledKeys.has('sunnah_rawatib') ||
    ['fajrBefore','dhuhrBefore','dhuhrAfter','maghribAfter','ishaAfter'].every(s => prayer?.[s])
  const witrDone  = !enabledKeys.has('witr')  || prayer?.witrDone
  const qiyamDone = !enabledKeys.has('qiyam') || (prayer?.qiyamRakaat > 0)
  const salahPerfect = allFardDone && sunnahComplete && witrDone && qiyamDone

  if (salahPerfect) bonus += SCORE.perfect_day

  // ── Streak bonus: flat 10 pts/day + milestone bonuses (not accumulated across days)
  // Day 1–6:  10
  // Day 7–29: 10 + 10 = 20
  // Day 30+:  10 + 10 + 10 = 30
  if (streakDays >= 1) {
    streak += SCORE.streak_per_day
    if (streakDays >= 7)  streak += SCORE.streak_7plus
    if (streakDays >= 30) streak += SCORE.streak_30plus
  }

  const total = salah + sunnah + azkar + dhikrPts + quranPts + fastPts + sadPts + mosquePts + bonus + streak

  return {
    salah,
    sunnah,
    azkar,
    dhikr:   dhikrPts,
    quran:   quranPts,
    fasting: fastPts,
    sadaqah: sadPts,
    mosque:  mosquePts,
    bonus,
    streak,
    total,
  }
}

export function getSalahPerfect(prayer: any, enabledKeys: Set<string>): boolean {
  const FARDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
  const allFard = FARDS.every(p => prayer?.[`${p}Done`] || prayer?.[`${p}IsQada`])
  if (!allFard) return false
  if (enabledKeys.has('sunnah_rawatib')) {
    const slots = ['fajrBefore','dhuhrBefore','dhuhrAfter','maghribAfter','ishaAfter']
    if (!slots.every(s => prayer?.[s])) return false
  }
  if (enabledKeys.has('witr')  && !prayer?.witrDone)       return false
  if (enabledKeys.has('qiyam') && !(prayer?.qiyamRakaat > 0)) return false
  return true
}
