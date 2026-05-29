'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const SUPPORT_EMAIL = 't.mabrouk@outlook.com'

const T = {
  en: {
    title:      'Contact Support',
    sub:        'We read every message and reply personally.',
    category:   'What is this about?',
    categories: [
      { key: 'bug',       label: '🐛 Bug or technical issue' },
      { key: 'billing',   label: '💳 Billing or subscription' },
      { key: 'premium',   label: '⭐ Premium not activating' },
      { key: 'promo',     label: '🎁 Promo code issue' },
      { key: 'feedback',  label: '💬 Feedback or suggestion' },
      { key: 'other',     label: '📩 Other' },
    ],
    subject:    'Subject (optional)',
    subjectPh:  'Brief description',
    message:    'Your message',
    messagePh:  'Describe your issue in as much detail as possible...',
    send:       'Send Message',
    sending:    'Sending...',
    sent:       'Message Sent ✓',
    sentSub:    'We\'ll reply to your email as soon as possible.',
    orEmail:    'Or email us directly',
    emailNote:  'We typically reply within 24–48 hours.',
    back:       'Back',
    required:   'Please write a message',
    error:      'Failed to send. Please try emailing us directly.',
    privacy:    'Your message is sent to the app admin only and never shared.',
  },
  ar: {
    title:      'تواصل مع الدعم',
    sub:        'نقرأ كل رسالة ونرد عليها شخصياً.',
    category:   'ما موضوع رسالتك؟',
    categories: [
      { key: 'bug',       label: '🐛 خطأ أو مشكلة تقنية' },
      { key: 'billing',   label: '💳 فوترة أو اشتراك' },
      { key: 'premium',   label: '⭐ بريميوم لم يتفعّل' },
      { key: 'promo',     label: '🎁 مشكلة في كود الترقية' },
      { key: 'feedback',  label: '💬 ملاحظة أو اقتراح' },
      { key: 'other',     label: '📩 أخرى' },
    ],
    subject:    'الموضوع (اختياري)',
    subjectPh:  'وصف مختصر',
    message:    'رسالتك',
    messagePh:  'اشرح مشكلتك بأكبر قدر من التفاصيل...',
    send:       'إرسال الرسالة',
    sending:    'جارٍ الإرسال...',
    sent:       'تم الإرسال ✓',
    sentSub:    'سنرد على بريدك الإلكتروني في أقرب وقت.',
    orEmail:    'أو راسلنا مباشرة',
    emailNote:  'نرد عادةً خلال ٢٤–٤٨ ساعة.',
    back:       'رجوع',
    required:   'يرجى كتابة رسالة',
    error:      'فشل الإرسال. يرجى مراسلتنا مباشرة.',
    privacy:    'رسالتك تُرسل إلى مسؤول التطبيق فقط ولا تُشارك مع أي طرف آخر.',
  },
}

export default function Support() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [category, setCategory] = useState('')
  const [subject,  setSubject]  = useState('')
  const [message,  setMessage]  = useState('')
  const [status,   setStatus]   = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [fieldError, setFieldError] = useState('')

  const send = async () => {
    if (!message.trim()) { setFieldError(t.required); return }
    setFieldError('')
    setStatus('sending')

    const res = await fetch('/api/support', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        category: t.categories.find(c => c.key === category)?.label ?? category,
        subject,
        message,
      }),
    })

    if (res.ok) {
      setStatus('sent')
    } else {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  // Success state
  if (status === 'sent') {
    return (
      <div dir={dir} className="flex flex-col items-center justify-center min-h-full bg-gray-50 px-6 pb-10">
        <div className="text-[52px] mb-4">🤝</div>
        <h1 className={cn('text-[20px] font-semibold text-gray-900 mb-2', dir === 'rtl' && 'text-center')}>
          {t.sent}
        </h1>
        <p className={cn('text-[14px] text-gray-500 max-w-[280px] mb-8', dir === 'rtl' ? 'text-center' : 'text-center')}>
          {t.sentSub}
        </p>
        <button
          onClick={() => router.push('/settings')}
          className="px-6 py-[12px] rounded-[12px] bg-emerald-600 text-white text-[14px] font-semibold"
        >
          {t.back}
        </button>
      </div>
    )
  }

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* TOP BAR */}
      <div className={cn('flex items-center gap-3 px-4 pt-4 pb-2', dir === 'rtl' && 'flex-row-reverse')}>
        <button onClick={() => router.back()} className="text-[13px] text-gray-400">
          {dir === 'rtl' ? '›' : '‹'} {t.back}
        </button>
      </div>

      {/* HEADER */}
      <div className={cn('px-4 pt-2 pb-4', dir === 'rtl' && 'text-right')}>
        <h1 className="text-[20px] font-semibold text-gray-900">{t.title}</h1>
        <p className="text-[13px] text-gray-400 mt-1">{t.sub}</p>
      </div>

      <div className="px-4 flex flex-col gap-4">

        {/* Category */}
        <div>
          <p className={cn('text-[11px] font-semibold text-gray-500 mb-2', dir === 'rtl' && 'text-right')}>
            {t.category}
          </p>
          <div className="flex flex-col gap-2">
            {t.categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={cn(
                  'w-full text-left px-4 py-[11px] rounded-[12px] border text-[13px] transition-all',
                  dir === 'rtl' && 'text-right',
                  category === cat.key
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-medium'
                    : 'bg-white border-gray-200 text-gray-700'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <p className={cn('text-[11px] font-semibold text-gray-500 mb-1', dir === 'rtl' && 'text-right')}>
            {t.subject}
          </p>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder={t.subjectPh}
            dir={dir}
            className="w-full h-[44px] rounded-[12px] border border-gray-200 bg-white px-4 text-[14px] focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Message */}
        <div>
          <p className={cn('text-[11px] font-semibold text-gray-500 mb-1', dir === 'rtl' && 'text-right')}>
            {t.message}
          </p>
          <textarea
            value={message}
            onChange={e => { setMessage(e.target.value); setFieldError('') }}
            placeholder={t.messagePh}
            dir={dir}
            rows={5}
            className={cn(
              'w-full rounded-[12px] border bg-white px-4 py-3 text-[14px] focus:outline-none focus:border-emerald-400 resize-none',
              fieldError ? 'border-red-300' : 'border-gray-200'
            )}
          />
          {fieldError && (
            <p className={cn('text-[11px] text-red-500 mt-1', dir === 'rtl' && 'text-right')}>{fieldError}</p>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={send}
          disabled={status === 'sending'}
          className="w-full py-[14px] rounded-[14px] bg-emerald-600 text-white text-[15px] font-semibold disabled:opacity-50 transition-opacity active:opacity-80"
        >
          {status === 'sending' ? t.sending : t.send}
        </button>

        {/* Error */}
        {status === 'error' && (
          <p className={cn('text-[12px] text-red-500', dir === 'rtl' && 'text-right')}>{t.error}</p>
        )}

        {/* Direct email fallback */}
        <div className={cn('bg-gray-100 rounded-[12px] p-4', dir === 'rtl' && 'text-right')}>
          <p className="text-[12px] font-semibold text-gray-600 mb-1">{t.orEmail}</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Yawmiyyati Support`}
            className="text-[14px] text-emerald-600 font-medium"
          >
            {SUPPORT_EMAIL}
          </a>
          <p className="text-[11px] text-gray-400 mt-1">{t.emailNote}</p>
        </div>

        {/* Privacy note */}
        <p className={cn('text-[11px] text-gray-400 text-center pb-2', dir === 'rtl' && 'text-center')}>
          🔒 {t.privacy}
        </p>

      </div>
    </div>
  )
}
