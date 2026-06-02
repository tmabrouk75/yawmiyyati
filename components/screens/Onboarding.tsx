'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { COUNTRIES } from '@/lib/countries'

const TOTAL_STEPS = 7

const COMMITMENT_OPTIONS = {
  en: [
    { key: 'salah',          label: 'Stay consistent with Salah',        icon: '🕌' },
    { key: 'quran',          label: 'Read Quran every day',              icon: '📖' },
    { key: 'fasting',        label: 'Track fasting & Qadaa',            icon: '🌙' },
    { key: 'dhikr',          label: 'Morning & evening Azkar',          icon: '📿' },
    { key: 'streak',         label: 'Build a long prayer streak',       icon: '🔥' },
    { key: 'habits',         label: 'Build better Islamic habits',      icon: '✅' },
    { key: 'accountability', label: 'Stay accountable daily',           icon: '🤝' },
    { key: 'ramadan',        label: 'Prepare for Ramadan',              icon: '🌟' },
  ],
  ar: [
    { key: 'salah',          label: 'الاستمرار على الصلاة',             icon: '🕌' },
    { key: 'quran',          label: 'قراءة القرآن يومياً',              icon: '📖' },
    { key: 'fasting',        label: 'تتبع الصيام والقضاء',             icon: '🌙' },
    { key: 'dhikr',          label: 'أذكار الصباح والمساء',            icon: '📿' },
    { key: 'streak',         label: 'بناء سلسلة صلاة طويلة',          icon: '🔥' },
    { key: 'habits',         label: 'تطوير عادات إسلامية أفضل',        icon: '✅' },
    { key: 'accountability', label: 'الالتزام والمحاسبة اليومية',       icon: '🤝' },
    { key: 'ramadan',        label: 'الاستعداد لرمضان',                icon: '🌟' },
  ],
}

const AGE_OPTIONS = {
  en: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'],
  ar: ['أقل من 18', '18–24', '25–34', '35–44', '45–54', '55+'],
}

const CHANNEL_OPTIONS = {
  en: [
    { key: 'friend',       label: 'Friend or family',             icon: '👥' },
    { key: 'social',       label: 'Instagram / TikTok',           icon: '📱' },
    { key: 'search',       label: 'Google / App Store',           icon: '🔍' },
    { key: 'islamic_site', label: 'Islamic website or group',     icon: '🕌' },
    { key: 'youtube',      label: 'YouTube',                      icon: '▶️' },
    { key: 'referral',     label: 'Referral link',                icon: '🎁' },
    { key: 'other',        label: 'Other',                        icon: '💬' },
  ],
  ar: [
    { key: 'friend',       label: 'صديق أو أحد أفراد العائلة',   icon: '👥' },
    { key: 'social',       label: 'إنستغرام / تيك توك',          icon: '📱' },
    { key: 'search',       label: 'بحث Google / متجر التطبيقات', icon: '🔍' },
    { key: 'islamic_site', label: 'موقع أو مجموعة إسلامية',       icon: '🕌' },
    { key: 'youtube',      label: 'يوتيوب',                      icon: '▶️' },
    { key: 'referral',     label: 'رابط إحالة',                   icon: '🎁' },
    { key: 'other',        label: 'أخرى',                        icon: '💬' },
  ],
}

const T = {
  en: {
    step1Title:  'Yawmiyyati',
    step1Sub:    'يومياتي',
    step1Tagline:'Your daily companion for a better Muslim life',
    step2Title:  'Where are you based?',
    step2Sub:    'For accurate prayer times & Islamic calendar',
    step3Title:  'بسم الله الرحمن الرحيم',
    step3Sub:    'In the name of Allah, the Most Gracious, the Most Merciful',
    step3Body:   'This app is built to help you draw closer to Allah — one prayer, one page, one dhikr at a time. Track with sincerity, grow with consistency.',
    step3Btn:    'Begin with Allah\'s name',
    step4Title:  'What brings you here?',
    step4Sub:    'Choose all that apply — we\'ll tailor your experience',
    step5Title:  'How old are you?',
    step5Sub:    'Helps us show you the most relevant experience',
    step6Title:  'How did you find us?',
    step6Sub:    'Optional · helps us reach more Muslims worldwide',
    step7Title:  'What you\'ll track',
    step7Sub:    'Everything you need, nothing you don\'t',
    next:        'Continue',
    finish:      "Let's begin →",
    skip:        'Skip setup',
    skipStep:    'Skip this step',
    searchCountry: 'Search country...',
    features: [
      { icon: '🕌', title: '5 Daily Prayers',   sub: 'Fard, Sunnah, Azkar — track every dimension of your Salah.',      color: '#059669' },
      { icon: '📿', title: 'Dhikr & Azkar',    sub: 'Morning & evening azkar, istighfar, tasbih, and salawat.',         color: '#0d9488' },
      { icon: '📖', title: 'Quran',             sub: 'Daily pages, personal surahs list, and Surah Al-Kahf on Fridays.', color: '#7c3aed' },
      { icon: '🌙', title: 'Fasting',           sub: 'Ramadan, Monday/Thursday, White Days, and Qadaa tracking.',        color: '#b45309' },
      { icon: '🔥', title: 'Streak & Score',    sub: 'Earn points every day. Your streak is built on Salah alone.',      color: '#dc2626' },
    ],
  },
  ar: {
    step1Title:  'يومياتي',
    step1Sub:    'Yawmiyyati',
    step1Tagline:'رفيقك اليومي لحياة مسلم أفضل',
    step2Title:  'أين تقيم؟',
    step2Sub:    'لمواقيت الصلاة الدقيقة والتقويم الإسلامي',
    step3Title:  'بسم الله الرحمن الرحيم',
    step3Sub:    'كل رحلة عظيمة تبدأ بذكر الله',
    step3Body:   'هذا التطبيق مبني ليساعدك على الاقتراب من الله — صلاة بصلاة، صفحة بصفحة، ذكراً بذكر. تابع بإخلاص، واثبت بانتظام.',
    step3Btn:    'ابدأ بسم الله',
    step4Title:  'ما الذي جاء بك إلى هنا؟',
    step4Sub:    'اختر كل ما ينطبق عليك — سنخصّص تجربتك',
    step5Title:  'كم عمرك؟',
    step5Sub:    'يساعدنا في تقديم التجربة الأنسب لك',
    step6Title:  'كيف وجدتنا؟',
    step6Sub:    'اختياري · يساعدنا في الوصول لمسلمين أكثر',
    step7Title:  'ما ستتابعه يومياً',
    step7Sub:    'كل ما تحتاجه، بلا زيادة ولا نقصان',
    next:        'التالي',
    finish:      '← لنبدأ',
    skip:        'تخطّي الإعداد',
    skipStep:    'تخطّي هذه الخطوة',
    searchCountry: 'ابحث عن دولة...',
    features: [
      { icon: '🕌', title: 'الصلوات الخمس',    sub: 'الفرض والسنة والأذكار — تابع كل أبعاد صلاتك.',                  color: '#059669' },
      { icon: '📿', title: 'الذكر والأذكار',    sub: 'أذكار الصباح والمساء والاستغفار والتسبيح والصلاة على النبي.',  color: '#0d9488' },
      { icon: '📖', title: 'القرآن الكريم',     sub: 'الصفحات اليومية وقائمة السور الشخصية وسورة الكهف.',            color: '#7c3aed' },
      { icon: '🌙', title: 'الصيام',            sub: 'رمضان والاثنين والخميس والأيام البيض وتتبع القضاء.',           color: '#b45309' },
      { icon: '🔥', title: 'السلسلة والنقاط',   sub: 'اجمع نقاطاً كل يوم. سلسلتك مبنية على الصلاة وحدها.',         color: '#dc2626' },
    ],
  },
}

// ── Dot progress indicator ──────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-[6px]">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width:  i + 1 === current ? 20 : 6,
            height: 6,
            background: i + 1 === current ? '#C9AA71' : i + 1 < current ? 'rgba(201,170,113,0.5)' : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  )
}

export default function Onboarding() {
  const { lang, setLang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [step,            setStep]           = useState(1)
  const [selectedLang,    setSelectedLang]   = useState<'en' | 'ar'>(lang)
  const [countryCode,     setCountryCode]    = useState('EG')
  const [countrySearch,   setCountrySearch]  = useState('')
  const [commitmentKeys,  setCommitmentKeys] = useState<string[]>([])
  const [selectedAge,     setSelectedAge]    = useState<string | null>(null)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [saving,          setSaving]         = useState(false)

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

  const toggleFactor = (key: string) =>
    setCommitmentKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const finish = async () => {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: selectedLang.toUpperCase(), country: countryCode }),
    })
    setLang(selectedLang)
    await fetch('/api/settings/personalisation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitmentFactors: commitmentKeys, ageRange: selectedAge, acquisitionChannel: selectedChannel }),
    })
    await fetch('/api/settings/onboarding-done', { method: 'POST' })
    router.push('/today')
    router.refresh()
  }

  const skip   = () => router.push('/today')
  const goNext = () => {
    if (step === 2) setLang(selectedLang)
    setStep(s => s + 1)
  }

  const flagEmoji = (code: string) =>
    String.fromCodePoint(...code.split('').map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))

  // ── Shared card style ──
  const card = (active: boolean) => cn(
    'transition-all duration-200 rounded-[16px] border-2',
    active
      ? 'bg-[#C9AA71]/15 border-[#C9AA71]'
      : 'bg-white/[0.06] border-white/10 hover:border-white/25'
  )

  return (
    /* Fixed full-screen — breaks out of phone frame wrapper */
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 20% 0%, #1a3d2e 0%, #0D1F2D 55%, #0a1520 100%)',
      }}
    >
      {/* ── Decorative background rings ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[200px] -right-[200px] w-[500px] h-[500px] rounded-full opacity-[0.06]"
             style={{ background: 'radial-gradient(circle, #C9AA71, transparent 70%)' }}/>
        <div className="absolute -bottom-[150px] -left-[150px] w-[400px] h-[400px] rounded-full opacity-[0.05]"
             style={{ background: 'radial-gradient(circle, #2D6A4F, transparent 70%)' }}/>
        {/* Subtle geometric lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#C9AA71" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* ── Header: back + dots + skip ── */}
      <div className={cn('relative z-10 flex items-center justify-between px-5 pt-12 pb-4', dir === 'rtl' && 'flex-row-reverse')}>
        {step > 1 && step !== 3 ? (
          <button onClick={() => setStep(s => s - 1)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-[16px]">
            {dir === 'rtl' ? '›' : '‹'}
          </button>
        ) : <div className="w-8" />}

        <StepDots current={step} total={TOTAL_STEPS} />

        {step <= 2 ? (
          <button onClick={skip} className="text-[12px] text-white/30 px-2">{t.skip}</button>
        ) : <div className="w-8" />}
      </div>

      {/* ── STEP 1: Welcome + Language ── */}
      {step === 1 && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-2 pb-6 overflow-y-auto">
          {/* Hero */}
          <div className="text-center pt-4 pb-8">
            <div className="text-[64px] mb-2 leading-none">🌙</div>
            <h1 className="text-[42px] font-black tracking-tight leading-none mb-1"
                style={{ background: 'linear-gradient(135deg, #E8D49E 0%, #C9AA71 50%, #A8885A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t.step1Title}
            </h1>
            <p className="text-[16px] text-white/35 font-medium tracking-widest mb-4">{t.step1Sub}</p>
            <p className="text-[15px] text-white/55 leading-relaxed max-w-[280px] mx-auto">{t.step1Tagline}</p>
          </div>

          {/* Value props */}
          <div className="flex justify-center gap-4 mb-8">
            {[
              { n: '5', label: lang === 'ar' ? 'صلوات\nيومياً' : 'Daily\nPrayers' },
              { n: '🔥', label: lang === 'ar' ? 'سلسلة\nيومية' : 'Daily\nStreak' },
              { n: '∞', label: lang === 'ar' ? 'نقاط\nمكتسبة' : 'Points\nEarned' },
            ].map((v, i) => (
              <div key={i} className="flex flex-col items-center bg-white/[0.06] border border-white/10 rounded-[14px] px-4 py-3 min-w-[80px]">
                <span className="text-[22px] font-black text-[#C9AA71]">{v.n}</span>
                <span className="text-[10px] text-white/40 text-center mt-1 leading-tight whitespace-pre-line">{v.label}</span>
              </div>
            ))}
          </div>

          {/* Language selector */}
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 text-center mb-3">
            {lang === 'ar' ? 'اختر لغتك' : 'Choose your language'}
          </p>
          <div className="flex flex-col gap-3">
            {([['en', 'English', 'الإنجليزية', '🇬🇧'], ['ar', 'العربية', 'Arabic', '🇸🇦']] as const).map(([code, native, other, flag]) => (
              <button
                key={code}
                onClick={() => setSelectedLang(code)}
                className={cn('flex items-center gap-4 px-5 py-4 transition-all', card(selectedLang === code))}
              >
                <span className="text-[28px]">{flag}</span>
                <div className="flex-1 text-left" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                  <p className={cn('text-[16px] font-bold', selectedLang === code ? 'text-[#C9AA71]' : 'text-white')}>{native}</p>
                  <p className="text-[12px] text-white/30">{other}</p>
                </div>
                {selectedLang === code && (
                  <div className="w-5 h-5 rounded-full bg-[#C9AA71] flex items-center justify-center">
                    <span className="text-[10px] font-black text-[#1B3025]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Country ── */}
      {step === 2 && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-2 overflow-hidden">
          <div className="text-center mb-5">
            <div className="text-[36px] mb-2">📍</div>
            <h1 className="text-[24px] font-bold text-white mb-1">{t.step2Title}</h1>
            <p className="text-[13px] text-white/40">{t.step2Sub}</p>
          </div>
          <div className="relative mb-3">
            <input
              type="text"
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              placeholder={t.searchCountry}
              dir={dir}
              className="w-full h-[44px] rounded-[12px] bg-white/10 border border-white/15 px-4 text-[13px] text-white placeholder-white/25 focus:outline-none focus:border-[#C9AA71]/60 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-[14px]"
                  style={{ left: dir === 'rtl' ? 12 : 'auto', right: dir === 'rtl' ? 'auto' : 12 }}>🔍</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pb-4">
            {(filteredCountries ?? COUNTRIES).map(c => (
              <button
                key={c.code}
                onClick={() => setCountryCode(c.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-[11px] rounded-[12px] text-left transition-all',
                  countryCode === c.code
                    ? 'bg-[#C9AA71]/15 border border-[#C9AA71]/50'
                    : 'bg-white/[0.04] border border-transparent hover:border-white/10',
                  dir === 'rtl' && 'flex-row-reverse text-right'
                )}
              >
                <span className="text-[22px] flex-shrink-0">{flagEmoji(c.code)}</span>
                <span className={cn('flex-1 text-[13px]', countryCode === c.code ? 'text-[#C9AA71] font-semibold' : 'text-white/65')}>
                  {lang === 'ar' ? c.nameAr : c.nameEn}
                </span>
                {countryCode === c.code && (
                  <div className="w-4 h-4 rounded-full bg-[#C9AA71] flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-black text-[#1B3025]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: Bismillah ── */}
      {step === 3 && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
          {/* Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[280px] h-[280px] rounded-full opacity-10"
                 style={{ background: 'radial-gradient(circle, #C9AA71, transparent 70%)' }}/>
          </div>

          <div className="relative">
            <div className="text-[60px] mb-6">🕌</div>
            <h1 className="text-[32px] font-black mb-3 leading-tight"
                style={{ fontFamily: 'serif', background: 'linear-gradient(135deg, #E8D49E, #C9AA71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t.step3Title}
            </h1>
            <p className="text-[15px] text-white/60 mb-4 leading-relaxed">{t.step3Sub}</p>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[300px]">{t.step3Body}</p>

            <button
              onClick={goNext}
              className="mt-10 w-full py-[16px] rounded-[16px] text-[15px] font-bold transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #C9AA71, #A8885A)', color: '#0D1F2D' }}
            >
              {t.step3Btn}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Commitment ── */}
      {step === 4 && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-2 overflow-y-auto pb-4">
          <div className="text-center mb-5">
            <div className="text-[36px] mb-2">🎯</div>
            <h1 className="text-[24px] font-bold text-white mb-1">{t.step4Title}</h1>
            <p className="text-[13px] text-white/40">{t.step4Sub}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {commitmentOptions.map(opt => {
              const active = commitmentKeys.includes(opt.key)
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleFactor(opt.key)}
                  className={cn('flex flex-col items-center gap-2 px-3 py-4 text-center transition-all', card(active))}
                >
                  <span className="text-[26px]">{opt.icon}</span>
                  <span className={cn('text-[12px] font-medium leading-snug', active ? 'text-[#C9AA71]' : 'text-white/65')}>
                    {opt.label}
                  </span>
                  {active && (
                    <div className="w-4 h-4 rounded-full bg-[#C9AA71] flex items-center justify-center">
                      <span className="text-[8px] font-black text-[#1B3025]">✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: Age ── */}
      {step === 5 && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-2">
          <div className="text-center mb-6">
            <div className="text-[36px] mb-2">🙋</div>
            <h1 className="text-[24px] font-bold text-white mb-1">{t.step5Title}</h1>
            <p className="text-[13px] text-white/40">{t.step5Sub}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ageOptions.map(age => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={cn('py-[18px] text-[15px] font-bold transition-all', card(selectedAge === age),
                  selectedAge === age ? 'text-[#C9AA71]' : 'text-white/60'
                )}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 6: Channel ── */}
      {step === 6 && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-2 overflow-y-auto pb-4">
          <div className="text-center mb-5">
            <div className="text-[36px] mb-2">📡</div>
            <h1 className="text-[24px] font-bold text-white mb-1">{t.step6Title}</h1>
            <p className="text-[13px] text-white/40">{t.step6Sub}</p>
          </div>
          <div className="flex flex-col gap-2">
            {channelOptions.map(opt => {
              const active = selectedChannel === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedChannel(opt.key)}
                  className={cn('flex items-center gap-4 px-4 py-[13px] transition-all', card(active),
                    dir === 'rtl' && 'flex-row-reverse'
                  )}
                >
                  <span className="text-[22px] flex-shrink-0">{opt.icon}</span>
                  <span className={cn('flex-1 text-[14px] font-medium text-left', dir === 'rtl' && 'text-right', active ? 'text-[#C9AA71]' : 'text-white/65')}>
                    {opt.label}
                  </span>
                  {active && (
                    <div className="w-5 h-5 rounded-full bg-[#C9AA71] flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-black text-[#1B3025]">✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP 7: Features ── */}
      {step === 7 && (
        <div className="relative z-10 flex-1 flex flex-col px-6 pt-2 overflow-y-auto pb-4">
          <div className="text-center mb-5">
            <div className="text-[36px] mb-2">✨</div>
            <h1 className="text-[24px] font-bold text-white mb-1">{t.step7Title}</h1>
            <p className="text-[13px] text-white/40">{t.step7Sub}</p>
          </div>
          <div className="flex flex-col gap-3">
            {t.features.map((f, i) => (
              <div key={i} className={cn('flex items-center gap-4 bg-white/[0.06] border border-white/10 rounded-[16px] p-4',
                dir === 'rtl' && 'flex-row-reverse')}>
                <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center flex-shrink-0 text-[22px]"
                     style={{ background: f.color + '22', border: `1px solid ${f.color}44` }}>
                  {f.icon}
                </div>
                <div className={dir === 'rtl' ? 'text-right' : ''}>
                  <p className="text-[14px] font-bold text-white">{f.title}</p>
                  <p className="text-[12px] text-white/40 mt-[2px] leading-relaxed">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom CTA (hidden on Bismillah step 3) ── */}
      {step !== 3 && (
        <div className="relative z-10 px-6 pb-10 pt-3 flex flex-col gap-2">
          <button
            onClick={step < TOTAL_STEPS ? goNext : finish}
            disabled={saving}
            className="w-full py-[16px] rounded-[16px] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #C9AA71, #A8885A)', color: '#0D1F2D' }}
          >
            {saving ? '...' : step < TOTAL_STEPS ? t.next : t.finish}
          </button>

          {(step === 4 || step === 5 || step === 6) && (
            <button onClick={() => setStep(s => s + 1)} className="text-center text-[12px] text-white/25 py-1">
              {t.skipStep}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
