'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang, LangToggle } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const T = {
  en: {
    appName:     'Yawmiyyati',
    appNameAr:   'يومياتي',
    heroTag:     'Your daily Islamic companion',
    heroTitle1:  'Every prayer.',
    heroTitle2:  'Every page.',
    heroTitle3:  'Every day.',
    heroSub:     'Track your prayers, Quran, fasting, and dhikr — with intention and consistency.',
    verse:       'وَاذْكُر رَّبَّكَ كَثِيرًا',
    verseRef:    'Remember your Lord abundantly — Āl ʿImrān 41',
    joinNow:     'Start Free — Join Now',
    signIn:      'Sign In',
    guestLink:   'Continue without an account →',
    social1:     'Free forever',
    social2:     'No ads, ever',
    social3:     'Private by design',
    vpTitle:     'Built for Muslims. Only for Muslims.',
    vp: [
      { icon: '🚫', title: 'Zero Ads. Zero Distractions.', sub: 'Your ibadah is between you and Allah. We keep it that way — no ads, no tracking, no noise.' },
      { icon: '🔒', title: 'Your Data Stays Yours.',       sub: 'We never sell or share your data. Your worship log is private, always.' },
      { icon: '⚡', title: 'Fast, Calm, Focused.',         sub: 'Designed for daily use in under 60 seconds. No bloat, no complexity.' },
    ],
    featuresTitle: 'Everything you need. Nothing you don\'t.',
    featuresSub:   'Built around how Muslims actually worship — not a generic habit tracker dressed up in Islamic branding.',
    feat: [
      { icon: '🕌', title: '5 Daily Prayers',   sub: 'Track Fard, Sunnah rawatib, and post-prayer Azkar for each salah.',      color: '#059669' },
      { icon: '📖', title: 'Quran Reading',      sub: 'Daily pages, personal surahs list, and Al-Kahf on Fridays.',             color: '#7c3aed' },
      { icon: '📿', title: 'Dhikr & Azkar',     sub: 'Morning & evening azkar, istighfar, tasbih, and Salawat on the Prophet.', color: '#0d9488' },
      { icon: '🌙', title: 'Fasting Tracker',    sub: 'Ramadan, Monday & Thursday, White Days, and Qadaa records.',             color: '#b45309' },
      { icon: '🔥', title: 'Streak & Score',     sub: 'Daily points system. Your streak is built on Salah — nothing else.',     color: '#dc2626' },
      { icon: '🎨', title: 'Beautiful Themes',   sub: 'Premium themes that transform the entire feel of the app.',              color: '#C9AA71' },
    ],
    howTitle: 'Start in 60 seconds',
    steps: [
      { n: '01', title: 'Create your free account', sub: 'No credit card. No commitment. 30 seconds.' },
      { n: '02', title: 'Set your preferences',     sub: 'Pick your country, language, and which activities matter to you.' },
      { n: '03', title: 'Start your day right',     sub: 'Open the app each morning and check off your ibadah as you go.' },
    ],
    premiumTitle: 'Free forever — or go deeper',
    premiumSub:   'Start free. Upgrade when you\'re ready. Cancel anytime.',
    premFree:  ['5 daily prayers tracking', 'Quran reading log', 'Morning & evening azkar', 'Fasting tracker', 'Basic streak & score'],
    premPaid:  ['Everything in Free', 'Unlimited beautiful themes', 'Advanced reports & charts', 'Export your data (CSV)', 'Priority support'],
    freeLabel:   'Free',
    premLabel:   'Premium',
    premPrice:   'from $1.99 / month',
    ctaTitle:    'ابدأ بسم الله',
    ctaSub:      'Join Muslims around the world building stronger daily habits, one prayer at a time.',
    ctaBtn:      'Create Your Free Account',
    terms: 'Terms', privacy: 'Privacy', support: 'Support',
  },
  ar: {
    appName:     'يومياتي',
    appNameAr:   'Yawmiyyati',
    heroTag:     'رفيقك الإسلامي اليومي',
    heroTitle1:  'كل صلاة.',
    heroTitle2:  'كل صفحة.',
    heroTitle3:  'كل يوم.',
    heroSub:     'تابع صلواتك وقرآنك وصيامك وأذكارك — بنية صادقة واستمرارية حقيقية.',
    verse:       'وَاذْكُر رَّبَّكَ كَثِيرًا',
    verseRef:    'آل عمران ٤١',
    joinNow:     'ابدأ مجاناً — انضم الآن',
    signIn:      'تسجيل الدخول',
    guestLink:   '← المتابعة بدون حساب',
    social1:     'مجاني دائماً',
    social2:     'بلا إعلانات أبداً',
    social3:     'خصوصية تامة',
    vpTitle:     'مبني للمسلمين. للمسلمين فقط.',
    vp: [
      { icon: '🚫', title: 'صفر إعلانات. صفر مشتتات.',   sub: 'عبادتك بينك وبين الله. لا إعلانات، لا تتبع، لا ضوضاء.' },
      { icon: '🔒', title: 'بياناتك ملكك وحدك.',          sub: 'لا نبيع أو نشارك بياناتك أبداً. سجل عبادتك خاص دائماً.' },
      { icon: '⚡', title: 'سريع وهادئ ومركّز.',           sub: 'مصمم للاستخدام اليومي في أقل من ٦٠ ثانية. بساطة بلا تعقيد.' },
    ],
    featuresTitle: 'كل ما تحتاجه. بلا زيادة.',
    featuresSub:   'مبني حول الطريقة التي يتعبد بها المسلمون فعلاً — وليس تطبيق عادات عام بمظهر إسلامي.',
    feat: [
      { icon: '🕌', title: 'الصلوات الخمس',    sub: 'الفرض والسنة الراتبة والأذكار بعد كل صلاة.',                color: '#059669' },
      { icon: '📖', title: 'تلاوة القرآن',      sub: 'الصفحات اليومية وقائمة السور الشخصية وسورة الكهف.',         color: '#7c3aed' },
      { icon: '📿', title: 'الذكر والأذكار',    sub: 'أذكار الصباح والمساء والاستغفار والتسبيح والصلاة على النبي.', color: '#0d9488' },
      { icon: '🌙', title: 'متابعة الصيام',     sub: 'رمضان والاثنين والخميس والأيام البيض وسجلات القضاء.',        color: '#b45309' },
      { icon: '🔥', title: 'السلسلة والنقاط',   sub: 'نظام نقاط يومي. سلسلتك مبنية على الصلاة وحدها.',            color: '#dc2626' },
      { icon: '🎨', title: 'ثيمات جميلة',       sub: 'ثيمات مميزة تغيّر طابع التطبيق بالكامل.',                   color: '#C9AA71' },
    ],
    howTitle: 'ابدأ في ٦٠ ثانية',
    steps: [
      { n: '٠١', title: 'أنشئ حسابك المجاني',      sub: 'بدون بطاقة ائتمان. بدون التزامات. ٣٠ ثانية فقط.' },
      { n: '٠٢', title: 'اضبط تفضيلاتك',           sub: 'اختر دولتك ولغتك والأنشطة التي تهمك.' },
      { n: '٠٣', title: 'ابدأ يومك بخير',           sub: 'افتح التطبيق كل صباح وسجّل عباداتك أولاً بأول.' },
    ],
    premiumTitle: 'مجاني للأبد — أو تعمّق أكثر',
    premiumSub:   'ابدأ مجاناً. ارتقِ عندما تكون مستعداً. ألغِ في أي وقت.',
    premFree:  ['متابعة الصلوات الخمس', 'سجل تلاوة القرآن', 'أذكار الصباح والمساء', 'متابعة الصيام', 'السلسلة والنقاط الأساسية'],
    premPaid:  ['كل ما في النسخة المجانية', 'ثيمات جميلة غير محدودة', 'تقارير وإحصائيات متقدمة', 'تصدير البيانات (CSV)', 'دعم أولوية'],
    freeLabel:   'مجاني',
    premLabel:   'بريميوم',
    premPrice:   'من ١.٩٩$ / شهر',
    ctaTitle:    'ابدأ بسم الله',
    ctaSub:      'انضم إلى مسلمين حول العالم يبنون عادات يومية أقوى، صلاةً بصلاة.',
    ctaBtn:      'أنشئ حسابك المجاني',
    terms: 'الشروط', privacy: 'الخصوصية', support: 'الدعم',
  },
}

export default function LandingPage() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const go = (path: string, key: string) => { setLoading(key); router.push(path) }

  return (
    /* Full-screen — breaks out of phone frame */
    <div
      dir={dir}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: '#0D1F2D', fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >

      {/* ── STICKY NAV ── */}
      <nav className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 border-b border-white/[0.06]"
           style={{ background: 'rgba(13,31,45,0.95)', backdropFilter: 'blur(16px)' }}>
        <div className={cn('flex items-center gap-2', dir === 'rtl' && 'flex-row-reverse')}>
          <span className="text-[18px]">🌙</span>
          <span className="text-[17px] font-black tracking-tight"
                style={{ background: 'linear-gradient(135deg, #E8D49E, #C9AA71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.appName}
          </span>
        </div>
        <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
          <LangToggle />
          <button onClick={() => go('/login', 'login')} disabled={!!loading}
            className="text-[12px] font-semibold text-white/60 border border-white/15 rounded-[8px] px-3 py-[6px] hover:border-white/30 transition-colors disabled:opacity-50">
            {loading === 'login' ? '...' : t.signIn}
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #0D1F2D 0%, #132d1f 50%, #0D1F2D 100%)' }}>

        {/* Background glow + geometry */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.12]"
               style={{ background: 'radial-gradient(circle, #C9AA71, transparent 65%)' }}/>
          {/* Islamic star */}
          <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] opacity-[0.07]"
               viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(250,170)" stroke="#C9AA71" strokeWidth="0.8" fill="none">
              <polygon points="0,-120 28,-28 120,0 28,28 0,120 -28,28 -120,0 -28,-28"/>
              <polygon points="0,-85 20,-20 85,0 20,20 0,85 -20,20 -85,0 -20,-20"/>
              <circle r="130"/><circle r="92"/><circle r="48"/>
              <line x1="0" y1="-130" x2="0" y2="130"/>
              <line x1="-130" y1="0" x2="130" y2="0"/>
              <line x1="-92" y1="-92" x2="92" y2="92"/>
              <line x1="92" y1="-92" x2="-92" y2="92"/>
            </g>
          </svg>
        </div>

        <div className="relative z-10 max-w-[680px] mx-auto px-6 pt-16 pb-14 text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-[#C9AA71]/10 border border-[#C9AA71]/25 rounded-full px-4 py-[6px] mb-8">
            <span className="text-[11px] font-bold text-[#C9AA71] tracking-widest uppercase">{t.heroTag}</span>
          </div>

          {/* Main headline */}
          <h1 className="font-black leading-[1.05] mb-6" style={{ fontSize: 'clamp(38px, 8vw, 72px)' }}>
            <span className="block text-white">{t.heroTitle1}</span>
            <span className="block text-white">{t.heroTitle2}</span>
            <span className="block"
                  style={{ background: 'linear-gradient(135deg, #E8D49E 0%, #C9AA71 50%, #A8885A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t.heroTitle3}
            </span>
          </h1>

          <p className="text-[15px] text-white/55 leading-relaxed max-w-[380px] mx-auto mb-8">{t.heroSub}</p>

          {/* Social proof pills */}
          <div className="flex justify-center flex-wrap gap-2 mb-10">
            {[t.social1, t.social2, t.social3].map((s, i) => (
              <span key={i} className="text-[11px] font-semibold text-[#C9AA71]/70 bg-[#C9AA71]/08 border border-[#C9AA71]/20 rounded-full px-3 py-[4px]">
                ✓ {s}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3 max-w-[340px] mx-auto">
            <button onClick={() => go('/register', 'register')} disabled={!!loading}
              className="w-full py-[16px] rounded-[16px] text-[15px] font-black tracking-wide transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #C9AA71 0%, #A8885A 100%)', color: '#0D1F2D', boxShadow: '0 8px 32px rgba(201,170,113,0.3)' }}>
              {loading === 'register' ? '...' : t.joinNow}
            </button>
            <button onClick={() => go('/today', 'guest')} disabled={!!loading}
              className="text-[12px] text-white/25 hover:text-white/45 transition-colors py-1">
              {t.guestLink}
            </button>
          </div>

          {/* Quranic verse */}
          <div className="mt-12 pt-8 border-t border-white/[0.07]">
            <p className="text-[18px] text-[#C9AA71]/65 font-light mb-1" style={{ fontFamily: 'serif' }}>{t.verse}</p>
            <p className="text-[11px] text-white/25">{t.verseRef}</p>
          </div>
        </div>
      </section>

      {/* ══ VALUE PROPS ══ */}
      <section className="px-5 py-14 max-w-[680px] mx-auto">
        <h2 className={cn('text-[22px] font-black text-white mb-8', dir === 'rtl' ? 'text-right' : 'text-center')}>{t.vpTitle}</h2>
        <div className="grid gap-4">
          {t.vp.map((v, i) => (
            <div key={i} className={cn('flex items-start gap-5 bg-white/[0.04] border border-white/[0.08] rounded-[18px] p-5 hover:border-white/[0.14] transition-colors', dir === 'rtl' && 'flex-row-reverse')}>
              <div className="w-12 h-12 rounded-[14px] bg-[#C9AA71]/10 border border-[#C9AA71]/20 flex items-center justify-center text-[22px] flex-shrink-0">
                {v.icon}
              </div>
              <div className={dir === 'rtl' ? 'text-right' : ''}>
                <p className="text-[15px] font-bold text-white mb-1">{v.title}</p>
                <p className="text-[13px] text-white/40 leading-relaxed">{v.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="px-5 py-14 max-w-[680px] mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className={cn('mb-10', dir === 'rtl' ? 'text-right' : 'text-center')}>
          <h2 className="text-[22px] font-black text-white mb-2">{t.featuresTitle}</h2>
          <p className="text-[13px] text-white/40 leading-relaxed max-w-[400px] mx-auto">{t.featuresSub}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {t.feat.map((f, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-[18px] p-5 hover:border-white/[0.14] transition-colors">
              <div className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[22px] mb-3 flex-shrink-0"
                   style={{ background: f.color + '18', border: `1px solid ${f.color}30` }}>
                {f.icon}
              </div>
              <p className="text-[13px] font-bold text-white mb-1">{f.title}</p>
              <p className="text-[11px] text-white/35 leading-relaxed">{f.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="px-5 py-14 max-w-[680px] mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className={cn('text-[22px] font-black text-white mb-10', dir === 'rtl' ? 'text-right' : 'text-center')}>{t.howTitle}</h2>
        <div className="flex flex-col gap-0">
          {t.steps.map((s, i) => (
            <div key={i} className={cn('flex items-start gap-5 relative', dir === 'rtl' && 'flex-row-reverse')}>
              {/* Connector line */}
              {i < t.steps.length - 1 && (
                <div className="absolute left-[22px] top-[48px] w-[2px] h-[calc(100%-4px)] bg-gradient-to-b from-[#C9AA71]/40 to-transparent"
                     style={{ left: dir === 'rtl' ? 'auto' : 22, right: dir === 'rtl' ? 22 : 'auto' }}/>
              )}
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-[13px] flex-shrink-0 relative z-10"
                   style={{ background: 'linear-gradient(135deg, #C9AA71, #A8885A)', color: '#0D1F2D' }}>
                {s.n}
              </div>
              <div className={cn('flex-1 pb-10', dir === 'rtl' && 'text-right')}>
                <p className="text-[15px] font-bold text-white mb-1">{s.title}</p>
                <p className="text-[13px] text-white/40 leading-relaxed">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PREMIUM ══ */}
      <section className="px-5 py-14 max-w-[680px] mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className={cn('mb-8', dir === 'rtl' ? 'text-right' : 'text-center')}>
          <h2 className="text-[22px] font-black text-white mb-2">{t.premiumTitle}</h2>
          <p className="text-[13px] text-white/40">{t.premiumSub}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Free */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-5">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-4">{t.freeLabel}</p>
            <p className="text-[28px] font-black text-white mb-1">$0</p>
            <p className="text-[11px] text-white/30 mb-5">forever</p>
            {t.premFree.map((item, i) => (
              <div key={i} className={cn('flex items-start gap-2 mb-2', dir === 'rtl' && 'flex-row-reverse')}>
                <span className="text-white/30 text-[10px] mt-[2px] flex-shrink-0">✓</span>
                <span className="text-[11px] text-white/45 leading-snug">{item}</span>
              </div>
            ))}
          </div>
          {/* Premium */}
          <div className="rounded-[20px] p-5 relative overflow-hidden"
               style={{ background: 'linear-gradient(145deg, rgba(201,170,113,0.12), rgba(201,170,113,0.06))', border: '1px solid rgba(201,170,113,0.35)' }}>
            <div className="absolute top-3 right-3 bg-[#C9AA71] text-[#0D1F2D] text-[9px] font-black px-2 py-[3px] rounded-full uppercase tracking-wide"
                 style={{ left: dir === 'rtl' ? 12 : 'auto', right: dir === 'rtl' ? 'auto' : 12 }}>
              ⭐ {t.premLabel}
            </div>
            <p className="text-[11px] font-black text-[#C9AA71]/60 uppercase tracking-widest mb-4">{t.premLabel}</p>
            <p className="text-[28px] font-black text-[#C9AA71] mb-1">{t.premPrice.split('/')[0]}</p>
            <p className="text-[11px] text-[#C9AA71]/40 mb-5">/ {t.premPrice.split('/')[1]}</p>
            {t.premPaid.map((item, i) => (
              <div key={i} className={cn('flex items-start gap-2 mb-2', dir === 'rtl' && 'flex-row-reverse')}>
                <span className="text-[#C9AA71] text-[10px] mt-[2px] flex-shrink-0">✓</span>
                <span className="text-[11px] text-white/65 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="px-5 py-16 text-center max-w-[680px] mx-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-[48px] mb-5">🌙</div>
        <h2 className="text-[28px] font-black mb-3"
            style={{ background: 'linear-gradient(135deg, #E8D49E, #C9AA71)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {t.ctaTitle}
        </h2>
        <p className="text-[14px] text-white/45 mb-8 max-w-[320px] mx-auto leading-relaxed">{t.ctaSub}</p>
        <button onClick={() => go('/register', 'register2')} disabled={!!loading}
          className="w-full max-w-[340px] py-[17px] rounded-[16px] text-[16px] font-black tracking-wide mx-auto block transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #C9AA71 0%, #A8885A 100%)', color: '#0D1F2D', boxShadow: '0 12px 40px rgba(201,170,113,0.35)' }}>
          {loading === 'register2' ? '...' : t.ctaBtn}
        </button>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="px-5 py-6 flex justify-center gap-8 border-t border-white/[0.06]">
        {[[t.terms, '/terms'], [t.privacy, '/privacy'], [t.support, '/support']].map(([label, href]) => (
          <button key={href} onClick={() => router.push(href)}
            className="text-[11px] text-white/20 hover:text-white/45 transition-colors">
            {label}
          </button>
        ))}
      </footer>

    </div>
  )
}
