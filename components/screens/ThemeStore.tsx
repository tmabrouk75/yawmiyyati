'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { toHijri } from '@/lib/hijri'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:           'Themes',
    sub:             'Personalise your Yawmiyyati',
    active:          'Active',
    owned:           'Owned',
    free:            'Free',
    seasonal:        'Seasonal',
    seasonalLocked:  'Available during',
    applying:        'Applying...',
    purchasing:      'Opening checkout...',
    back:            'Back',
    applied:         'Applied ✓',
    oneTimePurchase: 'Each theme is a one-time purchase — yours forever',
    paymentSuccess:  '✓ Theme unlocked! Tap Apply to use it.',
    paymentPending:  'Payment pending — refresh in a moment.',
    paymentFailed:   'Payment was not completed. Please try again.',
  },
  ar: {
    title:           'الثيمات',
    sub:             'خصّص تطبيقك',
    active:          'مفعّل',
    owned:           'محفوظ',
    free:            'مجاني',
    seasonal:        'موسمي',
    seasonalLocked:  'متاح خلال',
    applying:        '...',
    purchasing:      'فتح الدفع...',
    back:            'رجوع',
    applied:         'مطبّق ✓',
    oneTimePurchase: 'كل ثيم شراء لمرة واحدة — ملكك للأبد',
    paymentSuccess:  '✓ تم فتح الثيم! اضغط تطبيق لاستخدامه.',
    paymentPending:  'الدفع قيد المعالجة — أعد التحميل بعد لحظة.',
    paymentFailed:   'لم تكتمل عملية الدفع. حاول مرة أخرى.',
  },
}

// ─── THEME DEFINITIONS ────────────────────────────────────
// priceLabel is display-only — actual charge amount is in lib/paymob/client.ts THEME_PRICES

const THEMES = [
  {
    key:          'madinah-night',
    nameEn:       'Madinah Night',
    nameAr:       'ليل المدينة',
    preview:      '#0D1F2D',
    accent:       '#C9AA71',
    isFree:       true,
    isSeasonal:   false,
    seasonMonths: null as number[] | null,
    priceLabel:   null as string | null,
  },
  {
    key:          'makkah-gold',
    nameEn:       'Makkah Gold',
    nameAr:       'ذهب مكة',
    preview:      '#1C1400',
    accent:       '#C9AA71',
    isFree:       false,
    isSeasonal:   false,
    seasonMonths: null,
    priceLabel:   '49 EGP',
  },
  {
    key:          'jannah-green',
    nameEn:       'Garden of Jannah',
    nameAr:       'روضة الجنة',
    preview:      '#0E2A1A',
    accent:       '#4ade80',
    isFree:       false,
    isSeasonal:   false,
    seasonMonths: null,
    priceLabel:   '49 EGP',
  },
  {
    key:          'desert-sand',
    nameEn:       'Desert Sand',
    nameAr:       'رمال الصحراء',
    preview:      '#C2956C',
    accent:       '#7C4A1E',
    isFree:       false,
    isSeasonal:   false,
    seasonMonths: null,
    priceLabel:   '49 EGP',
  },
  {
    key:          'fajr-blue',
    nameEn:       'Fajr Blue',
    nameAr:       'أزرق الفجر',
    preview:      '#0A1628',
    accent:       '#93c5fd',
    isFree:       false,
    isSeasonal:   false,
    seasonMonths: null,
    priceLabel:   '49 EGP',
  },
  {
    key:          'rose-ramadan',
    nameEn:       'Rose Ramadan',
    nameAr:       'وردة رمضان',
    preview:      '#2D0E1A',
    accent:       '#f9a8d4',
    isFree:       false,
    isSeasonal:   true,
    seasonMonths: [9],          // Ramadan only
    priceLabel:   '49 EGP',
  },
  {
    key:          'eid-special',
    nameEn:       'Eid Special',
    nameAr:       'خاص العيد',
    preview:      '#0A2A18',
    accent:       '#fbbf24',
    isFree:       false,
    isSeasonal:   true,
    seasonMonths: [10, 12],     // Shawwal + Dhul Hijjah
    priceLabel:   '49 EGP',
  },
]

const SEASON_NAMES_EN: Record<number, string> = {
  9: 'Ramadan',
  10: 'Shawwal',
  12: 'Dhul Hijjah',
}
const SEASON_NAMES_AR: Record<number, string> = {
  9: 'رمضان',
  10: 'شوال',
  12: 'ذو الحجة',
}

// ─── THEME CARD ───────────────────────────────────────────

function ThemeCard({
  theme,
  isActive,
  isOwned,
  isSeasonallyAvailable,
  lang,
  dir,
  t,
  onApply,
  onBuy,
  applying,
  purchasing,
}: {
  theme: typeof THEMES[0]
  isActive: boolean
  isOwned: boolean
  isSeasonallyAvailable: boolean
  lang: 'en' | 'ar'
  dir: 'ltr' | 'rtl'
  t: typeof T['en']
  onApply: () => void
  onBuy: () => void
  applying: boolean
  purchasing: boolean
}) {
  const name    = lang === 'ar' ? theme.nameAr : theme.nameEn
  // canUse: free or already purchased
  const canUse  = theme.isFree || isOwned
  // canBuy: paid, not yet owned, available this season (no premium required)
  const canBuy  = !theme.isFree && !isOwned && isSeasonallyAvailable
  // blocked: seasonal theme outside its season
  const blocked = !theme.isFree && !isOwned && !isSeasonallyAvailable

  const seasonLabel = theme.seasonMonths
    ? theme.seasonMonths
        .map(m => lang === 'ar' ? SEASON_NAMES_AR[m] : SEASON_NAMES_EN[m])
        .join(' / ')
    : null

  return (
    <div className={cn(
      'bg-white border rounded-[14px] overflow-hidden',
      isActive ? 'border-emerald-500 shadow-md' : 'border-gray-200',
      blocked && 'opacity-50'
    )}>
      {/* Preview swatch */}
      <div
        className="h-[72px] flex items-center justify-center relative"
        style={{ background: theme.preview }}
      >
        {/* Mini UI mockup */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-[3px] rounded-full" style={{ background: theme.accent }}/>
          <div className="w-12 h-[3px] rounded-full opacity-50" style={{ background: theme.accent }}/>
          <div className="w-6 h-[3px] rounded-full opacity-30" style={{ background: theme.accent }}/>
        </div>
        {isActive && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-[2px] rounded-full">
            {t.active}
          </div>
        )}
        {theme.isSeasonal && (
          <div className="absolute top-2 left-2 bg-black/40 text-white text-[9px] px-2 py-[2px] rounded-full">
            {t.seasonal}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn('px-3 pt-2 pb-3', dir === 'rtl' && 'text-right')}>
        <p className="text-[13px] font-semibold text-gray-900">{name}</p>

        {/* Season note */}
        {theme.isSeasonal && seasonLabel && (
          <p className="text-[10px] text-amber-600 mt-[1px]">
            {t.seasonalLocked} {seasonLabel}
          </p>
        )}

        {/* CTA */}
        <div className="mt-2">
          {isActive ? (
            <span className="text-[11px] font-semibold text-emerald-600">{t.applied}</span>
          ) : canUse ? (
            <button
              onClick={onApply}
              disabled={applying}
              className="text-[11px] font-semibold text-emerald-600 border border-emerald-200 rounded-full px-3 py-[4px] active:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              {applying ? t.applying : (isOwned && !theme.isFree ? t.owned : t.free)}
            </button>
          ) : canBuy ? (
            <button
              onClick={onBuy}
              disabled={purchasing}
              className="text-[11px] font-semibold text-white bg-gray-900 rounded-full px-3 py-[4px] active:opacity-80 disabled:opacity-50"
            >
              {purchasing ? t.purchasing : theme.priceLabel ?? 'Buy'}
            </button>
          ) : (
            // Seasonal + out of season
            <span className="text-[10px] text-gray-400">
              {t.seasonalLocked} {seasonLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── THEME STORE SCREEN ───────────────────────────────────

export default function ThemeStore({
  isPremium,
  currentTheme,
  ownedThemeKeys,
}: {
  isPremium: boolean
  currentTheme: string
  ownedThemeKeys: string[]
}) {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTheme,  setActiveTheme]  = useState(currentTheme)
  const [applying,     setApplying]     = useState<string | null>(null)
  const [purchasing,   setPurchasing]   = useState<string | null>(null)
  const [paymentBanner, setPaymentBanner] = useState<'success' | 'pending' | 'failed' | null>(null)

  // Show payment result banner on return from Paymob
  useEffect(() => {
    const status = searchParams.get('payment')
    if (status === 'success' || status === 'pending' || status === 'failed') {
      setPaymentBanner(status)
      // Clean the query param from the URL without a page reload
      router.replace('/themes', { scroll: false })
    }
  }, [searchParams, router])

  const currentHijriMonth = toHijri(new Date()).month

  const isSeasonallyAvailable = (theme: typeof THEMES[0]) => {
    if (!theme.isSeasonal || !theme.seasonMonths) return true
    return theme.seasonMonths.includes(currentHijriMonth)
  }

  const applyTheme = async (key: string) => {
    setApplying(key)
    try {
      await fetch('/api/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ theme: key }),
      })
      setActiveTheme(key)
    } finally {
      setApplying(null)
    }
  }

  const buyTheme = async (key: string) => {
    setPurchasing(key)
    try {
      const res = await fetch('/api/payments/checkout-theme', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ themeKey: key }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        console.error('[ThemeStore] No checkoutUrl in response:', data)
        setPurchasing(null)
      }
    } catch (err) {
      console.error('[ThemeStore] buyTheme error:', err)
      setPurchasing(null)
    }
  }

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-8">

      {/* Top bar */}
      <div className={cn('flex items-center px-4 pt-4 pb-1', dir === 'rtl' && 'flex-row-reverse')}>
        <button onClick={() => router.back()} className="text-[13px] text-gray-400 flex items-center gap-1">
          {dir === 'rtl' ? '›' : '‹'} {t.back}
        </button>
      </div>

      {/* Header */}
      <div className={cn('px-4 pt-2 pb-4', dir === 'rtl' && 'text-right')}>
        <h1 className="text-[20px] font-semibold text-gray-900">{t.title}</h1>
        <p className="text-[13px] text-gray-400 mt-[2px]">{t.sub}</p>
      </div>

      {/* Payment result banner */}
      {paymentBanner && (
        <div className={cn(
          'mx-4 mb-3 rounded-[12px] px-4 py-3 flex items-start justify-between gap-2',
          paymentBanner === 'success' ? 'bg-emerald-50 border border-emerald-200' :
          paymentBanner === 'pending' ? 'bg-amber-50 border border-amber-200' :
                                        'bg-red-50 border border-red-200'
        )}>
          <p className={cn(
            'text-[12px] font-medium flex-1',
            dir === 'rtl' && 'text-right',
            paymentBanner === 'success' ? 'text-emerald-700' :
            paymentBanner === 'pending' ? 'text-amber-700'   : 'text-red-700'
          )}>
            {paymentBanner === 'success' ? t.paymentSuccess :
             paymentBanner === 'pending' ? t.paymentPending  : t.paymentFailed}
          </p>
          <button
            onClick={() => setPaymentBanner(null)}
            className="text-gray-400 text-[16px] leading-none flex-shrink-0"
          >×</button>
        </div>
      )}

      {/* One-time purchase note */}
      <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-100 rounded-[12px] px-4 py-3">
        <p className={cn('text-[12px] text-emerald-700', dir === 'rtl' && 'text-right')}>
          🎨 {t.oneTimePurchase}
        </p>
      </div>

      {/* Theme grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {THEMES.map(theme => (
          <ThemeCard
            key={theme.key}
            theme={theme}
            isActive={activeTheme === theme.key}
            isOwned={theme.isFree || ownedThemeKeys.includes(theme.key)}
            isSeasonallyAvailable={isSeasonallyAvailable(theme)}
            lang={lang}
            dir={dir}
            t={t}
            onApply={() => applyTheme(theme.key)}
            onBuy={() => buyTheme(theme.key)}
            applying={applying === theme.key}
            purchasing={purchasing === theme.key}
          />
        ))}
      </div>

    </div>
  )
}
