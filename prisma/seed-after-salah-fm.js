// Seed the per-prayer after-salah azkar so Fajr & Maghrib carry the higher
// counts that the other prayers do not.
//
// What it does (idempotent and SAFE):
//   1. AFTER_SALAH (the set shown after Dhuhr, Asr, Isha): appends the three
//      protective surahs (Ikhlas, Falaq, Nas) at x1 if they are not already
//      there. It never touches the rows you already have.
//   2. AFTER_SALAH_FM (Fajr & Maghrib): seeds the full set, which is the same
//      base plus the three surahs at x3, the tahleel "yuhyi wa yumit" at x10,
//      and "Allahumma ajirni min an-nar" at x7.
//
// It matches existing rows by a diacritic insensitive Arabic signature, so it
// never duplicates a dhikr you already entered, and it never deletes anything.
//
// Run:  node prisma/seed-after-salah-fm.js
//
// Sources: standard authentic adhkar (Hisn al-Muslim / Sahih collections).
// Review the texts and counts before relying on them.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── Canonical content (Arabic recitation + transliteration + English) ──
const IKHLAS = {
  ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
  tr: 'Qul huwa Allahu ahad. Allahu as-samad. Lam yalid wa lam yulad. Wa lam yakun lahu kufuwan ahad.',
  en: 'Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.',
}
const FALAQ = {
  ar: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
  tr: "Qul a'udhu bi-rabbil-falaq. Min sharri ma khalaq. Wa min sharri ghasiqin idha waqab. Wa min sharrin-naffathati fil-'uqad. Wa min sharri hasidin idha hasad.",
  en: 'Say: I seek refuge in the Lord of daybreak, from the evil of that which He created, and from the evil of darkness when it settles, and from the evil of the blowers in knots, and from the evil of an envier when he envies.',
}
const NAS = {
  ar: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ',
  tr: "Qul a'udhu bi-rabbin-nas. Malikin-nas. Ilahin-nas. Min sharril-waswasil-khannas. Alladhi yuwaswisu fi sudurin-nas. Minal-jinnati wan-nas.",
  en: 'Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer, who whispers in the breasts of mankind, from among the jinn and mankind.',
}
const AYAT_AL_KURSI = {
  ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ',
  tr: "Allahu la ilaha illa huwa, al-hayyu al-qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dha alladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi-shay'in min 'ilmihi illa bima sha'. Wasi'a kursiyyuhu as-samawati wal-ard, wa la ya'uduhu hifzuhuma, wa huwa al-'aliyyu al-'azim.",
  en: 'Allah, there is no god but He, the Ever-Living, the Sustainer of all that exists. Neither drowsiness nor sleep overtakes Him. To Him belongs all that is in the heavens and all that is on the earth. Who is it that can intercede with Him except by His permission? He knows what lies before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and their preservation does not tire Him. And He is the Most High, the Most Great.',
}
const ISTIGHFAR = { ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah.', en: 'I seek the forgiveness of Allah.' }
const ANTA_SALAM = {
  ar: 'اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
  tr: "Allahumma anta as-salam, wa minka as-salam, tabarakta ya dhal-jalali wal-ikram.",
  en: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honour.',
}
const SUBHANALLAH  = { ar: 'سُبْحَانَ اللَّهِ', tr: 'Subhan Allah.', en: 'Glory be to Allah.' }
const ALHAMDULILLAH = { ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah.', en: 'All praise is for Allah.' }
const ALLAHU_AKBAR  = { ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu akbar.', en: 'Allah is the Greatest.' }
const TAHLEEL_QADIR = {
  ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
  tr: "La ilaha illa Allah, wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir.",
  en: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things.',
}
const TAHLEEL_YUHYI = {
  ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
  tr: "La ilaha illa Allah, wahdahu la sharika lah, lahul-mulku wa lahul-hamd, yuhyi wa yumit, wa huwa 'ala kulli shay'in qadir.",
  en: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise. He gives life and causes death, and He is able to do all things.',
}
const AJIRNI = {
  ar: 'اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ',
  tr: 'Allahumma ajirni min an-nar.',
  en: 'O Allah, save me from the Fire.',
}

// ── Items to append to the standard AFTER_SALAH set (x1 each) ──
const STANDARD_APPEND = [
  { ...IKHLAS, reps: 1 },
  { ...FALAQ,  reps: 1 },
  { ...NAS,    reps: 1 },
]

// ── Full Fajr & Maghrib set ──
const FAJR_MAGHRIB = [
  { ...ISTIGHFAR,     reps: 3  },
  { ...ANTA_SALAM,    reps: 1  },
  { ...SUBHANALLAH,   reps: 33 },
  { ...ALHAMDULILLAH, reps: 33 },
  { ...ALLAHU_AKBAR,  reps: 33 },
  { ...TAHLEEL_QADIR, reps: 1  },
  { ...AYAT_AL_KURSI, reps: 1  },
  { ...IKHLAS,        reps: 3  },
  { ...FALAQ,         reps: 3  },
  { ...NAS,           reps: 3  },
  { ...TAHLEEL_YUHYI, reps: 10 },
  { ...AJIRNI,        reps: 7  },
]

// ── Arabic signature: strip diacritics so near-identical rows still match ──
function normAr(s) {
  return (s || '')
    .replace(/[ً-ْٰـ]/g, '') // tashkeel + dagger alef + tatweel
    .replace(/[آأإ]/g, 'ا')  // alef variants -> bare alef
    .replace(/ى/g, 'ي')                // alef maqsura -> ya
    .replace(/ة/g, 'ه')                // ta marbuta -> ha
    .replace(/[^ء-ي]/g, '')            // keep Arabic letters only
}

async function ensureItems(category, language, items) {
  const rows = await prisma.azkarDefinition.findMany({ where: { category, language } })
  const existing = new Set(rows.map(r => normAr(r.textAr)))
  let nextSort = rows.reduce((m, r) => (r.sortOrder > m ? r.sortOrder : m), -1) + 1
  let added = 0
  for (const it of items) {
    const sig = normAr(it.ar)
    if (existing.has(sig)) continue
    await prisma.azkarDefinition.create({
      data: {
        category,
        language,
        textAr:          it.ar,
        transliteration: language === 'EN' ? (it.tr ?? null) : null,
        translationEn:   language === 'EN' ? (it.en ?? null) : null,
        translationAr:   null,
        repetitions:     it.reps ?? 1,
        sortOrder:       nextSort++,
        isActive:        true,
      },
    })
    existing.add(sig)
    added++
  }
  console.log(`${category}/${language}: +${added} added, ${items.length - added} already present`)
}

async function main() {
  for (const language of ['AR', 'EN']) {
    await ensureItems('AFTER_SALAH', language, STANDARD_APPEND)
    await ensureItems('AFTER_SALAH_FM', language, FAJR_MAGHRIB)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); return prisma.$disconnect().finally(() => process.exit(1)) })
