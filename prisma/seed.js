const { PrismaClient } = require('@prisma/client')

// Activities inlined here so seed.js has no TypeScript dependency
const DEFAULT_ACTIVITIES = [
  // ─── SALAH — Fard (always shown, CANNOT be disabled) ──────────
  { key: 'fajr',            nameEn: 'Fajr',                        nameAr: 'الفجر',                     category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: false, sortOrder: 1  },
  { key: 'dhuhr',           nameEn: 'Dhuhr',                       nameAr: 'الظهر',                     category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: false, sortOrder: 2  },
  { key: 'asr',             nameEn: 'Asr',                         nameAr: 'العصر',                     category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: false, sortOrder: 3  },
  { key: 'maghrib',         nameEn: 'Maghrib',                     nameAr: 'المغرب',                    category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: false, sortOrder: 4  },
  { key: 'isha',            nameEn: 'Isha',                        nameAr: 'العشاء',                    category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: false, sortOrder: 5  },
  // ─── SALAH — optional columns inside prayer rows ───────────────
  { key: 'sunnah_rawatib',  nameEn: 'Sunnah Rawatib',              nameAr: 'السنن الرواتب',              category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: true,  sortOrder: 6  },
  { key: 'prayer_azkar',    nameEn: 'Post-prayer Azkar',           nameAr: 'أذكار بعد الصلاة',           category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: true,  sortOrder: 7  },
  { key: 'duha',            nameEn: 'Duha Prayer',                 nameAr: 'صلاة الضحى',                category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 9  },
  { key: 'witr',            nameEn: 'Witr',                        nameAr: 'الوتر',                     category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 10 },
  { key: 'qiyam',           nameEn: 'Qiyam al-Layl',               nameAr: 'قيام الليل',                category: 'SALAH',   trackingType: 'NUMBER_INPUT', defaultOn: false, canDisable: true,  sortOrder: 11 },
  { key: 'jumuah',          nameEn: "Jumu'ah",                     nameAr: 'الجمعة',                    category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: true,  sortOrder: 12 },
  { key: 'taraweeh',        nameEn: 'Taraweeh',                    nameAr: 'التراويح',                  category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 13 },
  { key: 'eid_fitr',        nameEn: 'Eid al-Fitr Salat',           nameAr: 'صلاة عيد الفطر',            category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 14 },
  { key: 'eid_adha',        nameEn: 'Eid al-Adha Salat',           nameAr: 'صلاة عيد الأضحى',           category: 'SALAH',   trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 15 },
  // ─── DHIKR ───────────────────────────────────────────────────
  { key: 'morning_azkar',   nameEn: 'Morning Azkar',               nameAr: 'أذكار الصباح',              category: 'DHIKR',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: true,  sortOrder: 16 },
  { key: 'evening_azkar',   nameEn: 'Evening Azkar',               nameAr: 'أذكار المساء',              category: 'DHIKR',   trackingType: 'CHECKBOX',     defaultOn: true,  canDisable: true,  sortOrder: 17 },
  { key: 'istighfar',       nameEn: 'Istighfar',                   nameAr: 'الاستغفار',                 category: 'DHIKR',   trackingType: 'NUMBER_INPUT', defaultOn: false, canDisable: true,  sortOrder: 18 },
  { key: 'salawat',         nameEn: 'Salawat \uFDFA',              nameAr: 'الصلاة على النبي \uFDFA',   category: 'DHIKR',   trackingType: 'NUMBER_INPUT', defaultOn: false, canDisable: true,  sortOrder: 19 },
  // ─── QURAN ───────────────────────────────────────────────────
  { key: 'quran_pages',     nameEn: 'Quran Reading',               nameAr: 'تلاوة القرآن',              category: 'QURAN',   trackingType: 'PAGES',        defaultOn: true,  canDisable: true,  sortOrder: 20 },
  { key: 'daily_surahs',    nameEn: 'Daily Surahs',                nameAr: 'السور اليومية',             category: 'QURAN',   trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 21 },
  { key: 'surah_kahf',      nameEn: 'Surah Al-Kahf',               nameAr: 'سورة الكهف',               category: 'QURAN',   trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 22 },
  // ─── FASTING ─────────────────────────────────────────────────
  { key: 'ramadan_fast',    nameEn: 'Ramadan Fasting',             nameAr: 'صيام رمضان',               category: 'FASTING', trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 23 },
  { key: 'monday_thursday', nameEn: 'Monday / Thursday Fast',      nameAr: 'صيام الاثنين والخميس',     category: 'FASTING', trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 24 },
  { key: 'white_days',      nameEn: 'White Days Fast',             nameAr: 'صيام الأيام البيض',        category: 'FASTING', trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 25 },
  { key: 'voluntary_fast',  nameEn: 'Voluntary Fast',              nameAr: 'صيام تطوع',                category: 'FASTING', trackingType: 'CHECKBOX',     defaultOn: false, canDisable: true,  sortOrder: 26 },
  // ─── SADAQAH ─────────────────────────────────────────────────
  { key: 'sadaqah',         nameEn: 'Sadaqah',                     nameAr: 'الصدقة',                   category: 'SADAQAH', trackingType: 'AMOUNT',       defaultOn: false, canDisable: true,  sortOrder: 27 },
]

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Activity Definitions
  for (const activity of DEFAULT_ACTIVITIES) {
    await prisma.activityDefinition.upsert({
      where: { key: activity.key },
      update: activity,
      create: activity,
    })
  }
  console.log(`✅ Seeded ${DEFAULT_ACTIVITIES.length} activity definitions`)

  // ── Theme Definitions
  const themes = [
    { key: 'madinah-night', nameEn: 'Madinah Night', nameAr: 'ليل المدينة',   isFree: true,  isSeasonal: false, previewColor: '#0d1f2d' },
    { key: 'makkah-gold',   nameEn: 'Makkah Gold',   nameAr: 'ذهب مكة',       isFree: false, isSeasonal: false, previewColor: '#8B6914' },
    { key: 'jannah-green',  nameEn: 'Garden of Jannah', nameAr: 'روضة الجنة', isFree: false, isSeasonal: false, previewColor: '#1a4731' },
    { key: 'desert-sand',   nameEn: 'Desert Sand',   nameAr: 'رمال الصحراء',  isFree: false, isSeasonal: false, previewColor: '#c2956c' },
    { key: 'fajr-blue',     nameEn: 'Fajr Blue',     nameAr: 'أزرق الفجر',    isFree: false, isSeasonal: false, previewColor: '#1a3a5c' },
    { key: 'rose-ramadan',  nameEn: 'Rose Ramadan',  nameAr: 'وردة رمضان',    isFree: false, isSeasonal: true,  seasonStart: 9, seasonEnd: 9, previewColor: '#8B3A52' },
    { key: 'eid-special',   nameEn: 'Eid Special',   nameAr: 'خاص العيد',     isFree: false, isSeasonal: true,  seasonStart: 10, seasonEnd: 12, previewColor: '#1a5c3a' },
  ]

  for (const theme of themes) {
    await prisma.themeDefinition.upsert({
      where: { key: theme.key },
      update: theme,
      create: theme,
    })
  }
  console.log(`✅ Seeded ${themes.length} themes`)

  // ── Badge Definitions
  const badges = [
    // Daily
    { key: 'perfect_day',     nameEn: 'Perfect Day',        nameAr: 'يوم مثالي',         descriptionEn: 'All active items checked in one day',          descriptionAr: 'أكملت جميع النشاطات في يوم واحد',     icon: '⭐', category: 'DAILY',     triggerType: 'perfect_day',     triggerValue: 1 },
    { key: 'full_sunnah_day', nameEn: 'Full Sunnah Day',    nameAr: 'يوم السنة الكاملة', descriptionEn: 'All Sunnah Rawatib completed in one day',       descriptionAr: 'أكملت جميع سنن الرواتب في يوم',       icon: '🕌', category: 'DAILY',     triggerType: 'full_sunnah_day', triggerValue: 1 },
    { key: 'generous_day',    nameEn: 'Generous Day',       nameAr: 'يوم الكرم',          descriptionEn: 'Sadaqah logged today',                         descriptionAr: 'سجّلت صدقة اليوم',                    icon: '💛', category: 'DAILY',     triggerType: 'sadaqah_day',     triggerValue: 1 },
    // Weekly
    { key: 'no_salah_missed', nameEn: 'No Salah Missed',   nameAr: 'أسبوع بلا فوات',    descriptionEn: 'All 5 Fard prayers logged every day for 7 days', descriptionAr: 'صليت جميع الفرائض 7 أيام متتالية',    icon: '🔥', category: 'WEEKLY',    triggerType: 'fard_streak',     triggerValue: 7 },
    { key: 'quran_week',      nameEn: 'Quran Week',         nameAr: 'أسبوع القرآن',      descriptionEn: 'Quran read every day for 7 days',              descriptionAr: 'تلوت القرآن 7 أيام متتالية',           icon: '📖', category: 'WEEKLY',    triggerType: 'quran_streak',    triggerValue: 7 },
    { key: 'giving_week',     nameEn: 'Giving Week',        nameAr: 'أسبوع العطاء',      descriptionEn: 'Sadaqah logged 7 days in a row',               descriptionAr: 'تصدقت 7 أيام متتالية',                 icon: '💛', category: 'WEEKLY',    triggerType: 'sadaqah_streak',  triggerValue: 7 },
    // Monthly
    { key: 'salah_guardian',  nameEn: 'Salah Guardian',    nameAr: 'حارس الصلاة',        descriptionEn: 'No Fard prayer missed for 30 days',            descriptionAr: 'لم تفوّت فريضة 30 يومًا',              icon: '💎', category: 'MONTHLY',   triggerType: 'fard_streak',     triggerValue: 30 },
    { key: 'ramadan_warrior', nameEn: 'Ramadan Warrior',   nameAr: 'بطل رمضان',          descriptionEn: 'Complete full Ramadan fasting log',            descriptionAr: 'أكملت صيام شهر رمضان',                icon: '🌙', category: 'MONTHLY',   triggerType: 'ramadan_complete',triggerValue: 1 },
    { key: 'qada_cleared',    nameEn: "Qada' Cleared",     nameAr: 'القضاء مؤدَّى',       descriptionEn: 'All Qada days fully compensated',              descriptionAr: 'أكملت جميع أيام القضاء',               icon: '⚖️', category: 'MONTHLY',   triggerType: 'qada_complete',   triggerValue: 1 },
    // Milestone
    { key: 'khatm',           nameEn: 'Khatm',              nameAr: 'ختمة',              descriptionEn: 'Completed a full Quran reading cycle',         descriptionAr: 'أكملت ختمة كاملة للقرآن الكريم',      icon: '📖', category: 'MILESTONE', triggerType: 'quran_pages_total',triggerValue: 604 },
    { key: 'ist_10k',         nameEn: '10K Istighfar',      nameAr: '١٠ آلاف استغفار',   descriptionEn: 'Cumulative Istighfar reached 10,000',          descriptionAr: 'وصل استغفارك التراكمي إلى ١٠٠٠٠',     icon: '📿', category: 'MILESTONE', triggerType: 'istighfar_total', triggerValue: 10000 },
    { key: 'ist_100k',        nameEn: '100K Istighfar',     nameAr: '١٠٠ ألف استغفار',  descriptionEn: 'Cumulative Istighfar reached 100,000',         descriptionAr: 'وصل استغفارك التراكمي إلى ١٠٠٠٠٠',    icon: '📿', category: 'MILESTONE', triggerType: 'istighfar_total', triggerValue: 100000 },
    { key: 'sal_1k',          nameEn: 'Salawat 1,000',      nameAr: 'ألف صلاة على النبي',descriptionEn: 'Cumulative Salawat reached 1,000',             descriptionAr: 'وصلت صلواتك على النبي ﷺ إلى ١٠٠٠',    icon: '🤲', category: 'MILESTONE', triggerType: 'salawat_total',   triggerValue: 1000 },
    { key: 'giving_50',       nameEn: '50 Days of Giving',  nameAr: '٥٠ يومًا من العطاء',descriptionEn: 'Sadaqah logged on 50 different days',          descriptionAr: 'تصدقت في ٥٠ يومًا مختلفة',            icon: '💛', category: 'MILESTONE', triggerType: 'sadaqah_days',    triggerValue: 50 },
  ]

  for (const badge of badges) {
    await prisma.badgeDefinition.upsert({
      where: { key: badge.key },
      update: badge,
      create: badge,
    })
  }
  console.log(`✅ Seeded ${badges.length} badge definitions`)

  // ── Admin account — create if not already exists
  const adminEmail = 't.mabrouk@outlook.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existing) {
    // bcrypt hash of a placeholder — owner must reset password via /forgot-password or DB
    // Placeholder: "ChangeMe123!" — owner should change this immediately after first login
    const { createHmac } = require('crypto')
    const bcrypt = require('bcryptjs')
    const tempHash = await bcrypt.hash('ChangeMe123!', 12)

    const admin = await prisma.user.create({
      data: {
        email:        adminEmail,
        name:         'Tarek Mabrouk',
        passwordHash: tempHash,
        isAdmin:      true,
        isPremium:    true,
        language:     'AR',
      },
    })

    // Seed admin's activity settings
    const activityDefs = await prisma.activityDefinition.findMany()
    await prisma.userActivity.createMany({
      data: activityDefs.map((def, i) => ({
        userId:              admin.id,
        activityDefinitionId:def.id,
        isEnabled:           def.defaultOn,
        sortOrder:           i,
      })),
    })

    console.log('✅ Admin account created — t.mabrouk@outlook.com')
    console.log('⚠️  Temporary password: ChangeMe123! — CHANGE THIS IMMEDIATELY')
  } else if (!existing.isAdmin) {
    // If account exists but isn't admin yet — promote it
    await prisma.user.update({
      where: { email: adminEmail },
      data:  { isAdmin: true, isPremium: true },
    })
    console.log('✅ Existing account promoted to admin — t.mabrouk@outlook.com')
  } else {
    console.log('✅ Admin account already exists — skipped')
  }

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
