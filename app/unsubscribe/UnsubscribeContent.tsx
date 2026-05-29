'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'

const T = {
  en: {
    processing: 'Processing your request...',
    success:    'You have been unsubscribed from email reminders.',
    error:      'Invalid or expired unsubscribe link.',
    resubscribe:'Re-enable reminders in Settings',
  },
  ar: {
    processing: 'جارٍ معالجة طلبك...',
    success:    'تم إلغاء اشتراكك في التذكيرات البريدية.',
    error:      'رابط إلغاء الاشتراك غير صحيح أو منتهٍ.',
    resubscribe:'أعد تفعيل التذكيرات في الإعدادات',
  },
}

export default function UnsubscribeContent() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const params = useSearchParams()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const uid   = params.get('uid')
    const token = params.get('token')
    if (!uid || !token) { setStatus('error'); return }

    fetch('/api/reminders/unsubscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ uid, token }),
    })
      .then(r => r.ok ? setStatus('success') : setStatus('error'))
      .catch(() => setStatus('error'))
  }, [params])

  return (
    <div dir={dir} className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      {status === 'loading' && (
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"/>
      )}
      {status === 'success' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-[40px]">✅</div>
          <p className="text-[15px] text-gray-700">{t.success}</p>
          <a href="/settings" className="text-[13px] text-emerald-600 underline">{t.resubscribe}</a>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-[40px]">⚠️</div>
          <p className="text-[15px] text-gray-700">{t.error}</p>
        </div>
      )}
    </div>
  )
}
