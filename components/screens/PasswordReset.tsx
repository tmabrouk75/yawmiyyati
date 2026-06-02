'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const T = {
  en: {
    forgotTitle:  'Forgot Password',
    forgotSub:    "Enter your email and we'll send a reset link",
    emailLabel:   'Email address',
    send:         'Send Reset Link',
    sending:      'Sending...',
    sent:         "Done! Check your email. The link expires in 1 hour.",
    resetTitle:   'Set New Password',
    resetSub:     'Choose a new password for your account',
    newPass:      'New password',
    confirm:      'Reset Password',
    confirming:   'Updating...',
    done:         'Password updated! You can now sign in.',
    invalid:      'This reset link is invalid or has expired.',
    backToLogin:  'Back to sign in',
    min8:         'At least 8 characters',
  },
  ar: {
    forgotTitle:  'نسيت كلمة المرور',
    forgotSub:    'أدخل بريدك وسنرسل لك رابط إعادة التعيين',
    emailLabel:   'البريد الإلكتروني',
    send:         'إرسال رابط إعادة التعيين',
    sending:      'جارٍ الإرسال...',
    sent:         'تم! تحقق من بريدك. الرابط صالح لساعة واحدة.',
    resetTitle:   'تعيين كلمة مرور جديدة',
    resetSub:     'اختر كلمة مرور جديدة لحسابك',
    newPass:      'كلمة المرور الجديدة',
    confirm:      'تعيين كلمة المرور',
    confirming:   'جارٍ التحديث...',
    done:         'تم تحديث كلمة المرور! يمكنك تسجيل الدخول الآن.',
    invalid:      'رابط إعادة التعيين غير صالح أو منتهٍ.',
    backToLogin:  'العودة لتسجيل الدخول',
    min8:         '٨ أحرف على الأقل',
  },
}

// ─── FORGOT PASSWORD FORM ─────────────────────────────────
export function ForgotPasswordForm() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  const submit = async () => {
    if (!email.trim()) return
    setStatus('loading')
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setStatus('done')
  }

  return (
    <div dir={dir} className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-[360px]">
        <div className={cn('mb-6', dir === 'rtl' && 'text-right')}>
          <h1 className="text-[22px] font-bold text-gray-900">{t.forgotTitle}</h1>
          <p className="text-[13px] text-gray-400 mt-1">{t.forgotSub}</p>
        </div>
        {status === 'done' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-4">
            <p className={cn('text-[14px] text-emerald-700', dir === 'rtl' && 'text-right')}>{t.sent}</p>
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailLabel}
              dir="ltr"
              className="w-full h-[48px] rounded-[12px] border border-gray-200 bg-white px-4 text-[14px] mb-4 focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={submit}
              disabled={status === 'loading'}
              className="w-full py-[14px] rounded-[12px] bg-emerald-600 text-white text-[14px] font-semibold disabled:opacity-50"
            >
              {status === 'loading' ? t.sending : t.send}
            </button>
          </>
        )}
        <a href="/login" className={cn('block text-center mt-4 text-[13px] text-gray-400 underline', dir === 'rtl' && 'text-center')}>
          {t.backToLogin}
        </a>
      </div>
    </div>
  )
}

// ─── RESET PASSWORD FORM ──────────────────────────────────
export function ResetPasswordForm() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const params = useSearchParams()
  const router = useRouter()
  const uid   = params.get('uid') ?? ''
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async () => {
    if (password.length < 8) { setErrorMsg(t.min8); return }
    setStatus('loading')
    const res  = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, newPassword: password }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('done')
      setTimeout(() => router.push('/login'), 2500)
    } else {
      setErrorMsg(data.error ?? t.invalid)
      setStatus('error')
    }
  }

  return (
    <div dir={dir} className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      <div className="w-full max-w-[360px]">
        <div className={cn('mb-6', dir === 'rtl' && 'text-right')}>
          <h1 className="text-[22px] font-bold text-gray-900">{t.resetTitle}</h1>
          <p className="text-[13px] text-gray-400 mt-1">{t.resetSub}</p>
        </div>
        {status === 'done' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-4">
            <p className={cn('text-[14px] text-emerald-700', dir === 'rtl' && 'text-right')}>{t.done}</p>
          </div>
        ) : (
          <>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.newPass}
              dir="ltr"
              className="w-full h-[48px] rounded-[12px] border border-gray-200 bg-white px-4 text-[14px] mb-2 focus:outline-none focus:border-emerald-400"
            />
            {errorMsg && (
              <p className={cn('text-[12px] text-red-500 mb-3', dir === 'rtl' && 'text-right')}>{errorMsg}</p>
            )}
            <button
              onClick={submit}
              disabled={status === 'loading'}
              className="w-full py-[14px] rounded-[12px] bg-emerald-600 text-white text-[14px] font-semibold disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? t.confirming : t.confirm}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
