'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'

const T = {
  en: {
    premiumTitle:  'Welcome to Premium! 🎉',
    premiumSub:    'Your account has been upgraded. All Premium features are now unlocked.',
    themeTitle:    'Theme Purchased! 🎨',
    themeSub:      'Your new theme is now available in the Theme Store.',
    backToApp:     'Back to app',
    loading:       'Confirming your purchase...',
  },
  ar: {
    premiumTitle:  'مرحباً في بريميوم! 🎉',
    premiumSub:    'تمت ترقية حسابك. جميع مزايا بريميوم متاحة الآن.',
    themeTitle:    'تم شراء الثيم! 🎨',
    themeSub:      'ثيمك الجديد متاح الآن في متجر الثيمات.',
    backToApp:     'العودة للتطبيق',
    loading:       'جارٍ تأكيد عملية الشراء...',
  },
}

export default function PaymentSuccessContent() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()
  const params = useSearchParams()
  const type = params.get('type')

  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    // Give Paymob webhook ~3s to process then re-check session
    const timer = setTimeout(() => setConfirmed(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const isTheme   = type === 'theme'
  const title     = isTheme ? t.themeTitle   : t.premiumTitle
  const subtitle  = isTheme ? t.themeSub     : t.premiumSub

  return (
    <div dir={dir} className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      {!confirmed ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"/>
          <p className="text-[14px] text-gray-500">{t.loading}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out]">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-[36px]">
            {isTheme ? '🎨' : '⭐'}
          </div>
          <h1 className="text-[22px] font-bold text-gray-900">{title}</h1>
          <p className="text-[14px] text-gray-500 max-w-[280px]">{subtitle}</p>
          <button
            onClick={() => router.push('/today')}
            className="mt-4 px-6 py-[13px] rounded-[14px] bg-emerald-600 text-white text-[15px] font-semibold"
          >
            {t.backToApp}
          </button>
        </div>
      )}
    </div>
  )
}
