// Prayer times calculation — implements the adhan algorithm
// Works fully client-side, no API key needed

export type CalculationMethod =
  | 'MuslimWorldLeague'    // MWL — used in Europe, Far East
  | 'Egyptian'             // Egyptian General Authority — Egypt, Africa, Syria
  | 'Karachi'              // University of Islamic Sciences, Karachi — Pakistan, Bangladesh, India
  | 'UmmAlQura'            // Umm al-Qura University, Makkah — Saudi Arabia
  | 'Dubai'                // UAE
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'NorthAmerica'         // ISNA

export interface PrayerTimesResult {
  fajr:    Date
  sunrise: Date
  dhuhr:   Date
  asr:     Date
  maghrib: Date
  isha:    Date
}

// Calculation parameters per method
const PARAMS: Record<CalculationMethod, { fajrAngle: number; ishaAngle: number; asrFactor?: number }> = {
  MuslimWorldLeague: { fajrAngle: 18, ishaAngle: 17 },
  Egyptian:          { fajrAngle: 19.5, ishaAngle: 17.5 },
  Karachi:           { fajrAngle: 18, ishaAngle: 18 },
  UmmAlQura:         { fajrAngle: 18.5, ishaAngle: 0 },   // isha = 90 min after maghrib
  Dubai:             { fajrAngle: 18.2, ishaAngle: 18.2 },
  Kuwait:            { fajrAngle: 18, ishaAngle: 17.5 },
  Qatar:             { fajrAngle: 18, ishaAngle: 0 },      // isha = 90 min after maghrib
  Singapore:         { fajrAngle: 20, ishaAngle: 18 },
  NorthAmerica:      { fajrAngle: 15, ishaAngle: 15 },
}

function toRad(deg: number) { return deg * Math.PI / 180 }
function toDeg(rad: number) { return rad * 180 / Math.PI }

function julianDay(date: Date): number {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return Math.trunc(365.25 * (y + 4716)) + Math.trunc(30.6001 * (m + 1)) + d - 1524.5 +
    (m <= 2 ? -1 : 0) * (Math.trunc(y / 100) - Math.trunc(y / 400) - 2)
}

function sunPosition(jd: number): { declination: number; equationOfTime: number } {
  const d = jd - 2451545.0
  const g = (357.529 + 0.98560028 * d) % 360
  const q = (280.459 + 0.98564736 * d) % 360
  const l = (q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g))) % 360
  const e = 23.439 - 0.00000036 * d
  const ra = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(l)), Math.cos(toRad(l)))) / 15
  const declination = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(l))))
  const equationOfTime = q / 15 - ((ra % 24 + 24) % 24)
  return { declination, equationOfTime }
}

function hourAngle(lat: number, dec: number, targetDeg: number): number {
  const cosH = (Math.cos(toRad(90 + targetDeg)) - Math.sin(toRad(dec)) * Math.sin(toRad(lat))) /
               (Math.cos(toRad(dec)) * Math.cos(toRad(lat)))
  if (cosH > 1)  return 0   // never sets
  if (cosH < -1) return 12  // never rises
  return toDeg(Math.acos(cosH)) / 15
}

function asrHourAngle(lat: number, dec: number, factor: number): number {
  const target = -toDeg(Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - dec))))))
  return hourAngle(lat, dec, target)
}

function timeToDate(base: Date, hours: number, utcOffset: number): Date {
  const d = new Date(base)
  d.setHours(0, 0, 0, 0)
  const ms = (hours - utcOffset) * 3600000
  return new Date(d.getTime() + ms)
}

export function calculatePrayerTimes(
  date:      Date,
  latitude:  number,
  longitude: number,
  method:    CalculationMethod = 'Egyptian',
  utcOffset?: number,
): PrayerTimesResult {
  const offset = utcOffset ?? -(date.getTimezoneOffset() / 60)
  const jd     = julianDay(date)
  const { declination: dec, equationOfTime: eot } = sunPosition(jd)
  const p      = PARAMS[method]

  // Solar noon (local apparent solar time)
  const noon = 12 - longitude / 15 - eot + offset

  // Prayer times in decimal hours (local time)
  const fajrHours    = noon - hourAngle(latitude, dec, p.fajrAngle)
  const sunriseHours = noon - hourAngle(latitude, dec, 0.833)
  const dhuhrHours   = noon + 0.017  // slightly after solar noon
  const asrHours     = noon + asrHourAngle(latitude, dec, 1) // Standard (Shafi'i)
  const maghribHours = noon + hourAngle(latitude, dec, 0.833)
  let   ishaHours: number

  if (p.ishaAngle === 0) {
    // Fixed interval (UmmAlQura, Qatar)
    ishaHours = maghribHours + 1.5
  } else {
    ishaHours = noon + hourAngle(latitude, dec, p.ishaAngle)
  }

  return {
    fajr:    timeToDate(date, fajrHours,    offset),
    sunrise: timeToDate(date, sunriseHours, offset),
    dhuhr:   timeToDate(date, dhuhrHours,   offset),
    asr:     timeToDate(date, asrHours,     offset),
    maghrib: timeToDate(date, maghribHours, offset),
    isha:    timeToDate(date, ishaHours,    offset),
  }
}

// Format a Date as HH:MM string
export function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Get minutes until next prayer
export function minutesUntilPrayer(times: PrayerTimesResult): { name: string; minutes: number } | null {
  const now    = new Date()
  const order  = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
  for (const name of order) {
    const diff = Math.round((times[name].getTime() - now.getTime()) / 60000)
    if (diff > 0) return { name, minutes: diff }
  }
  return null  // all prayers passed — next is tomorrow's Fajr
}

// Country → default calculation method
export const COUNTRY_METHOD: Record<string, CalculationMethod> = {
  SA: 'UmmAlQura', AE: 'Dubai', KW: 'Kuwait', BH: 'UmmAlQura',
  QA: 'Qatar',     OM: 'UmmAlQura', YE: 'UmmAlQura',
  EG: 'Egyptian',  LY: 'Egyptian', SD: 'Egyptian',
  JO: 'MuslimWorldLeague', SY: 'MuslimWorldLeague', LB: 'MuslimWorldLeague',
  PS: 'MuslimWorldLeague', IQ: 'MuslimWorldLeague',
  TN: 'MuslimWorldLeague', DZ: 'MuslimWorldLeague', MA: 'MuslimWorldLeague',
  MR: 'MuslimWorldLeague',
  TR: 'MuslimWorldLeague',
  IR: 'Karachi',
  PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
  ID: 'Karachi', MY: 'Singapore', SG: 'Singapore',
  US: 'NorthAmerica', CA: 'NorthAmerica',
  GB: 'MuslimWorldLeague', FR: 'MuslimWorldLeague', DE: 'MuslimWorldLeague',
}
