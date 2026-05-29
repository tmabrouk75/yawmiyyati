'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { COUNTRIES, getCountriesByRegion } from '@/lib/countries'

const TOTAL_STEPS = 7

const COMMITMENT_OPTIONS = {
  en: [
    { key: 'salah',      label: '🕌 Stay consistent with Salah' },
    { key: 'quran',      label: '📖 Read Quran daily' },
    { key: 'fasting',    label: '🌙 Track fasting (Sunnah/Qadaa)' },
    { key: 'dhikr',      label: '📿 Morning & evening Azkar' },
    { key: 'streak',     label: '🔥 Build a long streak' },
    { key: 'habits',     label: '✅ Build better Islamic habits' },
    { key: 'accountability', label: '🤝 Stay accountable' },
    { key: 'ramadan',    label: '🌟 Prepare for Ramadan' },
  ],
  ar: [
    { key: 'salah',      label: '🕌 الاستمرار على الصلاة' },
    { key: 'quran',      label: '📖 قراءة القرآن يومياً' },
    { key: 'fasting',    label: '🌙 تتبع الصيام (السنة/القضاء)' },
    { key: 'dhikr',      label: '📿 أذكار الصباح والمساء' },
    { key: 'streak',     label: '🔥 بناء سلسلة طويلة' },
    { key: 'habits',     label: '✅ تطوير عادات إسلامية أفضل' },
    { key: 'accountability', label: '🤝 الالتزام والمحاسبة' },
    { key: 'ramadan',    label: '🌟 الاستعداد لرمضان' },
  ],
}

const AGE_OPTIONS = {
  en: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'],
  ar: ['أقل من 18', '18–24', '25–34', '35–44', '45–54', '55+'],
}

const CHANNEL_OPTIONS = {
  en: [
    { key: 'friend',     label: '👥 Friend or family' },
    { key: 'social',     label: '📱 Social media' },
    { key: 'search',     label: '🔍 Google / App Store search' },
    { key: 'islamic_site', label: '🕌 Islamic website or group' },
    { key: 'youtube',    label: '▶️ YouTube' },
    { key: 'referral',   label: '🎁 Referral link' },
    { key: 'other',      label: '💬 Other' },
  ],
  ar: [
    { key: 'friend',     label: '👥 صديق أو أحد أفراد العائلة' },
    { key: 'social',     label: '📱 وسائل التواصل الاجتماعي' },
    { key: 'search',     label: '🔍 بحث Google / متجر التطبيقات' },
    { key: 'islamic_site', label: '🕌 موقع أو مجموعة إسلامية' },
    { key: 'youtube',    label: '▶️ يوتيوب' },
    { key: 'referral',   label: '🎁 رابط إحالة' },
    { key: 'other',      label: '💬 أخرى' },
  ],
}

const T = {
  en: {
    step1Title:   'Welcome to Yawmiyyati',
    step1Sub:     'Your daily Islamic activity companion',
    step2Title:   'Where are you?',
    step2Sub:     'Used for prayer times and Islamic calendar',
    step3Title:   'بسم الله الرحمن الرحيم',
    step3Sub:     'Every great journey begins with the name of Allah',
    step3Body:    'This app is built to help you draw closer to Allah, one day at a time. Track your prayers, Quran, fasting, and dhikr with sincerity.',
    step3Btn:     'Begin with Allah\'s name →',
    step4Title:   'What brings you here?',
    step4Sub:     'Select all that apply, this helps us tailor your experience',
    step5Title:   'How old are you?',
    step5Sub:     'Helps us show you the most relevant content',
    step6Title:   'How did you find us?',
    step6Sub:     'Optional · helps us reach more Muslims',
    step7Title:   'How it works',
    step7Sub:     'Here is what you will track every day',
    next:         'Continue',
    finish:       "Let's go →",
    skip:         'Skip setup',
    skipStep:     'Skip this step',
    features: [
      { icon: '🕌', title: '5 Daily Prayers', sub: 'Fard is always required. Sunnah and Azkar are optional, turn them on in Settings.' },
      { icon: '📿', title: 'Dhikr & Azkar',   sub: 'Morning and evening azkar, istighfar, salawat.' },
      { icon: '📖', title: 'Quran',            sub: 'Daily pages and your personal surahs list.' },
      { icon: '🌙', title: 'Fasting',          sub: 'Ramadan, Monday/Thursday, White Days, and Qadaa tracking.' },
      { icon: '🔥', title: 'Streak System',    sub: 'Your streak is built on Salah only. Quran and dhikr add points but never break it.' },
    ],
    searchCountry: 'Search country...',
  },
  ar: {
    step1Title:   'مرحباً بك في يومياتي',
    step1Sub:     'رفيقك اليومي لمتابعة عباداتك',
    step2Title:   'أين أنت؟',
    step2Sub:     'تُستخدم لمواقيت الصلاة والتقويم الإسلامي',
    step3Title:   'بسم الله الرحمن الرحيم',
    step3Sub:     'كل رحلة عظيمة تبدأ بذكر الله',
    step3Body:    'هذا التطبيق مبني ليساعدك على الاقتراب من الله، يوماً بيوم. تابع صلواتك وقرآنك وصيامك وأذكارك بإخلاص.',
    step3Btn:     '← ابدأ بسم الله',
    step4Title:   'ما الذي جاء بك إلى هنا؟',
    step4Sub:     'اختر كل ما ينطبق — يساعدنا في تخصيص تجربتك',
    step5Title:   'كم عمرك؟',
    step5Sub:     'يساعدنا في عرض المحتوى الأنسب لك',
    step6Title:   'كيف وجدتنا؟',
    step6Sub:     'اختياري · يساعدنا في الوصول إلى المزيد من المسلمين',
    step7Title:   'كيف يعمل التطبيق',
    step7Sub:     'ما ستتابعه كل يوم',
    next:         'التالي',
    finish:       'لنبدأ ←',
    skip:         'تخطّي الإعداد',
    skipStep:     'تخطّي هذه الخطوة',
    features: [
      { icon: '🕌', title: 'الصلوات الخمس',   sub: 'الفرض دائماً مطلوب. السنة والأذكار اختيارية، فعّلها من الإعدادات.' },
      { icon: '📿', title: 'الذكر والأذكار',   sub: 'أذكار الصباح والمساء والاستغفار والصلاة على النبي.' },
      { icon: '📖', title: 'القرآن الكريم',    sub: 'الصفحات اليومية وقائمة السور الشخصية.' },
      { icon: '🌙', title: 'الصيام',           sub: 'رمضان والاثنين والخميس والأيام البيض وتتبع القضاء.' },
      { icon: '🔥', title: 'نظام السلسلة',     sub: 'السلسلة مبنية على الصلاة فقط. القرآن والذكر تضيف نقاطاً لكن لا تكسر السلسلة.' },
    ],
    searchCountry: 'ابحث عن دولة...',
  },
}

export default function Onboarding() {
  const { lang, setLang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [step,             setStep]            = useState(1)
  const [selectedLang,     setSelectedLang]    = useState<'en' | 'ar'>(lang)
  const [countryCode,      setCountryCode]     = useState('EG')
  const [countrySearch,    setCountrySearch]   = useState('')
  const [commitmentKeys,   setCommitmentKeys]  = useState<string[]>([])
  const [selectedAge,      setSelectedAge]     = useState<string | null>(null)
  const [selectedChannel,  setSelectedChannel] = useState<string | null>(null)
  const [saving,           setSaving]          = useState(false)

  const commitmentOptions = COMMITMENT_OPTIONS[lang]
  const ageOptions        = AGE_OPTIONS[lang]
  const channelOptions    = CHANNEL_OPTIONS[lang]

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c =>
        c.nameEn.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.nameAr.includes(countrySearch) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : null

  const toggleFactor = (key: string) => {
    setCommitmentKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const canContinue = () => true  // all steps optional — user can always proceed

  const finish = async () => {
    setSaving(true)
    // Save language + country
    await fetch('/api/settings', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ language: selectedLang.toUpperCase(), country: countryCode }),
    })
    setLang(selectedLang)

    // Save personalisation data
    await fetch('/api/settings/personalisation', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        commitmentFactors:  commitmentKeys,
        ageRange:           selectedAge,
        acquisitionChannel: selectedChannel,
      }),
    })

    await fetch('/api/settings/onboarding-done', { method: 'POST' })
    router.push('/today')
    router.refresh()
  }

  const skip = () => router.push('/today')

  const goNext = () => {
    if (step === 2) setLang(selectedLang)  // apply language before Bismillah screen
    setStep(s => s + 1)
  }

  // Progress percentage
  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <div dir={dir} className="flex flex-col min-h-screen bg-[#1B3025]">

      {/* Progress bar */}
      <div className="w-full h-[3px] bg-white/10 mt-10">
        <div
          className="h-full bg-[#C9AA71] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex justify-between items-center px-6 py-3">
        {step > 1 && step !== 3 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="text-white/40 text-[13px]"
          >
            {lang === 'ar' ? '←' : '←'} {lang === 'ar' ? 'رجوع' : 'Back'}
          </button>
        ) : (
          <div />
        )}
        <span className="text-[12px] text-white/30">
          {step}/{TOTAL_STEPS}
        </span>
      </div>

      {/* ── STEP 1: Language ── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col px-6 pt-4">
          <div className="text-center mb-8">
            <div className="text-[48px] mb-3">🌙</div>
            <h1 className="text-[26px] font-bold text-[#C9AA71] mb-2">{t.step1Title}</h1>
            <p className="text-[14px] text-white/50">{t.step1Sub}</p>
          </div>
          <div className="flex flex-col gap-3">
            {([['en', 'English', 'الإنجليزية'], ['ar', 'العربية', 'Arabic']] as const).map(([code, native, other]) => (
              <button
                key={code}
                onClick={() => setSelectedLang(code)}
                className={cn(
                  'flex items-center justify-between px-5 py-4 rounded-[14px] border-2 transition-all',
                  selectedLang === code
                    ? 'bg-[#C9AA71]/15 border-[#C9AA71] text-[#C9AA71]'
                    : 'bg-white/5 border-white/10 text-white/60'
                )}
              >
                <span className="text-[16px] font-semibold">{native}</span>
                <span className="text-[13px] opacity-60">{other}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Country ── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col px-6 pt-2 overflow-hidden">
          <div className="text-center mb-5">
            <h1 className="text-[22px] font-bold text-[#C9AA71] mb-1">{t.step2Title}</h1>
            <p className="text-[13px] text-white/50">{t.step2Sub}</p>
          </div>
          <input
            type="text"
            value={countrySearch}
            onChange={e => setCountrySearch(e.target.value)}
            placeholder={t.searchCountry}
            dir={dir}
            className="w-full h-[40px] rounded-[10px] bg-white/10 border border-white/10 px-3 text-[13px] text-white placeholder-white/30 mb-3 focus:outline-none focus:border-[#C9AA71]/50"
          />
          <div className="flex-1 overflow-y-auto space-y-1 pb-4">
            {(filteredCountries ?? COUNTRIES).map(c => (
              <button
                key={c.code}
                onClick={() => setCountryCode(c.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-[10px] rounded-[10px] text-left transition-all',
                  countryCode === c.code
                    ? 'bg-[#C9AA71]/15 border border-[#C9AA71]/40'
                    : 'bg-white/5 border border-transparent',
                  dir === 'rtl' && 'flex-row-reverse text-right'
                )}
              >
                <span className="text-[20px] flex-shrink-0">
                  {String.fromCodePoint(...c.code.split('').map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))}
                </span>
                <span className={cn('flex-1 text-[13px]', countryCode === c.code ? 'text-[#C9AA71]' : 'text-white/70')}>
                  {lang === 'ar' ? c.nameAr : c.nameEn}
                </span>
                {countryCode === c.code && <span className="text-[#C9AA71] text-[14px]">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Bismillah intro ── */}
      {step === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-[56px] mb-6">🕌</div>
          <h1 className="text-[28px] font-bold text-[#C9AA71] mb-3 leading-snug"
              style={{ fontFamily: 'serif' }}>
            {t.step3Title}
          </h1>
          <p className="text-[15px] text-white/70 mb-3">{t.step3Sub}</p>
          <p className="text-[13px] text-white/50 leading-relaxed max-w-[280px]">
            {t.step3Body}
          </p>
          <div className="mt-10 w-full">
            <button
              onClick={goNext}
              className="w-full py-[15px] rounded-[14px] bg-[#C9AA71] text-[#1B3025] text-[15px] font-bold"
            >
              {t.step3Btn}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Commitment factors ── */}
      {step === 4 && (
        <div className="flex-1 flex flex-col px-6 pt-2 overflow-y-auto pb-4">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-[#C9AA71] mb-1">{t.step4Title}</h1>
            <p className="text-[13px] text-white/50">{t.step4Sub}</p>
          </div>
          <div className="flex flex-col gap-3">
            {commitmentOptions.map(opt => {
              const selected = commitmentKeys.includes(opt.key)
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleFactor(opt.key)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-[14px] rounded-[14px] border-2 text-left transition-all',
                    dir === 'rtl' && 'flex-row-reverse text-right',
                    selected
                      ? 'bg-[#C9AA71]/15 border-[#C9AA71] text-[#C9AA71]'
                      : 'bg-white/5 border-white/10 text-white/70'
                  )}
                >
                  <span className="text-[20px] flex-shrink-0">{opt.label.split(' ')[0]}</span>
                  <span className="text-[14px] font-medium flex-1">
                    {opt.label.split(' ').slice(1).join(' ')}
                  </span>
                  {selected && <span className="text-[#C9AA71] text-[14px] flex-shrink-0">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: Age range ── */}
      {step === 5 && (
        <div className="flex-1 flex flex-col px-6 pt-2">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-[#C9AA71] mb-1">{t.step5Title}</h1>
            <p className="text-[13px] text-white/50">{t.step5Sub}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ageOptions.map((age, i) => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={cn(
                  'py-[16px] rounded-[14px] border-2 text-[15px] font-semibold transition-all',
                  selectedAge === age
                    ? 'bg-[#C9AA71]/15 border-[#C9AA71] text-[#C9AA71]'
                    : 'bg-white/5 border-white/10 text-white/60'
                )}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 6: Acquisition channel ── */}
      {step === 6 && (
        <div className="flex-1 flex flex-col px-6 pt-2 overflow-y-auto pb-4">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-[#C9AA71] mb-1">{t.step6Title}</h1>
            <p className="text-[13px] text-white/50">{t.step6Sub}</p>
          </div>
          <div className="flex flex-col gap-3">
            {channelOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelectedChannel(opt.key)}
                className={cn(
                  'flex items-center gap-3 px-4 py-[14px] rounded-[14px] border-2 text-left transition-all',
                  dir === 'rtl' && 'flex-row-reverse text-right',
                  selectedChannel === opt.key
                    ? 'bg-[#C9AA71]/15 border-[#C9AA71] text-[#C9AA71]'
                    : 'bg-white/5 border-white/10 text-white/70'
                )}
              >
                <span className="text-[20px] flex-shrink-0">{opt.label.split(' ')[0]}</span>
                <span className="text-[14px] font-medium flex-1">
                  {opt.label.split(' ').slice(1).join(' ')}
                </span>
                {selectedChannel === opt.key && (
                  <span className="text-[#C9AA71] text-[14px] flex-shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 7: How it works ── */}
      {step === 7 && (
        <div className="flex-1 flex flex-col px-6 pt-2 overflow-y-auto pb-4">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-[#C9AA71] mb-1">{t.step7Title}</h1>
            <p className="text-[13px] text-white/50">{t.step7Sub}</p>
          </div>
          <div className="flex flex-col gap-3">
            {t.features.map((f, i) => (
              <div key={i} className={cn(
                'flex items-start gap-3 bg-white/5 border border-white/10 rounded-[12px] p-4',
                dir === 'rtl' && 'flex-row-reverse text-right'
              )}>
                <span className="text-[22px] flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-[14px] font-semibold text-[#C9AA71]">{f.title}</p>
                  <p className="text-[12px] text-white/50 mt-[2px] leading-relaxed">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom navigation (hidden on Bismillah step 3) ── */}
      {step !== 3 && (
        <div className="px-6 pb-10 pt-4 flex flex-col gap-3">
          <button
            onClick={step < TOTAL_STEPS ? goNext : finish}
            disabled={saving || !canContinue()}
            className={cn(
              'w-full py-[15px] rounded-[14px] text-[15px] font-bold transition-all',
              canContinue()
                ? 'bg-[#C9AA71] text-[#1B3025]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            )}
          >
            {saving ? '...' : step < TOTAL_STEPS ? t.next : t.finish}
          </button>

          {/* Skip step for optional steps 4, 5 and 6 */}
          {(step === 4 || step === 5 || step === 6) && (
            <button
              onClick={() => setStep(s => s + 1)}
              className="text-center text-[13px] text-white/30"
            >
              {t.skipStep}
            </button>
          )}

          {/* Skip all for first 2 steps */}
          {step <= 2 && (
            <button onClick={skip} className="text-center text-[13px] text-white/30">
              {t.skip}
            </button>
          )}
        </div>
      )}

    </div>
  )
}
