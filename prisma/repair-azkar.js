// Repair existing azkar rows so every standard dhikr is a FULL record.
//
// Why this exists: seed-azkar.js only inserts when a (category, language) set
// is empty, so once a category has any rows it never overwrites them. If older
// rows were saved with truncated Arabic, transliteration, or translation
// (for example Ayat al-Kursi or the protective surahs cut short), the seed
// cannot fix them. This script repairs those rows in place.
//
// What it does:
//   - For each standard category (AFTER_SALAH, MORNING, EVENING) and language,
//     it matches each existing row to a canonical dhikr by a diacritic
//     insensitive Arabic signature.
//   - AR rows: completes textAr only (Arabic recitation), per the strict
//     AR / EN language separation. Arabic meaning (translationAr) is left as is.
//   - EN rows: completes textAr, transliteration, and translationEn.
//   - It only writes when the stored value is shorter or missing, so it is
//     idempotent and safe to run repeatedly.
//   - It never deletes rows, never touches CUSTOM, and never changes
//     repetitions or sortOrder, so your hand entered order is preserved.
//   - Ambiguous matches (a truncation that could belong to more than one
//     dhikr, like "Subhan Allah" vs "Subhan Allah wa bihamdih") are skipped
//     and reported, never guessed.
//
// Run:  node prisma/repair-azkar.js
//
// Sources: standard authentic adhkar (Hisn al-Muslim / Sahih collections).

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── Canonical, complete content ───────────────────────────
const AYAT_AL_KURSI = {
  ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ',
  tr: "Allahu la ilaha illa huwa, al-hayyu al-qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dha alladhi yashfa'u 'indahu illa bi-idhnih. Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bi-shay'in min 'ilmihi illa bima sha'. Wasi'a kursiyyuhu as-samawati wal-ard, wa la ya'uduhu hifzuhuma, wa huwa al-'aliyyu al-'azim.",
  en: 'Allah, there is no god but He, the Ever-Living, the Sustainer of all that exists. Neither drowsiness nor sleep overtakes Him. To Him belongs all that is in the heavens and all that is on the earth. Who is it that can intercede with Him except by His permission? He knows what lies before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and their preservation does not tire Him. And He is the Most High, the Most Great.',
}
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
const SAYYID_ISTIGHFAR = {
  ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  tr: "Allahumma anta Rabbi, la ilaha illa anta, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika ma istata't. A'udhu bika min sharri ma sana't, abu'u laka bi-ni'matika 'alayy, wa abu'u bi-dhanbi, faghfir li fa-innahu la yaghfirudh-dhunuba illa anta.",
  en: 'O Allah, You are my Lord. There is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me, and I acknowledge my sin, so forgive me, for none forgives sins except You.',
}
const AUDHU_KALIMAT = {
  ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
  tr: "A'udhu bi-kalimatillahi at-tammati min sharri ma khalaq.",
  en: 'I seek refuge in the perfect words of Allah from the evil of what He created.',
}
const HASBIYA = {
  ar: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
  tr: "Hasbiya Allahu la ilaha illa huwa, 'alayhi tawakkaltu, wa huwa Rabbul-'arshil-'azim.",
  en: 'Allah is sufficient for me; there is no god but He. In Him I put my trust, and He is the Lord of the Mighty Throne.',
}
const BISMILLAH_LA_YADURR = {
  ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ',
  tr: "Bismillahi alladhi la yadurru ma'a ismihi shay'un fil-ardi wa la fis-sama', wa huwa as-sami'ul-'alim.",
  en: 'In the name of Allah, with whose name nothing on the earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
}
const RADITU = {
  ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
  tr: "Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin (sallallahu 'alayhi wa sallam) nabiyyan.",
  en: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings be upon him) as my Prophet.',
}
const SUBHAN_BIHAMDIH = {
  ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  tr: 'Subhan Allahi wa bihamdih.',
  en: 'Glory be to Allah and praise be to Him.',
}

const LIBRARY = {
  AFTER_SALAH: [
    { ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah.', en: 'I seek the forgiveness of Allah.' },
    { ar: 'اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
      tr: "Allahumma anta as-salam, wa minka as-salam, tabarakta ya dhal-jalali wal-ikram.",
      en: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honour.' },
    { ar: 'سُبْحَانَ اللَّهِ', tr: 'Subhan Allah.', en: 'Glory be to Allah.' },
    { ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah.', en: 'All praise is for Allah.' },
    { ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu akbar.', en: 'Allah is the Greatest.' },
    { ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      tr: "La ilaha illa Allah, wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir.",
      en: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things.' },
    AYAT_AL_KURSI,
  ],
  MORNING: [
    AYAT_AL_KURSI, IKHLAS, FALAQ, NAS,
    { ar: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
      tr: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illa Allah wahdahu la sharika lah.",
      en: 'We have entered the morning and the dominion belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner.' },
    SAYYID_ISTIGHFAR, RADITU, HASBIYA, BISMILLAH_LA_YADURR, AUDHU_KALIMAT, SUBHAN_BIHAMDIH,
  ],
  EVENING: [
    AYAT_AL_KURSI, IKHLAS, FALAQ, NAS,
    { ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
      tr: "Amsayna wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illa Allah wahdahu la sharika lah.",
      en: 'We have entered the evening and the dominion belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner.' },
    SAYYID_ISTIGHFAR, RADITU, HASBIYA, BISMILLAH_LA_YADURR, AUDHU_KALIMAT, SUBHAN_BIHAMDIH,
  ],
}

// ── Arabic signature: strip diacritics so truncated rows still match ──
function normAr(s) {
  return (s || '')
    .replace(/[ً-ْٰـ]/g, '')   // tashkeel + tatweel
    .replace(/[آأإ]/g, 'ا')     // alef variants to bare alef
    .replace(/ى/g, 'ي')                    // alef maqsura to ya
    .replace(/ة/g, 'ه')                    // ta marbuta to ha
    .replace(/[^ء-ي]/g, '')                // keep Arabic letters only
}

// Match a stored row to exactly one canonical dhikr in its category.
// Returns the canonical, or null if no match or an ambiguous truncation.
function matchCanonical(rowAr, canon) {
  const r = normAr(rowAr)
  if (!r) return null
  const exact = canon.find(c => normAr(c.ar) === r)
  if (exact) return exact
  // Row is a truncation: its signature is a prefix of the canonical signature.
  const prefixHits = canon.filter(c => normAr(c.ar).startsWith(r) && r.length >= 6)
  if (prefixHits.length === 1) return prefixHits[0]
  return null  // none, or ambiguous (more than one) -> do not guess
}

async function repairGroup(category, language) {
  const canon = LIBRARY[category]
  const rows = await prisma.azkarDefinition.findMany({ where: { category, language } })
  let fixed = 0, ok = 0, skipped = 0
  for (const row of rows) {
    const c = matchCanonical(row.textAr, canon)
    if (!c) { skipped++; console.log(`  skip ${category}/${language}: no/ambiguous match for "${row.textAr.slice(0, 24)}..."`); continue }

    const data = {}
    if ((row.textAr || '').length < c.ar.length) data.textAr = c.ar
    if (language === 'EN') {
      if (!row.transliteration || row.transliteration.length < c.tr.length) data.transliteration = c.tr
      if (!row.translationEn  || row.translationEn.length  < c.en.length) data.translationEn  = c.en
    }
    if (Object.keys(data).length === 0) { ok++; continue }

    await prisma.azkarDefinition.update({ where: { id: row.id }, data })
    fixed++
    console.log(`  fixed ${category}/${language}: ${Object.keys(data).join(', ')}  ("${c.ar.slice(0, 16)}...")`)
  }
  console.log(`${category}/${language}: ${fixed} fixed, ${ok} already complete, ${skipped} skipped`)
}

async function main() {
  for (const category of Object.keys(LIBRARY)) {
    for (const language of ['AR', 'EN']) {
      await repairGroup(category, language)
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); return prisma.$disconnect().finally(() => process.exit(1)) })
