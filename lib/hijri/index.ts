// Hijri Calendar Utility
// Handles all Hijri date conversions and seasonal triggers

// Using a lightweight algorithm for Hijri conversion
// For production, validate against an Islamic authority calendar

export interface HijriDate {
  year: number
  month: number
  day: number
  monthNameEn: string
  monthNameAr: string
}

export const HIJRI_MONTHS_EN = [
  '', 'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah'
]

export const HIJRI_MONTHS_AR = [
  '', 'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
]

// Gregorian to Hijri conversion (Kuwaiti algorithm)
export function toHijri(date: Date): HijriDate {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  let jd = Math.floor((14 - month) / 12)
  let y = year + 4800 - jd
  let m = month + 12 * jd - 3

  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  let l = jdn - 1948440 + 10632
  let n = Math.floor((l - 1) / 10631)
  l = l - 10631 * n + 354
  let j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238)
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  let hYear = 30 * n + j - 30
  let hMonth = Math.floor((24 * l) / 709)
  let hDay = l - Math.floor((709 * hMonth) / 24)

  return {
    year: hYear,
    month: hMonth,
    day: hDay,
    monthNameEn: HIJRI_MONTHS_EN[hMonth],
    monthNameAr: HIJRI_MONTHS_AR[hMonth],
  }
}

export function hijriToGregorian(hYear: number, hMonth: number, hDay: number): Date {
  let jdn = Math.floor((11 * hYear + 3) / 30) +
    354 * hYear + 30 * hMonth -
    Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385

  let l = jdn + 68569
  let n = Math.floor((4 * l) / 146097)
  l = l - Math.floor((146097 * n + 3) / 4)
  let i = Math.floor((4000 * (l + 1)) / 1461001)
  l = l - Math.floor((1461 * i) / 4) + 31
  let j = Math.floor((80 * l) / 2447)
  let day = l - Math.floor((2447 * j) / 80)
  l = Math.floor(j / 11)
  let month = j + 2 - 12 * l
  let year = 100 * (n - 49) + i + l

  return new Date(year, month - 1, day)
}

// ─── SEASONAL TRIGGERS ───────────────────────────────────

export function isRamadan(date: Date): boolean {
  const h = toHijri(date)
  return h.month === 9
}

export function isEidAlFitr(date: Date): boolean {
  const h = toHijri(date)
  return h.month === 10 && h.day === 1
}

export function isEidAlAdha(date: Date): boolean {
  const h = toHijri(date)
  return h.month === 12 && h.day === 10
}

export function isWhiteDay(date: Date): boolean {
  const h = toHijri(date)
  return [13, 14, 15].includes(h.day)
}

export function isFriday(date: Date): boolean {
  return date.getDay() === 5
}

export function isMondayOrThursday(date: Date): boolean {
  return date.getDay() === 1 || date.getDay() === 4
}

export function isFirstOfHijriMonth(date: Date): boolean {
  const h = toHijri(date)
  return h.day === 1
}

// Get all seasonal activities that should be visible today
export function getSeasonalActivities(date: Date): string[] {
  const active: string[] = []
  if (isRamadan(date)) active.push('taraweeh', 'ramadan_fast')
  if (isEidAlFitr(date)) active.push('eid_fitr_salat')
  if (isEidAlAdha(date)) active.push('eid_adha_salat')
  if (isFriday(date)) active.push('jumuah', 'surah_kahf')
  if (isMondayOrThursday(date)) active.push('monday_thursday_fast')
  if (isWhiteDay(date)) active.push('white_days_fast')
  return active
}

// Format Hijri date for display
export function formatHijri(h: HijriDate, lang: 'en' | 'ar' = 'en'): string {
  if (lang === 'ar') {
    const day = h.day.toLocaleString('ar-EG')
    const year = h.year.toLocaleString('ar-EG')
    return `${day} ${h.monthNameAr} ${year}`
  }
  return `${h.day} ${h.monthNameEn} ${h.year}`
}
