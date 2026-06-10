'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang, LangToggle } from '@/contexts/LanguageContext'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    login:      { title: 'Welcome back',     sub: 'Sign in to your account' },
    register:   { title: 'Create account',   sub: 'Start tracking your ibadah' },
    name:       'Full name',
    email:      'Email address',
    password:   'Password',
    loginBtn:   'Sign in',
    registerBtn:'Create account',
    switchLogin:   'Already have an account? ',
    switchLoginLink: 'Sign in',
    switchReg:     'Don\'t have an account? ',
    switchRegLink:  'Create one',
    back:       'Back',
    promoLabel: 'Activation code (optional)',
    promoPh:    'Enter code if you have one',
    errors: {
      name:     'Name is required',
      email:    'Enter a valid email',
      password: 'Min 8 chars, 1 uppercase, 1 number',
      server:   'Something went wrong. Please try again.',
    },
  },
  ar: {
    login:      { title: 'مرحباً بعودتك',    sub: 'سجّل دخولك إلى حسابك' },
    register:   { title: 'إنشاء حساب',        sub: 'ابدأ تتبع عباداتك اليومية' },
    name:       'الاسم الكامل',
    email:      'البريد الإلكتروني',
    password:   'كلمة المرور',
    loginBtn:   'تسجيل الدخول',
    registerBtn:'إنشاء الحساب',
    switchLogin:   'لديك حساب بالفعل؟ ',
    switchLoginLink: 'تسجيل الدخول',
    switchReg:     'ليس لديك حساب؟ ',
    switchRegLink:  'إنشاء حساب',
    back:       'رجوع',
    promoLabel: 'كود التفعيل (اختياري)',
    promoPh:    'أدخل الكود إن وجد',
    errors: {
      name:     'الاسم مطلوب',
      email:    'أدخل بريداً إلكترونياً صحيحاً',
      password: '٨ أحرف على الأقل، حرف كبير ورقم',
      server:   'حدث خطأ ما. حاول مجدداً.',
    },
  },
}

// ─── FIELD ────────────────────────────────────────────────

function Field({
  label, type = 'text', value, onChange, error, dir,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; error?: string; dir: string
}) {
  const [show, setShow] = useState(false)
  const inputType = type === 'password' ? (show ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1">
      <label className={`text-[12px] font-medium text-gray-500 ${dir === 'rtl' ? 'text-right' : ''}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          dir={dir}
          className={[
            'w-full h-[48px] rounded-[12px] border bg-gray-50 px-4 text-[15px] text-gray-900',
            'focus:outline-none focus:border-emerald-500 focus:bg-white transition-all',
            error ? 'border-red-400' : 'border-gray-200',
            'pe-10', // logical: reserves space for the eye icon on the end side in both LTR and RTL
          ].join(' ')}
          autoCapitalize={type === 'email' ? 'none' : undefined}
          autoCorrect="off"
          spellCheck={false}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className={`absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 text-[13px] select-none`}
          >
            {show ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && (
        <p className={`text-[11px] text-red-500 ${dir === 'rtl' ? 'text-right' : ''}`}>{error}</p>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  // Read referral code from URL on mount
  const [refCode, setRefCode] = useState<string | null>(null)
  if (typeof window !== 'undefined' && refCode === null) {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) setRefCode(ref)
  }

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading]   = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === 'register' && !name.trim()) e.name = t.errors.name
    if (!email.includes('@')) e.email = t.errors.email
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
      e.password = t.errors.password
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setServerError('')

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password }
        : { name, email, password, language: lang.toUpperCase(), refCode: refCode ?? undefined }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? t.errors.server)
        return
      }

      // Apply promo code if entered
      if (mode === 'register' && promoCode.trim()) {
        await fetch('/api/promo/redeem', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ code: promoCode.trim() }),
        }).catch(() => {})
      }

      // New registrations → onboarding. Logins → today
      router.push(mode === 'register' ? '/onboarding' : '/today')
      router.refresh()
    } catch {
      setServerError(t.errors.server)
    } finally {
      setLoading(false)
    }
  }

  const labels = mode === 'login' ? t.login : t.register

  return (
    <div dir={dir} className="flex flex-col flex-1 px-6 pt-4 pb-8">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/welcome')}
          className="text-[13px] text-gray-400 flex items-center gap-1"
        >
          {dir === 'rtl' ? '›' : '‹'} {t.back}
        </button>
        <LangToggle className="!bg-gray-100 [&_button]:text-gray-600 [&_.active]:text-gray-900" />
      </div>

      {/* Heading */}
      <div className={`mb-8 ${dir === 'rtl' ? 'text-right' : ''}`}>
        <h1 className="text-[26px] font-semibold text-gray-900">{labels.title}</h1>
        <p className="text-[14px] text-gray-500 mt-1">{labels.sub}</p>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4">
        {mode === 'register' && (
          <Field label={t.name} value={name} onChange={setName} error={errors.name} dir={dir}/>
        )}
        <Field
          label={t.email} type="email"
          value={email} onChange={setEmail} error={errors.email} dir={dir}
        />
        <Field
          label={t.password} type="password"
          value={password} onChange={setPassword} error={errors.password} dir={dir}
        />
        {mode === 'register' && (
          <Field
            label={t.promoLabel}
            value={promoCode}
            onChange={v => setPromoCode(v.toUpperCase())}
            dir="ltr"
          />
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-[10px] text-[13px] text-red-600">
          {serverError}
        </div>
      )}

      {/* Forgot password — login only */}
      {mode === 'login' && (
        <div className={cn('mt-1', dir === 'rtl' ? 'text-left' : 'text-right')}>
          <a href="/forgot-password" className="text-[12px] text-gray-400 underline underline-offset-2">
            {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
          </a>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={loading}
        className="mt-8 w-full py-[15px] rounded-[14px] bg-emerald-600 text-white text-[15px] font-semibold transition-opacity active:opacity-80 disabled:opacity-50"
      >
        {loading
          ? <span className="animate-pulse-soft">...</span>
          : mode === 'login' ? t.loginBtn : t.registerBtn
        }
      </button>

      {/* Switch mode */}
      <p className={`mt-6 text-[13px] text-gray-500 ${dir === 'rtl' ? 'text-right' : 'text-center'}`}>
        {mode === 'login' ? t.switchReg : t.switchLogin}
        <button
          onClick={() => router.push(mode === 'login' ? '/register' : '/login')}
          className="text-emerald-600 font-medium"
        >
          {mode === 'login' ? t.switchRegLink : t.switchLoginLink}
        </button>
      </p>

    </div>
  )
}
