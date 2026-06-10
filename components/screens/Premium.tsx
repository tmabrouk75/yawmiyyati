'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// ─── TRANSLATIONS ──────────────────────────────────────────

const T = {
  en: {
    title:        'Go Premium',
    sub:          'Unlock the full Yawmiyyati experience',
    monthly:      'Monthly',
    yearly:       'Yearly',
    save:         'Save 30%',
    perMonth:     '/ month',
    perYear:      '/ year',
    billedYearly: 'billed yearly',
    features: [
      { icon: '📅', text: 'Unlimited history (Free = 90 days)' },
      { icon: '📊', text: 'Advanced reports & PDF/CSV export' },
      { icon: '👥', text: 'Create groups & add members' },
      { icon: '🎨', text: 'Unlock theme purchases' },
      { icon: '✅', text: 'All personal tracking & gamification' },
    ],
    freeNote:     'Free tier keeps full personal tracking forever.',
    ctaMonthly:   'Start Premium: Monthly',
    ctaYearly:    'Start Premium: Yearly',
    loading:      'Opening checkout...',
    alreadyPremium: 'You already have Premium ✓',
    back:         'Back',
    secureNote:   'Payments processed securely by Paymob',
    cancelAnytime:'Cancel anytime from your account settings',
    costNote:     'These prices are not for profit. They exist solely to cover the costs of keeping Yawmiyyati running: servers, email, and payment processing. We are grateful for every subscriber who helps keep this free for others. 🤲',
    promoLabel:   'Have an activation code?',
    promoPh:      'Enter code',
    promoApply:   'Apply',
    promoChecking:'Checking...',
    promoOk:      (label: string) => `✓ ${label}`,
    promoErr:     'Invalid or expired code',
},
  ar: {
    title:        'اشترك في بريميوم',
    sub:          'افتح التجربة الكاملة ليومياتي',
    monthly:      'شهري',
    yearly:       'سنوي',
    save:         'وفّر ٣٠٪',
    perMonth:     '/ شهر',
    perYear:      '/ سنة',
    billedYearly: 'يُفوتر سنوياً',
    features: [
      { icon: '📅', text: 'سجل غير محدود (المجاني = ٩٠ يومًا)' },
      { icon: '📊', text: 'تقارير متقدمة وتصدير PDF/CSV' },
      { icon: '👥', text: 'إنشاء مجموعات وإضافة أعضاء' },
      { icon: '🎨', text: 'شراء الثيمات المميزة' },
      { icon: '✅', text: 'جميع التتبع الشخصي والإنجازات' },
    ],
    freeNote:     'يبقى التتبع الشخصي الكامل مجانياً للأبد.',
    ctaMonthly:   'ابدأ بريميوم: شهري',
    ctaYearly:    'ابدأ بريميوم: سنوي',
    loading:      'فتح صفحة الدفع...',
    alreadyPremium: 'لديك بريميوم بالفعل ✓',
    back:         'رجوع',
    secureNote:   'المدفوعات مؤمّنة عبر Paymob',
    cancelAnytime:'إلغاء في أي وقت من إعدادات حسابك',
    costNote:     'هذه الأسعار ليست للربح. هي فقط لتغطية تكاليف تشغيل يومياتي: الخوادم والبريد الإلكتروني ومعالجة المدفوعات. نشكر كل مشترك يساعد في إبقاء التطبيق مجانياً للآخرين. 🤲',
    promoLabel:   'هل لديك كود تفعيل؟',
    promoPh:      'أدخل الكود',
    promoApply:   'تطبيق',
    promoChecking:'جارٍ التحقق...',
    promoOk:      (label: string) => `✓ ${label}`,
    promoErr:     'الكود غير صحيح أو منتهٍ',
  },
}

// Prices shown in UI — amounts in EGP (must match your Paymob integration setup)
const DISPLAY_PRICES = {
  monthly: { usd: '$2.99',  egp: '149 ج.م' },
  yearly:  { usd: '$24.99', egp: '1,249 ج.م' },
}

export default function Premium({ isPremium }: { isPremium: boolean }) {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)
  const [promoCode,   setPromoCode]   = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [promoLabel,  setPromoLabel]  = useState('')
  const [promoSuccess, setPromoSuccess] = useState(false)

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoStatus('checking')
    const res  = await fetch('/api/promo/redeem', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: promoCode.trim() }),
    })
    const data = await res.json()
    if (res.ok && data.success) {
      setPromoStatus('ok')
      setPromoLabel(lang === 'ar' ? data.labelAr : data.labelEn)
      setPromoSuccess(true)
    } else {
      setPromoStatus('error')
      setTimeout(() => setPromoStatus('idle'), 3000)
    }
  }

  const [phone, setPhone]   = useState('')
  const [showPhone, setShowPhone] = useState(false)

  const checkout = async (confirmedPhone?: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: billing === 'monthly' ? 'premium_monthly' : 'premium_yearly',
          phone:   confirmedPhone ?? phone ?? '+201000000000',
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        // Redirect to Paymob Unified Checkout
        window.location.href = data.checkoutUrl
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  const handleSubscribePress = () => {
    // Paymob requires a phone number in billing data
    // Show phone input if not already provided
    if (!phone) { setShowPhone(true); return }
    checkout()
  }

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* Top bar */}
      <div className={cn('flex items-center px-4 pt-4 pb-2')}>
        <button
          onClick={() => router.back()}
          className="text-[13px] text-gray-400 flex items-center gap-1"
        >
          {dir === 'rtl' ? '›' : '‹'} {t.back}
        </button>
      </div>

      {/* Hero */}
      <div className={cn('px-6 pt-4 pb-5', dir === 'rtl' && 'text-right')}>
        <div className="text-[34px] mb-1">⭐</div>
        <h1 className="text-[24px] font-bold text-gray-900">{t.title}</h1>
        <p className="text-[14px] text-gray-500 mt-1">{t.sub}</p>
      </div>

      {/* Already premium */}
      {isPremium && (
        <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-200 rounded-[14px] px-4 py-3">
          <p className="text-[14px] text-emerald-700 font-medium text-center">{t.alreadyPremium}</p>
        </div>
      )}

      {/* Billing toggle */}
      {!isPremium && (
        <div className="mx-4 mb-4">
          <div className="flex bg-gray-200 rounded-[12px] p-[3px] gap-[2px]">
            {(['monthly', 'yearly'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'flex-1 py-[9px] rounded-[9px] text-[13px] font-medium transition-all duration-150 flex items-center justify-center gap-2',
                  billing === b
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                )}
              >
                {b === 'monthly' ? t.monthly : t.yearly}
                {b === 'yearly' && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-[1px] rounded-full">
                    {t.save}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price card */}
      {!isPremium && (
        <div className="mx-4 mb-5 bg-white border-2 border-emerald-500 rounded-[16px] px-5 py-5">
          <div className={cn('flex items-end gap-1')}>
            <span className="text-[32px] font-bold text-gray-900">
              {billing === 'monthly'
                ? DISPLAY_PRICES.monthly.egp
                : DISPLAY_PRICES.yearly.egp}
            </span>
            <span className="text-[13px] text-gray-400 mb-1">
              {billing === 'monthly' ? t.perMonth : t.perYear}
            </span>
          </div>
          {billing === 'yearly' && (
            <p className="text-[11px] text-gray-400 mt-[2px]">
              {DISPLAY_PRICES.yearly.usd} / year · ~$2.08 per month · {t.save}
            </p>
          )}
        </div>
      )}

      {/* Feature list */}
      <div className="mx-4 mb-5 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        {t.features.map((f, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 px-4 py-[11px]',
              i < t.features.length - 1 && 'border-b border-gray-100',
            )}
          >
            <span className="text-[18px] flex-shrink-0">{f.icon}</span>
            <span className="text-[13px] text-gray-700">{f.text}</span>
            <span className="text-emerald-500 ms-auto text-[14px]">✓</span>
          </div>
        ))}
      </div>

      {/* Free tier note */}
      <p className={cn('mx-4 mb-4 text-[12px] text-gray-400', dir === 'rtl' && 'text-right')}>
        {t.freeNote}
      </p>

      {/* Cost transparency note */}
      <div className="mx-4 mb-6 bg-emerald-50 border border-emerald-100 rounded-[14px] px-4 py-4">
        <p className={cn('text-[12px] text-emerald-800 leading-relaxed', dir === 'rtl' && 'text-right')}>
          {t.costNote}
        </p>
      </div>

      {/* CTA */}
      {!isPremium && !promoSuccess && (
        <div className="px-4 flex flex-col gap-3">

          {/* Promo code input */}
          <div>
            <p className={cn('text-[12px] text-gray-500 mb-2', dir === 'rtl' && 'text-right')}>
              {t.promoLabel}
            </p>
            <div className={cn('flex gap-2')}>
              <input
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder={t.promoPh}
                dir="ltr"
                className={cn(
                  'flex-1 h-[44px] rounded-[12px] border px-4 text-[14px] font-mono tracking-wider focus:outline-none transition-colors',
                  promoStatus === 'ok'    && 'border-emerald-400 bg-emerald-50',
                  promoStatus === 'error' && 'border-red-300 bg-red-50',
                  promoStatus === 'idle'  && 'border-gray-200 bg-gray-50',
                )}
              />
              <button
                onClick={applyPromo}
                disabled={!promoCode || promoStatus === 'checking' || promoStatus === 'ok'}
                className="px-4 h-[44px] rounded-[12px] bg-gray-800 text-white text-[13px] font-semibold disabled:opacity-40"
              >
                {promoStatus === 'checking' ? t.promoChecking : t.promoApply}
              </button>
            </div>
            {promoStatus === 'ok' && (
              <p className={cn('text-[12px] text-emerald-600 mt-1', dir === 'rtl' && 'text-right')}>
                {t.promoOk(promoLabel)}
              </p>
            )}
            {promoStatus === 'error' && (
              <p className={cn('text-[12px] text-red-500 mt-1', dir === 'rtl' && 'text-right')}>
                {t.promoErr}
              </p>
            )}
          </div>

          <button
            onClick={handleSubscribePress}
            disabled={loading}
            className="w-full py-[15px] rounded-[14px] bg-emerald-600 text-white text-[15px] font-semibold transition-opacity active:opacity-80 disabled:opacity-50"
          >
            {loading
              ? t.loading
              : billing === 'monthly' ? t.ctaMonthly : t.ctaYearly}
          </button>
          <div className={cn('flex flex-col items-center gap-1 mt-1', dir === 'rtl' && 'items-center')}>
            <p className="text-[11px] text-gray-400">🔒 {t.secureNote}</p>

      {/* Payment return banner */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('payment') === 'success' && (
        <div className="mx-4 mt-4 bg-emerald-50 border border-emerald-200 rounded-[12px] p-4">
          <p className={cn('text-[14px] font-semibold text-emerald-700', dir === 'rtl' && 'text-right')}>
            {lang === 'ar' ? '🎉 تم تفعيل الاشتراك بنجاح!' : '🎉 Premium activated successfully!'}
          </p>
        </div>
      )}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('payment') === 'pending' && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-[12px] p-4">
          <p className={cn('text-[14px] text-amber-700', dir === 'rtl' && 'text-right')}>
            {lang === 'ar' ? '⏳ الدفع قيد المراجعة. سيتم تفعيل الاشتراك خلال دقائق.' : '⏳ Payment is being processed. Premium will activate within minutes.'}
          </p>
        </div>
      )}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('payment') === 'failed' && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-[12px] p-4">
          <p className={cn('text-[14px] text-red-600', dir === 'rtl' && 'text-right')}>
            {lang === 'ar' ? '❌ فشل الدفع. يرجى المحاولة مرة أخرى.' : '❌ Payment failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Phone number modal — Paymob requires phone for billing data */}
      {showPhone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowPhone(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-[20px] p-6 pb-8" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-4"><div className="w-10 h-[4px] rounded-full bg-gray-200"/></div>
            <p className={cn('text-[16px] font-semibold text-gray-900 mb-2', dir === 'rtl' && 'text-right')}>
              {lang === 'ar' ? '📱 رقم هاتفك' : '📱 Your phone number'}
            </p>
            <p className={cn('text-[12px] text-gray-400 mb-4', dir === 'rtl' && 'text-right')}>
              {lang === 'ar' ? 'مطلوب لإتمام عملية الدفع' : 'Required to complete your payment'}
            </p>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+201XXXXXXXXX"
              dir="ltr"
              className="w-full h-[46px] rounded-[12px] border border-gray-200 bg-gray-50 px-4 text-[15px] mb-4 focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={() => { setShowPhone(false); checkout(phone) }}
              disabled={!phone || phone.length < 8}
              className="w-full py-[14px] rounded-[12px] bg-emerald-600 text-white text-[14px] font-semibold disabled:opacity-40"
            >
              {lang === 'ar' ? 'متابعة للدفع →' : 'Continue to payment →'}
            </button>
          </div>
        </div>
      )}
            <p className="text-[11px] text-gray-400">{t.cancelAnytime}</p>
          </div>
        </div>
      )}

      {/* Already activated via promo */}
      {!isPremium && promoSuccess && (
        <div className="mx-4 bg-emerald-50 border border-emerald-200 rounded-[14px] px-4 py-4 text-center">
          <p className="text-[22px] mb-2">🎉</p>
          <p className="text-[15px] font-semibold text-emerald-800">{promoLabel}</p>
          <p className="text-[12px] text-emerald-600 mt-1">{lang === 'ar' ? 'تم تفعيل بريميوم بنجاح' : 'Premium has been activated successfully'}</p>
        </div>
      )}
    </div>
  )
}
