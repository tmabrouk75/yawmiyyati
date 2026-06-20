// Complete English-set azkar content (Arabic recitation + transliteration +
// English translation) for the MORNING and EVENING collections, mirroring the
// Arabic set item for item and in the same order and repetition counts.
//
// This is the source data for sync-azkar-en.js. It rebuilds ONLY the English
// (language = 'EN') Morning and Evening definitions. The Arabic set, After-Salah,
// and any custom azkar are left untouched.
//
// PLEASE REVIEW the texts before running in production. Sources: standard
// authentic adhkar (Hisn al-Muslim). Transliteration follows the same style as
// the existing English entries.

// ── Shared items (identical wording morning and evening) ──
const KURSI = {
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
const SAYYID = {
  ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  tr: "Allahumma anta Rabbi, la ilaha illa anta, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika ma istata't. A'udhu bika min sharri ma sana't, abu'u laka bi-ni'matika 'alayy, wa abu'u bi-dhanbi, faghfir li fa-innahu la yaghfirudh-dhunuba illa anta.",
  en: 'O Allah, You are my Lord. There is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favour upon me, and I acknowledge my sin, so forgive me, for none forgives sins except You.',
}
const AFINI = {
  ar: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَٰهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَٰهَ إِلَّا أَنْتَ',
  tr: "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari, la ilaha illa anta. Allahumma inni a'udhu bika minal-kufri wal-faqr, wa a'udhu bika min 'adhabil-qabr, la ilaha illa anta.",
  en: 'O Allah, grant me well-being in my body. O Allah, grant me well-being in my hearing. O Allah, grant me well-being in my sight. There is no god but You. O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. There is no god but You.',
}
const AFWA = {
  ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
  tr: "Allahumma inni as'alukal-'afwa wal-'afiyata fid-dunya wal-akhirah. Allahumma inni as'alukal-'afwa wal-'afiyata fi dini wa dunyaya wa ahli wa mali. Allahummastur 'awrati wa amin raw'ati. Allahummahfazni min bayni yadayya wa min khalfi wa 'an yamini wa 'an shimali wa min fawqi, wa a'udhu bi-'azamatika an ughtala min tahti.",
  en: 'O Allah, I ask You for pardon and well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly life, my family, and my wealth. O Allah, conceal my faults and calm my fears. O Allah, guard me from before me and behind me, from my right and my left, and from above me; and I seek refuge in Your greatness from being taken unaware from beneath me.',
}
const ALIM = {
  ar: 'اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَىٰ نَفْسِي سُوءًا أَوْ أَجُرَّهُ إِلَىٰ مُسْلِمٍ',
  tr: "Allahumma 'alimal-ghaybi wash-shahadah, fatiras-samawati wal-ard, rabba kulli shay'in wa malikah, ashhadu an la ilaha illa anta, a'udhu bika min sharri nafsi, wa min sharrish-shaytani wa shirkih, wa an aqtarifa 'ala nafsi su'an aw ajurrahu ila Muslim.",
  en: 'O Allah, Knower of the unseen and the seen, Originator of the heavens and the earth, Lord and Sovereign of all things, I bear witness that there is no god but You. I seek refuge in You from the evil of my own self, and from the evil of Satan and his call to associate partners with You, and from bringing evil upon myself or dragging it onto any Muslim.',
}
const BISMILLAH = {
  ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ',
  tr: "Bismillahi alladhi la yadurru ma'a ismihi shay'un fil-ardi wa la fis-sama', wa huwa as-sami'ul-'alim.",
  en: 'In the name of Allah, with whose name nothing on the earth or in the heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
}
const RADITU = {
  ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
  tr: "Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin (sallallahu 'alayhi wa sallam) nabiyyan.",
  en: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings be upon him) as my Prophet.',
}
const YA_HAYY = {
  ar: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ',
  tr: "Ya Hayyu ya Qayyum, bi-rahmatika astaghith, aslih li sha'ni kullah, wa la takilni ila nafsi tarfata 'ayn.",
  en: 'O Ever-Living, O Sustainer, by Your mercy I seek help. Set right all my affairs, and do not leave me to myself even for the blink of an eye.',
}
const SUBHAN_BIHAMDIH = {
  ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  tr: 'Subhan Allahi wa bihamdih.',
  en: 'Glory be to Allah and praise be to Him.',
}
const LA_ILAHA_WAHDAH = {
  ar: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
  tr: "La ilaha illa Allah, wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir.",
  en: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is able to do all things.',
}
const AUDHU_KALIMAT = {
  ar: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
  tr: "A'udhu bi-kalimatillahi at-tammati min sharri ma khalaq.",
  en: 'I seek refuge in the perfect words of Allah from the evil of what He created.',
}
const SALLI = {
  ar: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ',
  tr: 'Allahumma salli wa sallim \'ala nabiyyina Muhammad.',
  en: 'O Allah, send blessings and peace upon our Prophet Muhammad.',
}

// ── Morning-specific wording ──
const M_ASBAHNA_LONG = {
  ar: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
  tr: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illa Allah wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Rabbi as'aluka khayra ma fi hadhal-yawmi wa khayra ma ba'dah, wa a'udhu bika min sharri ma fi hadhal-yawmi wa sharri ma ba'dah. Rabbi a'udhu bika minal-kasali wa su'il-kibar. Rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr.",
  en: 'We have entered the morning and the dominion belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner; His is the dominion and His is the praise, and He is able to do all things. My Lord, I ask You for the good of this day and the good of what follows it, and I seek refuge in You from the evil of this day and the evil of what follows it. My Lord, I seek refuge in You from laziness and the misery of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.',
}
const M_BIKA = {
  ar: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
  tr: 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namut, wa ilaykan-nushur.',
  en: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.',
}
const M_USHHIDUKA = {
  ar: 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
  tr: "Allahumma inni asbahtu ushhiduka wa ushhidu hamalata 'arshik, wa mala'ikataka wa jami'a khalqik, annaka antallahu la ilaha illa anta wahdaka la sharika lak, wa anna Muhammadan 'abduka wa rasuluk.",
  en: 'O Allah, I have entered the morning calling You to witness, and calling the bearers of Your Throne, Your angels, and all Your creation to witness, that You are Allah, there is no god but You alone, with no partner, and that Muhammad is Your servant and Messenger.',
}
const M_NIMAH = {
  ar: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
  tr: "Allahumma ma asbaha bi min ni'matin aw bi-ahadin min khalqik, faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr.",
  en: 'O Allah, whatever blessing has come to me or to any of Your creation this morning is from You alone, with no partner; so to You is all praise and to You is all thanks.',
}
const M_RABBIL_ALAMIN = {
  ar: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَٰذَا الْيَوْمِ: فَتْحَهُ، وَنَصْرَهُ، وَنُورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ',
  tr: "Asbahna wa asbahal-mulku lillahi rabbil-'alamin. Allahumma inni as'aluka khayra hadhal-yawm: fathahu wa nasrahu wa nurahu wa barakatahu wa hudah, wa a'udhu bika min sharri ma fihi wa sharri ma ba'dah.",
  en: 'We have entered the morning and the dominion belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this day: its victory, its help, its light, its blessing, and its guidance; and I seek refuge in You from the evil that is in it and the evil that follows it.',
}
const M_FITRA = {
  ar: 'أَصْبَحْنَا عَلَىٰ فِطْرَةِ الْإِسْلَامِ، وَعَلَىٰ كَلِمَةِ الْإِخْلَاصِ، وَعَلَىٰ دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَىٰ مِلَّةِ أَبِينَا إِبْرَاهِيمَ، حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
  tr: "Asbahna 'ala fitratil-Islam, wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina Muhammadin (sallallahu 'alayhi wa sallam), wa 'ala millati abina Ibrahim, hanifan musliman wa ma kana minal-mushrikin.",
  en: 'We have entered the morning upon the natural way of Islam, upon the word of sincere devotion, upon the religion of our Prophet Muhammad (peace and blessings be upon him), and upon the way of our father Abraham, who was upright in submission and was not among those who associate partners with Allah.',
}
const SUBHAN_ADADA = {
  ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
  tr: "Subhan Allahi wa bihamdih, 'adada khalqih, wa rida nafsih, wa zinata 'arshih, wa midada kalimatih.",
  en: 'Glory and praise be to Allah, as much as the number of His creation, as much as pleases Him, as much as the weight of His Throne, and as much as the ink of His words.',
}
const ILMAN = {
  ar: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
  tr: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbala.",
  en: 'O Allah, I ask You for beneficial knowledge, good provision, and deeds that are accepted.',
}
const ASTAGHFIR_ATUB = {
  ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
  tr: 'Astaghfirullaha wa atubu ilayh.',
  en: 'I seek the forgiveness of Allah and turn to Him in repentance.',
}

// ── Evening-specific wording ──
const E_AMSAYNA_LONG = {
  ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَٰذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَٰذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
  tr: "Amsayna wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illa Allah wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Rabbi as'aluka khayra ma fi hadhihil-laylati wa khayra ma ba'daha, wa a'udhu bika min sharri ma fi hadhihil-laylati wa sharri ma ba'daha. Rabbi a'udhu bika minal-kasali wa su'il-kibar. Rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr.",
  en: 'We have entered the evening and the dominion belongs to Allah, and all praise is for Allah. There is no god but Allah alone, with no partner; His is the dominion and His is the praise, and He is able to do all things. My Lord, I ask You for the good of this night and the good of what follows it, and I seek refuge in You from the evil of this night and the evil of what follows it. My Lord, I seek refuge in You from laziness and the misery of old age. My Lord, I seek refuge in You from punishment in the Fire and punishment in the grave.',
}
const E_BIKA = {
  ar: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
  tr: 'Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namut, wa ilaykal-masir.',
  en: 'O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.',
}
const E_USHHIDUKA = {
  ar: 'اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
  tr: "Allahumma inni amsaytu ushhiduka wa ushhidu hamalata 'arshik, wa mala'ikataka wa jami'a khalqik, annaka antallahu la ilaha illa anta wahdaka la sharika lak, wa anna Muhammadan 'abduka wa rasuluk.",
  en: 'O Allah, I have entered the evening calling You to witness, and calling the bearers of Your Throne, Your angels, and all Your creation to witness, that You are Allah, there is no god but You alone, with no partner, and that Muhammad is Your servant and Messenger.',
}
const E_NIMAH = {
  ar: 'اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
  tr: "Allahumma ma amsa bi min ni'matin aw bi-ahadin min khalqik, faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr.",
  en: 'O Allah, whatever blessing has come to me or to any of Your creation this evening is from You alone, with no partner; so to You is all praise and to You is all thanks.',
}
const E_RABBIL_ALAMIN = {
  ar: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَٰذِهِ اللَّيْلَةِ: فَتْحَهَا، وَنَصْرَهَا، وَنُورَهَا، وَبَرَكَتَهَا، وَهُدَاهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهَا وَشَرِّ مَا بَعْدَهَا',
  tr: "Amsayna wa amsal-mulku lillahi rabbil-'alamin. Allahumma inni as'aluka khayra hadhihil-laylah: fathaha wa nasraha wa nuraha wa barakataha wa hudaha, wa a'udhu bika min sharri ma fiha wa sharri ma ba'daha.",
  en: 'We have entered the evening and the dominion belongs to Allah, Lord of the worlds. O Allah, I ask You for the good of this night: its victory, its help, its light, its blessing, and its guidance; and I seek refuge in You from the evil that is in it and the evil that follows it.',
}
const E_FITRA = {
  ar: 'أَمْسَيْنَا عَلَىٰ فِطْرَةِ الْإِسْلَامِ، وَعَلَىٰ كَلِمَةِ الْإِخْلَاصِ، وَعَلَىٰ دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، وَعَلَىٰ مِلَّةِ أَبِينَا إِبْرَاهِيمَ، حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
  tr: "Amsayna 'ala fitratil-Islam, wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina Muhammadin (sallallahu 'alayhi wa sallam), wa 'ala millati abina Ibrahim, hanifan musliman wa ma kana minal-mushrikin.",
  en: 'We have entered the evening upon the natural way of Islam, upon the word of sincere devotion, upon the religion of our Prophet Muhammad (peace and blessings be upon him), and upon the way of our father Abraham, who was upright in submission and was not among those who associate partners with Allah.',
}

// ── Ordered sets (mirror the Arabic set item for item) ──
const MORNING = [
  { ...KURSI,            reps: 1 },
  { ...IKHLAS,           reps: 3 },
  { ...FALAQ,            reps: 3 },
  { ...NAS,              reps: 3 },
  { ...M_ASBAHNA_LONG,   reps: 1 },
  { ...M_BIKA,           reps: 1 },
  { ...SAYYID,           reps: 1 },
  { ...M_USHHIDUKA,      reps: 4 },
  { ...M_NIMAH,          reps: 1 },
  { ...AFINI,            reps: 3 },
  { ...HASBIYA(),        reps: 7 },
  { ...AFWA,             reps: 1 },
  { ...ALIM,             reps: 1 },
  { ...BISMILLAH,        reps: 3 },
  { ...RADITU,           reps: 3 },
  { ...YA_HAYY,          reps: 1 },
  { ...M_RABBIL_ALAMIN,  reps: 1 },
  { ...M_FITRA,          reps: 1 },
  { ...SUBHAN_BIHAMDIH,  reps: 100 },
  { ...LA_ILAHA_WAHDAH,  reps: 10 },
  { ...LA_ILAHA_WAHDAH,  reps: 100 },
  { ...SUBHAN_ADADA,     reps: 3 },
  { ...ILMAN,            reps: 1 },
  { ...ASTAGHFIR_ATUB,   reps: 100 },
  { ...SALLI,            reps: 10 },
]

const EVENING = [
  { ...KURSI,            reps: 1 },
  { ...IKHLAS,           reps: 3 },
  { ...FALAQ,            reps: 3 },
  { ...NAS,              reps: 3 },
  { ...E_AMSAYNA_LONG,   reps: 1 },
  { ...E_BIKA,           reps: 1 },
  { ...SAYYID,           reps: 1 },
  { ...E_USHHIDUKA,      reps: 4 },
  { ...E_NIMAH,          reps: 1 },
  { ...AFINI,            reps: 3 },
  { ...HASBIYA(),        reps: 7 },
  { ...AFWA,             reps: 1 },
  { ...ALIM,             reps: 1 },
  { ...BISMILLAH,        reps: 3 },
  { ...RADITU,           reps: 3 },
  { ...YA_HAYY,          reps: 1 },
  { ...E_RABBIL_ALAMIN,  reps: 1 },
  { ...E_FITRA,          reps: 1 },
  { ...SUBHAN_BIHAMDIH,  reps: 100 },
  { ...LA_ILAHA_WAHDAH,  reps: 10 },
  { ...AUDHU_KALIMAT,    reps: 3 },
  { ...SALLI,            reps: 10 },
]

// HASBIYA is defined as a function only to keep it next to its data without a
// forward-reference issue above; it returns the same object each call.
function HASBIYA() {
  return {
    ar: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    tr: "Hasbiya Allahu la ilaha illa huwa, 'alayhi tawakkaltu, wa huwa Rabbul-'arshil-'azim.",
    en: 'Allah is sufficient for me; there is no god but He. In Him I put my trust, and He is the Lord of the Mighty Throne.',
  }
}

module.exports = { LIBRARY: { MORNING, EVENING } }
