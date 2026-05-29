// Default activity definitions — seeded once into the database
// Run: npm run db:seed

export const DEFAULT_ACTIVITIES = [
  // ─── SALAH ───────────────────────────────────────────────
  { key: 'fajr',         nameEn: 'Fajr',           nameAr: 'الفجر',           category: 'SALAH',   trackingType: 'CHECKBOX',      defaultOn: true,  sortOrder: 1 },
  { key: 'dhuhr',        nameEn: 'Dhuhr',          nameAr: 'الظهر',           category: 'SALAH',   trackingType: 'SUNNAH_TRIPLE', defaultOn: true,  sortOrder: 2 },
  { key: 'asr',          nameEn: 'Asr',            nameAr: 'العصر',           category: 'SALAH',   trackingType: 'CHECKBOX',      defaultOn: true,  sortOrder: 3 },
  { key: 'maghrib',      nameEn: 'Maghrib',        nameAr: 'المغرب',          category: 'SALAH',   trackingType: 'SUNNAH_TRIPLE', defaultOn: true,  sortOrder: 4 },
  { key: 'isha',         nameEn: 'Isha',           nameAr: 'العشاء',          category: 'SALAH',   trackingType: 'SUNNAH_TRIPLE', defaultOn: true,  sortOrder: 5 },
  { key: 'duha',         nameEn: 'Duha Prayer',    nameAr: 'صلاة الضحى',      category: 'SALAH',   trackingType: 'CHECKBOX',      defaultOn: false, sortOrder: 6 },
  { key: 'witr',         nameEn: 'Witr',           nameAr: 'الوتر',           category: 'SALAH',   trackingType: 'CHECKBOX',      defaultOn: false, sortOrder: 7 },
  { key: 'qiyam',        nameEn: 'Qiyam al-Layl',  nameAr: 'قيام الليل',      category: 'SALAH',   trackingType: 'NUMBER_INPUT',  defaultOn: false, sortOrder: 8 },
  { key: 'jumuah',       nameEn: "Jumu'ah",        nameAr: 'الجمعة',          category: 'SALAH',   trackingType: 'CHECKBOX',      defaultOn: true,  sortOrder: 9 },
  { key: 'taraweeh',     nameEn: 'Taraweeh',       nameAr: 'التراويح',        category: 'SALAH',   trackingType: 'CHECKBOX',      defaultOn: false, sortOrder: 10 },
  { key: 'eid_fitr',     nameEn: 'Eid al-Fitr Salat', nameAr: 'صلاة عيد الفطر', category: 'SALAH', trackingType: 'CHECKBOX',    defaultOn: false, sortOrder: 11 },
  { key: 'eid_adha',     nameEn: 'Eid al-Adha Salat', nameAr: 'صلاة عيد الأضحى', category: 'SALAH', trackingType: 'CHECKBOX',  defaultOn: false, sortOrder: 12 },

  // ─── DHIKR ───────────────────────────────────────────────
  { key: 'morning_azkar', nameEn: 'Morning Azkar', nameAr: 'أذكار الصباح',    category: 'DHIKR',   trackingType: 'CHECKBOX',      defaultOn: true,  sortOrder: 13 },
  { key: 'evening_azkar', nameEn: 'Evening Azkar', nameAr: 'أذكار المساء',    category: 'DHIKR',   trackingType: 'CHECKBOX',      defaultOn: true,  sortOrder: 14 },
  { key: 'istighfar',    nameEn: 'Istighfar',      nameAr: 'الاستغفار',       category: 'DHIKR',   trackingType: 'NUMBER_INPUT',  defaultOn: false, sortOrder: 15 },
  { key: 'salawat',      nameEn: 'Salawat ﷺ',      nameAr: 'الصلاة على النبي ﷺ', category: 'DHIKR', trackingType: 'NUMBER_INPUT', defaultOn: false, sortOrder: 16 },

  // ─── QURAN ───────────────────────────────────────────────
  { key: 'quran_pages',  nameEn: 'Quran Reading',  nameAr: 'تلاوة القرآن',    category: 'QURAN',   trackingType: 'PAGES',         defaultOn: true,  sortOrder: 17 },
  { key: 'daily_surahs', nameEn: 'Daily Surahs',   nameAr: 'السور اليومية',   category: 'QURAN',   trackingType: 'CHECKBOX',      defaultOn: false, sortOrder: 18 },
  { key: 'surah_kahf',   nameEn: 'Surah Al-Kahf',  nameAr: 'سورة الكهف',      category: 'QURAN',   trackingType: 'CHECKBOX',      defaultOn: false, sortOrder: 19 },

  // ─── FASTING ─────────────────────────────────────────────
  { key: 'ramadan_fast',     nameEn: 'Ramadan Fasting',        nameAr: 'صيام رمضان',     category: 'FASTING', trackingType: 'CHECKBOX', defaultOn: false, sortOrder: 20 },
  { key: 'monday_thursday',  nameEn: 'Monday / Thursday Fast', nameAr: 'صيام الاثنين والخميس', category: 'FASTING', trackingType: 'CHECKBOX', defaultOn: false, sortOrder: 21 },
  { key: 'white_days',       nameEn: 'White Days Fast',        nameAr: 'صيام الأيام البيض',    category: 'FASTING', trackingType: 'CHECKBOX', defaultOn: false, sortOrder: 22 },
  { key: 'voluntary_fast',   nameEn: 'Voluntary Fast',         nameAr: 'صيام تطوع',             category: 'FASTING', trackingType: 'CHECKBOX', defaultOn: false, sortOrder: 23 },

  // ─── SADAQAH ─────────────────────────────────────────────
  { key: 'sadaqah', nameEn: 'Sadaqah', nameAr: 'الصدقة', category: 'SADAQAH', trackingType: 'AMOUNT', defaultOn: false, sortOrder: 24 },
]
