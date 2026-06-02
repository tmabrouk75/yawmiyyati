'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang, LangToggle } from '@/contexts/LanguageContext'

const T = {
  en: {
    appName:    'Yawmiyyati',
    appNameAr:  'يومياتي',
    tagline:    'Track your daily ibadah with intention.',
    taglineSub: 'Prayers · Quran · Dhikr · and more',
    verse:      'وَاذْكُر رَّبَّكَ كَثِيرًا',
    verseRef:   'Remember your Lord abundantly · Āl ʿImrān 41',
    createBtn:  'Create an account',
    loginBtn:   'Sign in',
    guestLink:  'Continue without an account',
  },
  ar: {
    appName:    'يومياتي',
    appNameAr:  'Yawmiyyati',
    tagline:    'تابع عباداتك اليومية بنية صادقة.',
    taglineSub: 'الصلاة · القرآن · الذكر · والمزيد',
    verse:      'وَاذْكُر رَّبَّكَ كَثِيرًا',
    verseRef:   'آل عمران ٤١',
    createBtn:  'إنشاء حساب',
    loginBtn:   'تسجيل الدخول',
    guestLink:  'المتابعة بدون حساب',
  },
}

export default function Entrance() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const go = (path: string, key: string) => {
    setLoading(key)
    router.push(path)
  }

  return (
    <div
      dir={dir}
      className="relative flex flex-col h-full entrance-bg overflow-hidden"
      style={{ background: '#0D1F2D' }}
    >

      {/* ── Background geometric SVG ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 390 844"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Radial glow */}
        <radialGradient id="glow" cx="50%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#C9AA71" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#C9AA71" stopOpacity="0"/>
        </radialGradient>
        <rect width="390" height="844" fill="url(#glow)"/>

        {/* 8-point star — top centre */}
        <g transform="translate(195,220)" fill="none" stroke="#C9AA71" strokeWidth="0.7" opacity="0.18">
          <polygon points="0,-88 20,-20 88,0 20,20 0,88 -20,20 -88,0 -20,-20"/>
          <polygon points="0,-62 14,-14 62,0 14,14 0,62 -14,14 -62,0 -14,-14"/>
          <circle r="96"/>
          <circle r="66"/>
          <circle r="34"/>
          <line x1="0" y1="-96" x2="0"  y2="96"/>
          <line x1="-96" y1="0" x2="96" y2="0"/>
          <line x1="-68" y1="-68" x2="68" y2="68"/>
          <line x1="68"  y1="-68" x2="-68" y2="68"/>
        </g>

        {/* Arch lines at top */}
        <path d="M40,0 Q195,-50 350,0"  stroke="#C9AA71" strokeWidth="0.8" fill="none" opacity="0.12"/>
        <path d="M10,24 Q195,-80 380,24" stroke="#C9AA71" strokeWidth="0.5" fill="none" opacity="0.07"/>

        {/* Corner ornaments */}
        <g stroke="#C9AA71" strokeWidth="0.7" fill="none" opacity="0.14">
          <path d="M0,80 Q22,58 44,80 Q22,102 0,80"/>
          <path d="M390,80 Q368,58 346,80 Q368,102 390,80"/>
        </g>

        {/* Star dots scattered */}
        {[
          [36,340],[354,290],[60,440],[328,400],[195,480],
          [88,310],[302,350],[148,520],[244,510]
        ].map(([cx,cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i%3===0?1.4:0.9} fill="#C9AA71" opacity={i%2===0?0.28:0.18}/>
        ))}

        {/* Bottom fade */}
        <linearGradient id="fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0D1F2D" stopOpacity="0"/>
          <stop offset="100%" stopColor="#0D1F2D" stopOpacity="0.7"/>
        </linearGradient>
        <rect y="560" width="390" height="284" fill="url(#fade)"/>
      </svg>

      {/* ── Status bar spacer ── */}
      <div className="safe-top h-12 flex-shrink-0"/>

      {/* ── Lang toggle — top right ── */}
      <div className={`absolute top-12 ${lang === 'ar' ? 'left-5' : 'right-5'} z-20`}>
        <LangToggle />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col flex-1 items-center px-7">

        {/* TOP — Lantern + name */}
        <div className="flex flex-col items-center mt-10">
          {/* Lantern SVG */}
          <svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-label="Lantern" className="mb-5">
            {/* Chain */}
            <line x1="38" y1="2"  x2="38" y2="11" stroke="#C9AA71" strokeWidth="1.5" strokeLinecap="round"/>
            {/* Body */}
            <path d="M24,12 Q38,7 52,12 L56,56 Q38,63 20,56 Z" stroke="#C9AA71" strokeWidth="1.3" fill="rgba(201,170,113,0.07)"/>
            {/* Vertical stripes */}
            <line x1="29" y1="12" x2="26" y2="56" stroke="#C9AA71" strokeWidth="0.7" opacity="0.4"/>
            <line x1="38" y1="10" x2="38" y2="56" stroke="#C9AA71" strokeWidth="0.7" opacity="0.4"/>
            <line x1="47" y1="12" x2="50" y2="56" stroke="#C9AA71" strokeWidth="0.7" opacity="0.4"/>
            {/* Horizontal bands */}
            <line x1="20" y1="28" x2="56" y2="28" stroke="#C9AA71" strokeWidth="0.7" opacity="0.35"/>
            <line x1="19" y1="42" x2="57" y2="42" stroke="#C9AA71" strokeWidth="0.7" opacity="0.35"/>
            {/* Glow core */}
            <ellipse cx="38" cy="34" rx="8"  ry="10" fill="rgba(201,170,113,0.15)"/>
            <ellipse cx="38" cy="34" rx="3.5" ry="4.5" fill="rgba(201,170,113,0.32)"/>
            {/* Cap */}
            <path d="M22,12 Q38,5 54,12" stroke="#C9AA71" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
            {/* Base */}
            <path d="M20,56 Q38,63 56,56 L53,64 Q38,70 23,64 Z" stroke="#C9AA71" strokeWidth="1.1" fill="rgba(201,170,113,0.1)"/>
            {/* Tail */}
            <path d="M30,64 Q38,73 46,64" stroke="#C9AA71" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <line x1="38" y1="73" x2="38" y2="77" stroke="#C9AA71" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>

          <h1 className="text-[28px] font-semibold text-gold-gradient tracking-wide">
            {t.appName}
          </h1>
          <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-brand-gold/50 mt-1">
            {t.appNameAr}
          </p>
        </div>

        {/* MID — tagline + verse */}
        <div className="flex flex-col items-center mt-auto mb-auto pt-6">
          <p className="text-[15px] text-white/60 text-center leading-relaxed max-w-[260px]">
            {t.tagline}
          </p>
          <p className="text-[12px] text-white/35 text-center mt-1">{t.taglineSub}</p>

          <div className="w-10 h-px bg-brand-gold/25 my-5"/>

          <p className="text-[17px] text-brand-gold/80 text-center leading-loose font-light">
            {t.verse}
          </p>
          <p className="text-[10px] text-brand-gold/40 text-center mt-1 leading-relaxed max-w-[240px]">
            {t.verseRef}
          </p>
        </div>

        {/* BOTTOM — buttons */}
        <div className="w-full pb-8 safe-bottom flex flex-col gap-3 mt-auto">
          <button
            onClick={() => go('/register', 'register')}
            disabled={!!loading}
            className="w-full py-[15px] rounded-[14px] bg-brand-gold text-brand-navy text-[15px] font-semibold tracking-wide transition-opacity active:opacity-80 disabled:opacity-60"
          >
            {loading === 'register' ? '...' : t.createBtn}
          </button>

          <button
            onClick={() => go('/login', 'login')}
            disabled={!!loading}
            className="w-full py-[15px] rounded-[14px] border border-brand-gold/35 text-brand-gold text-[15px] font-normal tracking-wide transition-all active:bg-brand-gold/10 disabled:opacity-60"
          >
            {loading === 'login' ? '...' : t.loginBtn}
          </button>

          <button
            onClick={() => go('/today', 'guest')}
            disabled={!!loading}
            className="text-center text-[12px] text-white/30 py-1 active:text-white/50 transition-colors"
          >
            <span className="border-b border-white/15">{t.guestLink}</span>
          </button>
        </div>

      </div>
    </div>
  )
}
