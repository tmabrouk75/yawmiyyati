// Translations + prayer configuration + shared types for the Daily Entry screen.
// Pure data and pure functions only — no React, no side effects.

export const T = {
  en: {
    today: 'Today', salah: 'Salah', dhikr: 'Dhikr & Azkar',
    quran: 'Quran', fasting: 'Fasting', sadaqah: 'Sadaqah',
    // Prayer labels
    fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
    // Column headers
    sunBef: 'Sunnah\nBefore', fard: 'Fard', sunAft: 'Sunnah\nAfter', azkar: 'Azkar',
    // Other salah
    duha: 'Duha', witr: 'Witr',
    qiyam: 'Qiyam al-Layl', qiyamS: 'Enter rakaat count',
    jumuah: "Jumu'ah", taraweeh: 'Taraweeh',
    eidFitr: 'Eid al-Fitr Salat', eidAdha: 'Eid al-Adha Salat',
    // Dhikr
    morning: 'Morning Azkar', evening: 'Evening Azkar',
    istighfar: 'Istighfar', istighfarS: "Enter today's count",
    salawat: 'Salawat ﷺ', salawatS: "Enter today's count",
    tasbih: 'Tasbih (33×3)', tasbihS: 'Total count today',
    // Quran
    pages: 'Quran Reading', pagesS: 'Pages today',
    surahs: 'Daily Surahs',
    // Fasting
    fastToday: 'Fasting today', fastMon: 'Monday · Sunnah fast',
    fastThu: 'Thursday · Sunnah fast', fastRam: 'Ramadan fasting',
    fastWhite: 'White Days fast', fastVol: 'Voluntary fast',
    fastQada: 'Qadaa fast (making up missed)',
    qada: "Ramadan Qada'",
    qdaRemaining: (n: number) => `${n} day${n !== 1 ? 's' : ''} remaining`,
    qdaCountBtn: "Count today as Qada'",
    // Sadaqah
    sadaqahLabel: 'Gave Sadaqah today', amountPh: 'Amount (optional)',
    saving: 'Saving...', saved: 'Saved ✓',
    period: 'Days of Special Time', periodSub: 'Prayers are exempt · streak protected',
  },
  ar: {
    today: 'اليوم', salah: 'الصلاة', dhikr: 'الذكر والأذكار',
    quran: 'القرآن الكريم', fasting: 'الصيام', sadaqah: 'الصدقة',
    fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
    sunBef: 'سنة\nقبل', fard: 'فرض', sunAft: 'سنة\nبعد', azkar: 'أذكار',
    duha: 'الضحى', witr: 'الوتر',
    qiyam: 'قيام الليل', qiyamS: 'أدخل عدد الركعات',
    jumuah: 'الجمعة', taraweeh: 'التراويح',
    eidFitr: 'صلاة عيد الفطر', eidAdha: 'صلاة عيد الأضحى',
    morning: 'أذكار الصباح', evening: 'أذكار المساء',
    istighfar: 'الاستغفار', istighfarS: 'أدخل عدد اليوم',
    salawat: 'الصلاة على النبي ﷺ', salawatS: 'أدخل عدد اليوم',
    tasbih: 'التسبيح (٣٣×٣)', tasbihS: 'العدد الإجمالي اليوم',
    pages: 'تلاوة القرآن', pagesS: 'عدد الصفحات اليوم',
    surahs: 'السور اليومية',
    fastToday: 'الصيام اليوم', fastMon: 'الاثنين · صيام سنة',
    fastThu: 'الخميس · صيام سنة', fastRam: 'صيام رمضان',
    fastWhite: 'صيام الأيام البيض', fastVol: 'صيام تطوع',
    fastQada: 'صيام قضاء (تعويض فائت)',
    qada: 'قضاء رمضان',
    qdaRemaining: (n: number) => `${n} أيام متبقية`,
    qdaCountBtn: 'احتساب اليوم قضاءً',
    sadaqahLabel: 'تصدّقت اليوم', amountPh: 'المبلغ (اختياري)',
    saving: 'جارٍ الحفظ...', saved: 'تم الحفظ ✓',
    period: 'أيام الظروف الخاصة', periodSub: 'الصلاة معفو عنها · السلسلة محفوظة',
  },
}

export type Lang = 'en' | 'ar'
export type Dir = 'ltr' | 'rtl'
export type TDict = typeof T['en']

// ─── PRAYER CONFIG ────────────────────────────────────────
// hasBefore / hasAfter: whether this prayer has confirmed sunnah rawatib

export const PRAYERS_FAJR = [
  { key: 'fajr',    hasBefore: true,  hasAfter: false, rakaat: 2  },
] as const

export const PRAYERS_MAIN = [
  { key: 'dhuhr',   hasBefore: true,  hasAfter: true,  rakaat: 4  },
  { key: 'asr',     hasBefore: false, hasAfter: false, rakaat: 4  },
  { key: 'maghrib', hasBefore: false, hasAfter: true,  rakaat: 3  },
  { key: 'isha',    hasBefore: false, hasAfter: true,  rakaat: 4  },
] as const

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

// ─── STATE SHAPES ─────────────────────────────────────────

export interface PrayerState {
  // Fard state (3-state each)
  fajrDone:     boolean; fajrIsQada:    boolean
  dhuhrDone:    boolean; dhuhrIsQada:   boolean
  asrDone:      boolean; asrIsQada:     boolean
  maghribDone:  boolean; maghribIsQada: boolean
  ishaDone:     boolean; ishaIsQada:    boolean
  // Mosque (Jama'ah) — male users only
  fajrMosque:    boolean
  dhuhrMosque:   boolean
  asrMosque:     boolean
  maghribMosque: boolean
  ishaMosque:    boolean
  // Sunnah rawatib
  fajrBefore:   boolean
  dhuhrBefore:  boolean; dhuhrAfter:    boolean
  maghribAfter: boolean
  ishaAfter:    boolean
  // Azkar per prayer
  fajrAzkar:    boolean
  dhuhrAzkar:   boolean
  asrAzkar:     boolean
  maghribAzkar: boolean
  ishaAzkar:    boolean
  // Other
  duhaDone:    boolean
  witrDone:    boolean
  qiyamRakaat: number
  // Special prayers
  taraweehDone?: boolean
  eidFitrDone?:  boolean
  eidAdhaDone?:  boolean
}

export interface AzkarDef {
  id: string
  textAr: string
  transliteration?: string | null
  translationEn: string | null
  translationAr: string | null
  repetitions: number
}
