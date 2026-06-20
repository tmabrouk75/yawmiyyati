// Curated azkar library: after-salah, morning, and evening.
// Seeds AzkarDefinition rows (Arabic recitation + transliteration + English).
//
// Idempotent and SAFE: it skips any (category, language) pair that already has
// rows, so it never duplicates azkar you entered by hand. The AFTER_SALAH
// category is new, so it always seeds. Morning/Evening AR are only seeded if
// your Arabic set for that category is currently empty.
//
// Run:  node prisma/seed-azkar.js
//
// Sources: standard authentic adhkar (Hisn al-Muslim / Sahih collections).
// Review the texts before relying on them.

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const AFTER_SALAH = [
  { ar: 'أَسْتَغْفِرُ اللَّهَ', tr: 'Astaghfirullah', en: 'I seek the forgiveness of Allah.', reps: 3 },
  { ar: 'اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    tr: 'Allahumma anta as-salam, wa minka as-salam, tabarakta ya dhal-jalali wal-ikram',
    en: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honour.', reps: 1 },
  { ar: 'سُبْحَانَ اللَّهِ', tr: 'Subhan Allah', en: 'Glory be to Allah.', reps: 33 },
  { ar: 'الْحَمْدُ لِلَّهِ', tr: 'Alhamdulillah', en: 'All praise is for Allah.', reps: 33 },
  { ar: 'اللَّهُ أَكْبَرُ', tr: 'Allahu akbar', en: 'Allah is the Greatest.', reps: 33 },
  { ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    tr: "La ilaha illa Allah, wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
    en: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things.', reps: 1 },
  { ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    tr: "Allahu la ilaha illa huwa al-hayyu al-qayyum... (Ayat al-Kursi)",
    en: 'Ayat al-Kursi (Quran 2:255): Allah, there is no god but He, the Ever-Living, the Sustainer of all. His Kursi extends over the heavens and the earth, and their preservation tires Him not. He is the Most High, the Most Great.', reps: 1 },
]

const MORNING = [
  { ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    tr: 'Ayat al-Kursi', en: 'Ayat al-Kursi (Quran 2:255). Whoever recites it in the morning is protected until evening.', reps: 1 },
  { ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    tr: 'Qul huwa Allahu ahad...', en: 'Surah Al-Ikhlas (112).', reps: 3 },
  { ar: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    tr: 'Qul a‘udhu bi-rabbil-falaq...', en: 'Surah Al-Falaq (113).', reps: 3 },
  { ar: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ',
    tr: 'Qul a‘udhu bi-rabbin-nas...', en: 'Surah An-Nas (114).', reps: 3 },
  { ar: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    tr: 'Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illa Allah wahdahu la sharika lah',
    en: 'We have entered the morning and the dominion belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner.', reps: 1 },
  { ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    tr: "Allahumma anta Rabbi la ilaha illa anta... (Sayyid al-Istighfar)",
    en: 'The chief supplication for forgiveness (Sayyid al-Istighfar).', reps: 1 },
  { ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    tr: 'Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin (sallallahu alayhi wa sallam) nabiyyan',
    en: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.', reps: 3 },
  { ar: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    tr: "Hasbiya Allahu la ilaha illa huwa, 'alayhi tawakkaltu, wa huwa Rabbul-'arshil-'azim",
    en: 'Allah is sufficient for me; there is no god but He. In Him I put my trust, and He is the Lord of the Mighty Throne.', reps: 7 },
  { ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ',
    tr: "Bismillahi alladhi la yadurru ma‘a ismihi shay'un fil-ardi wa la fis-sama', wa huwa as-sami‘ul-‘alim",
    en: 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.', reps: 3 },
  { ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    tr: "A‘udhu bi-kalimatillahi at-tammati min sharri ma khalaq",
    en: 'I seek refuge in the perfect words of Allah from the evil of what He created.', reps: 3 },
  { ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    tr: 'Subhan Allahi wa bihamdih',
    en: 'Glory be to Allah and praise be to Him.', reps: 100 },
]

const EVENING = [
  { ar: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    tr: 'Ayat al-Kursi', en: 'Ayat al-Kursi (Quran 2:255). Whoever recites it in the evening is protected until morning.', reps: 1 },
  { ar: 'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    tr: 'Qul huwa Allahu ahad...', en: 'Surah Al-Ikhlas (112).', reps: 3 },
  { ar: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    tr: 'Qul a‘udhu bi-rabbil-falaq...', en: 'Surah Al-Falaq (113).', reps: 3 },
  { ar: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ',
    tr: 'Qul a‘udhu bi-rabbin-nas...', en: 'Surah An-Nas (114).', reps: 3 },
  { ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
    tr: 'Amsayna wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illa Allah wahdahu la sharika lah',
    en: 'We have entered the evening and the dominion belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner.', reps: 1 },
  { ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    tr: 'Allahumma anta Rabbi la ilaha illa anta... (Sayyid al-Istighfar)',
    en: 'The chief supplication for forgiveness (Sayyid al-Istighfar).', reps: 1 },
  { ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    tr: "A‘udhu bi-kalimatillahi at-tammati min sharri ma khalaq",
    en: 'I seek refuge in the perfect words of Allah from the evil of what He created.', reps: 3 },
  { ar: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    tr: "Hasbiya Allahu la ilaha illa huwa, 'alayhi tawakkaltu, wa huwa Rabbul-'arshil-'azim",
    en: 'Allah is sufficient for me; there is no god but He. In Him I put my trust, and He is the Lord of the Mighty Throne.', reps: 7 },
  { ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ',
    tr: "Bismillahi alladhi la yadurru ma‘a ismihi shay'un fil-ardi wa la fis-sama', wa huwa as-sami‘ul-‘alim",
    en: 'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.', reps: 3 },
  { ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    tr: 'Subhan Allahi wa bihamdih',
    en: 'Glory be to Allah and praise be to Him.', reps: 100 },
]

const DATA = { AFTER_SALAH, MORNING, EVENING }

async function seedPair(category, language, items) {
  const existing = await prisma.azkarDefinition.count({ where: { category, language } })
  if (existing > 0) {
    console.log(`skip ${category}/${language}: ${existing} already exist`)
    return
  }
  let sortOrder = 0
  for (const it of items) {
    await prisma.azkarDefinition.create({
      data: {
        category,
        language,
        textAr:          it.ar,
        transliteration: language === 'EN' ? (it.tr ?? null) : null,
        translationEn:   language === 'EN' ? (it.en ?? null) : null,
        translationAr:   null,
        repetitions:     it.reps ?? 1,
        sortOrder:       sortOrder++,
        isActive:        true,
      },
    })
  }
  console.log(`seeded ${category}/${language}: ${items.length}`)
}

async function main() {
  for (const [category, items] of Object.entries(DATA)) {
    await seedPair(category, 'AR', items)
    await seedPair(category, 'EN', items)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); return prisma.$disconnect().finally(() => process.exit(1)) })
