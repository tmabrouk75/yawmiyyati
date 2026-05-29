'use client'

import { useLang } from '@/contexts/LanguageContext'

const T = {
  en: {
    title:  'You\'re offline',
    sub:    'Your daily log is saved on this device. It will sync automatically when you reconnect.',
    tip:    'All your data is safe.',
    retry:  'Try again',
  },
  ar: {
    title:  'أنت غير متصل',
    sub:    'سجلك اليومي محفوظ على جهازك وسيُزامَن تلقائياً عند الاتصال.',
    tip:    'جميع بياناتك آمنة.',
    retry:  'المحاولة مجدداً',
  },
}

export default function OfflinePage() {
  const { lang, dir } = useLang()
  const t = T[lang]

  return (
    <div dir={dir} className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      <div className="text-[52px] mb-4">📡</div>
      <h1 className="text-[20px] font-semibold text-gray-900 mb-2">{t.title}</h1>
      <p className="text-[14px] text-gray-500 max-w-[280px] mb-2">{t.sub}</p>
      <p className="text-[12px] text-emerald-600 mb-6">✓ {t.tip}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-[12px] rounded-[12px] bg-emerald-600 text-white text-[14px] font-semibold"
      >
        {t.retry}
      </button>
    </div>
  )
}
