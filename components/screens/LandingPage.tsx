'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang, LangToggle } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ─── Translations ─────────────────────────────────────────
const T = {
  en: {
    appName:     'Yawmiyyati',
    appNameAr:   'يومياتي',
    tagline:     'Your daily Islamic companion.',
    taglineSub:  'Track prayers, Quran, dhikr, fasting — with intention.',
    verse:       'وَاذْكُر رَّبَّكَ كَثِيرًا',
    verseRef:    'Remember your Lord abundantly — Āl ʿImrān 41',
    joinNow:     'Join Now — It\'s Free',
    signIn:      'Sign In',
    guestLink:   'Continue without an account',
    // Value props
    vp1Title:    'No Ads. Ever.',
    vp1Sub:      'Your ibadah is between you and Allah. We keep it that way.',
    vp2Title:    'Private by Design',
    vp2Sub:      'Your data never leaves your account. No tracking, no sharing.',
    vp3Title:    'Beautiful & Focused',
    vp3Sub:      'Designed for daily use — fast, calm, distraction-free.',
    // Features
    featuresTitle: 'Everything in one place',
    featuresSub:   'Built around how Muslims actually worship — not a generic habit tracker.',
    feat: [
      { icon: '🕌', title: '5 Daily Prayers',    sub: 'Fard, Sunnah, and Azkar — track what matters most.' },
      { icon: '📖', title: 'Quran Reading',       sub: 'Daily pages and personal surah list.' },
      { icon: '📿', title: 'Dhikr & Azkar',       sub: 'Morning, evening, istighfar, salawat.' },
      { icon: '🌙', title: 'Fasting Tracker',     sub: 'Ramadan, Monday/Thursday, White Days, Qadaa.' },
      { icon: '🔥', title: 'Streak System',       sub: 'Built on Salah. Keeps you accountable, not anxious.' },
      { icon: '🎨', title: 'Beautiful Themes',    sub: 'Change the look. Keep the feel.' },
    ],
    // How it works
    howTitle: 'Start in 60 seconds',
    steps: [
      { n: '1', title: 'Create your account',   sub: 'Free. No credit card. Takes 30 seconds.' },
      { n: '2', title: 'Set your preferences',  sub: 'Pick your country, language, and which activities to track.' },
      { n: '3', title: 'Start your day right',  sub: 'Open the app each day and check off your ibadah.' },
    ],
    // Premium
    premiumTitle: 'Go deeper with Premium',
    premiumSub:   'One small fee. Supports the project. Unlocks everything.',
    premFree: [
      '5 daily prayers',
      'Quran reading log',
      'Morning & evening azkar',
      'Basic streak tracking',
      '1 theme (Madinah Night)',
    ],
    premPaid: [
      'Everything in Free',
      'Unlimited themes',
      'Advanced statistics',
      'Priority support',
      'Help keep the app alive',
    ],
    freeLabel:    'Free',
    premLabel:    'Premium',
    premPrice:    'from $1.99 / month',
    // Final CTA
    ctaTitle:     'Begin with بسم الله',
    ctaSub:       'Join thousands of Muslims building stronger daily habits.',
    ctaBtn:       'Create Your Free Account',
    // Footer
    terms:        'Terms',
    privacy:      'Privacy',
    support:      'Support',
  },
  ar: {
    appName:     'يومياتي',
    appNameAr:   'Yawmiyyati',
    tagline:     'رفيقك الإسلامي اليومي.',
    taglineSub:  'تابع صلواتك وقرآنك وذكرك وصيامك — بنية صادقة.',
    verse:       'وَاذْكُر رَّبَّكَ كَثِيرًا',
    verseRef:    'آل عمران ٤١',
    joinNow:     'انضم الآن — مجاناً',
    signIn:      'تسجيل الدخول',
    guestLink:   'المتابعة بدون حساب',
    vp1Title:    'بلا إعلانات. أبداً.',
    vp1Sub:      'عبادتك بينك وبين الله. نحرص على ذلك.',
    vp2Title:    'خصوصية تامة',
    vp2Sub:      'بياناتك لا تغادر حسابك. لا تتبع، لا مشاركة.',
    vp3Title:    'جميل ومركّز',
    vp3Sub:      'مصمم للاستخدام اليومي — سريع وهادئ وخالٍ من المشتتات.',
    featuresTitle: 'كل شيء في مكان واحد',
    featuresSub:   'مبني حول الطريقة التي يتعبد بها المسلمون فعلاً — وليس تطبيق عادات عام.',
    feat: [
      { icon: '🕌', title: 'الصلوات الخمس',    sub: 'الفرض والسنة والأذكار — تابع الأهم.' },
      { icon: '📖', title: 'تلاوة القرآن',      sub: 'الصفحات اليومية وقائمة السور الشخصية.' },
      { icon: '📿', title: 'الذكر والأذكار',    sub: 'الصباح والمساء والاستغفار والصلاة على النبي.' },
      { icon: '🌙', title: 'متابعة الصيام',     sub: 'رمضان والاثنين والخميس والأيام البيض والقضاء.' },
      { icon: '🔥', title: 'نظام السلسلة',      sub: 'مبني على الصلاة. يحفّزك دون أن يُقلقك.' },
      { icon: '🎨', title: 'ثيمات جميلة',       sub: 'غيّر المظهر. احتفظ بالروح.' },
    ],
    howTitle: 'ابدأ في ٦٠ ثانية',
    steps: [
      { n: '١', title: 'أنشئ حسابك',          sub: 'مجاني. بدون بطاقة ائتمان. يستغرق ٣٠ ثانية.' },
      { n: '٢', title: 'اضبط تفضيلاتك',       sub: 'اختر دولتك ولغتك والأنشطة التي تريد متابعتها.' },
      { n: '٣', title: 'ابدأ يومك بخير',       sub: 'افتح التطبيق كل يوم وسجّل عباداتك.' },
    ],
    premiumTitle: 'تعمّق مع بريميوم',
    premiumSub:   'رسوم رمزية. تدعم المشروع. تفتح كل شيء.',
    premFree: [
      'الصلوات الخمس',
      'سجل تلاوة القرآن',
      'أذكار الصباح والمساء',
      'متابعة السلسلة الأساسية',
      'ثيم واحد (ليل المدينة)',
    ],
    premPaid: [
      'كل ما في النسخة المجانية',
      'ثيمات غير محدودة',
      'إحصائيات متقدمة',
      'دعم أولوية',
      'مساعدة في إبقاء التطبيق حياً',
    ],
    freeLabel:    'مجاني',
    premLabel:    'بريميوم',
    premPrice:    'من ١.٩٩$ / شهر',
    ctaTitle:     'ابدأ بـ بسم الله',
    ctaSub:       'انضم إلى آلاف المسلمين الذين يبنون عادات يومية أقوى.',
    ctaBtn:       'أنشئ حسابك المجاني',
    terms:        'الشروط',
    privacy:      'الخصوصية',
    support:      'الدعم',
  },
}

// ─── Decorative SVG background ───────────────────────────
function StarBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 390 844"
      xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <radialGradient id="lg-glow" cx="50%" cy="30%" r="55%">
        <stop offset="0%"   stopColor="#C9AA71" stopOpacity="0.13"/>
        <stop offset="100%" stopColor="#C9AA71" stopOpacity="0"/>
      </radialGradient>
      <rect width="390" height="844" fill="url(#lg-glow)"/>
      <g transform="translate(195,210)" fill="none" stroke="#C9AA71" strokeWidth="0.7" opacity="0.15">
        <polygon points="0,-88 20,-20 88,0 20,20 0,88 -20,20 -88,0 -20,-20"/>
        <polygon points="0,-62 14,-14 62,0 14,14 0,62 -14,14 -62,0 -14,-14"/>
        <circle r="96"/><circle r="66"/><circle r="34"/>
        <line x1="0" y1="-96" x2="0" y2="96"/>
        <line x1="-96" y1="0" x2="96" y2="0"/>
        <line x1="-68" y1="-68" x2="68" y2="68"/>
        <line x1="68" y1="-68" x2="-68" y2="68"/>
      </g>
      {[[36,330],[354,280],[60,440],[328,390],[88,310],[302,340]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r={i%2===0?1.4:0.9} fill="#C9AA71" opacity={i%2===0?0.28:0.16}/>
      ))}
    </svg>
  )
}

// ─── Section divider ─────────────────────────────────────
function Divider() {
  return <div className="w-10 h-px bg-[#C9AA71]/25 mx-auto my-6"/>
}

// ─── Main Component ───────────────────────────────────────
export default function LandingPage() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const go = (path: string, key: string) => {
    setLoading(key)
    router.push(path)
  }

  return (
    <div dir={dir} className="relative flex flex-col min-h-full overflow-y-auto" style={{ background: '#0D1F2D' }}>

      {/* ── STICKY TOP NAV ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-5 py-3"
        style={{ background: 'rgba(13,31,45,0.92)', backdropFilter: 'blur(12px)' }}>
        <span className="text-[16px] font-bold text-[#C9AA71] tracking-wide">{t.appName}</span>
        <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
          <LangToggle />
          <button
            onClick={() => go('/login', 'login')}
            disabled={!!loading}
            className="text-[12px] font-medium text-white/60 border border-white/15 rounded-[8px] px-3 py-[5px] active:bg-white/10 disabled:opacity-50"
          >
            {loading === 'login' ? '...' : t.signIn}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* HERO SECTION                                      */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden pt-8 pb-10 px-6">
        <StarBg />
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Lantern icon */}
          <svg width="64" height="64" viewBox="0 0 76 76" fill="none" aria-hidden="true" className="mb-4 opacity-90">
            <line x1="38" y1="2" x2="38" y2="11" stroke="#C9AA71" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M24,12 Q38,7 52,12 L56,56 Q38,63 20,56 Z" stroke="#C9AA71" strokeWidth="1.3" fill="rgba(201,170,113,0.07)"/>
            <line x1="29" y1="12" x2="26" y2="56" stroke="#C9AA71" strokeWidth="0.7" opacity="0.4"/>
            <line x1="38" y1="10" x2="38" y2="56" stroke="#C9AA71" strokeWidth="0.7" opacity="0.4"/>
            <line x1="47" y1="12" x2="50" y2="56" stroke="#C9AA71" strokeWidth="0.7" opacity="0.4"/>
            <line x1="20" y1="28" x2="56" y2="28" stroke="#C9AA71" strokeWidth="0.7" opacity="0.35"/>
            <line x1="19" y1="42" x2="57" y2="42" stroke="#C9AA71" strokeWidth="0.7" opacity="0.35"/>
            <ellipse cx="38" cy="34" rx="8" ry="10" fill="rgba(201,170,113,0.15)"/>
            <ellipse cx="38" cy="34" rx="3.5" ry="4.5" fill="rgba(201,170,113,0.32)"/>
            <path d="M22,12 Q38,5 54,12" stroke="#C9AA71" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
            <path d="M20,56 Q38,63 56,56 L53,64 Q38,70 23,64 Z" stroke="#C9AA71" strokeWidth="1.1" fill="rgba(201,170,113,0.1)"/>
          </svg>

          <h1 className="text-[30px] font-bold text-[#C9AA71] tracking-wide mb-1">{t.appName}</h1>
          <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-[#C9AA71]/45 mb-5">{t.appNameAr}</p>

          <h2 className="text-[22px] font-semibold text-white leading-tight mb-2">{t.tagline}</h2>
          <p className="text-[14px] text-white/55 leading-relaxed max-w-[280px]">{t.taglineSub}</p>

          <div className="w-10 h-px bg-[#C9AA71]/25 my-5"/>

          <p className="text-[16px] text-[#C9AA71]/75 font-light mb-1">{t.verse}</p>
          <p className="text-[10px] text-[#C9AA71]/40">{t.verseRef}</p>

          {/* CTAs */}
          <div className="w-full mt-8 flex flex-col gap-3">
            <button
              onClick={() => go('/register', 'register')}
              disabled={!!loading}
              className="w-full py-[15px] rounded-[14px] bg-[#C9AA71] text-[#0D1F2D] text-[15px] font-bold tracking-wide transition-opacity active:opacity-80 disabled:opacity-60"
            >
              {loading === 'register' ? '...' : t.joinNow}
            </button>
            <button
              onClick={() => go('/today', 'guest')}
              disabled={!!loading}
              className="text-[12px] text-white/30 py-1 active:text-white/50"
            >
              <span className="border-b border-white/15">{t.guestLink}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* VALUE PROPS                                       */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="px-5 py-8" style={{ background: '#0F2233' }}>
        <div className="flex flex-col gap-4">
          {[
            { icon: '🚫', title: t.vp1Title, sub: t.vp1Sub },
            { icon: '🔒', title: t.vp2Title, sub: t.vp2Sub },
            { icon: '✨', title: t.vp3Title, sub: t.vp3Sub },
          ].map((vp, i) => (
            <div key={i} className={cn('flex items-start gap-4', dir === 'rtl' && 'flex-row-reverse')}>
              <div className="w-10 h-10 rounded-[12px] bg-[#C9AA71]/10 flex items-center justify-center text-[20px] flex-shrink-0">
                {vp.icon}
              </div>
              <div className={dir === 'rtl' ? 'text-right' : ''}>
                <p className="text-[14px] font-semibold text-white mb-[2px]">{vp.title}</p>
                <p className="text-[12px] text-white/45 leading-relaxed">{vp.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* FEATURES                                          */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="px-5 py-8" style={{ background: '#0D1F2D' }}>
        <div className={cn('text-center mb-6', dir === 'rtl' && 'text-right')}>
          <p className="text-[18px] font-bold text-white mb-1">{t.featuresTitle}</p>
          <p className="text-[12px] text-white/45 leading-relaxed">{t.featuresSub}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {t.feat.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/8 rounded-[14px] p-4">
              <span className="text-[22px] block mb-2">{f.icon}</span>
              <p className="text-[13px] font-semibold text-[#C9AA71] mb-1">{f.title}</p>
              <p className="text-[11px] text-white/40 leading-relaxed">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                      */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="px-5 py-8" style={{ background: '#0F2233' }}>
        <p className={cn('text-[18px] font-bold text-white mb-6', dir === 'rtl' ? 'text-right' : 'text-center')}>{t.howTitle}</p>
        <div className="flex flex-col gap-4">
          {t.steps.map((s, i) => (
            <div key={i} className={cn('flex items-start gap-4', dir === 'rtl' && 'flex-row-reverse')}>
              <div className="w-9 h-9 rounded-full bg-[#C9AA71] flex items-center justify-center text-[#0D1F2D] font-bold text-[14px] flex-shrink-0">
                {s.n}
              </div>
              <div className={cn('flex-1 pt-1', dir === 'rtl' && 'text-right')}>
                <p className="text-[14px] font-semibold text-white mb-[2px]">{s.title}</p>
                <p className="text-[12px] text-white/45 leading-relaxed">{s.sub}</p>
              </div>
              {i < t.steps.length - 1 && (
                <div className="absolute" style={{ display: 'none' }}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* PREMIUM TEASER                                    */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="px-5 py-8" style={{ background: '#0D1F2D' }}>
        <div className="text-center mb-5">
          <p className="text-[18px] font-bold text-white mb-1">{t.premiumTitle}</p>
          <p className="text-[12px] text-white/45">{t.premiumSub}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Free */}
          <div className="bg-white/5 border border-white/10 rounded-[16px] p-4">
            <p className="text-[12px] font-bold text-white/50 uppercase tracking-wide mb-3">{t.freeLabel}</p>
            {t.premFree.map((item, i) => (
              <div key={i} className={cn('flex items-start gap-2 mb-2', dir === 'rtl' && 'flex-row-reverse')}>
                <span className="text-white/40 text-[11px] mt-[1px] flex-shrink-0">✓</span>
                <span className="text-[11px] text-white/50 leading-tight">{item}</span>
              </div>
            ))}
            <p className="text-[12px] font-bold text-white/30 mt-3">$0</p>
          </div>
          {/* Premium */}
          <div className="bg-[#C9AA71]/10 border border-[#C9AA71]/30 rounded-[16px] p-4">
            <p className="text-[12px] font-bold text-[#C9AA71] uppercase tracking-wide mb-3">⭐ {t.premLabel}</p>
            {t.premPaid.map((item, i) => (
              <div key={i} className={cn('flex items-start gap-2 mb-2', dir === 'rtl' && 'flex-row-reverse')}>
                <span className="text-[#C9AA71] text-[11px] mt-[1px] flex-shrink-0">✓</span>
                <span className="text-[11px] text-white/70 leading-tight">{item}</span>
              </div>
            ))}
            <p className="text-[11px] font-bold text-[#C9AA71] mt-3">{t.premPrice}</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* FINAL CTA                                         */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="px-5 py-10 text-center" style={{ background: '#0F2233' }}>
        <p className="text-[22px] font-bold text-[#C9AA71] mb-2">{t.ctaTitle}</p>
        <p className="text-[13px] text-white/50 mb-7 leading-relaxed max-w-[260px] mx-auto">{t.ctaSub}</p>
        <button
          onClick={() => go('/register', 'register2')}
          disabled={!!loading}
          className="w-full py-[16px] rounded-[14px] bg-[#C9AA71] text-[#0D1F2D] text-[15px] font-bold tracking-wide disabled:opacity-60 active:opacity-80"
        >
          {loading === 'register2' ? '...' : t.ctaBtn}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* FOOTER                                            */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="px-5 py-6 flex justify-center gap-6 safe-bottom" style={{ background: '#0D1F2D' }}>
        {[
          [t.terms,   '/terms'],
          [t.privacy, '/privacy'],
          [t.support, '/support'],
        ].map(([label, href]) => (
          <button key={href} onClick={() => router.push(href)}
            className="text-[11px] text-white/25 active:text-white/50">
            {label}
          </button>
        ))}
      </div>

    </div>
  )
}
