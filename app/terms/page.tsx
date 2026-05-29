'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export default function TermsOfService() {
  const { lang, dir } = useLang()
  const router = useRouter()
  const isAr = lang === 'ar'

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-12">
      <div className={cn('flex items-center gap-3 px-4 pt-4 pb-2', dir === 'rtl' && 'flex-row-reverse')}>
        <button onClick={() => router.back()} className="text-[13px] text-gray-400">
          {dir === 'rtl' ? '›' : '‹'} {isAr ? 'رجوع' : 'Back'}
        </button>
      </div>

      <div className="px-5 pt-2">
        <h1 className={cn('text-[20px] font-bold text-gray-900 mb-1', isAr && 'text-right')}>
          {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
        </h1>
        <p className={cn('text-[12px] text-gray-400 mb-6', isAr && 'text-right')}>
          {isAr ? 'آخر تحديث: يناير ٢٠٢٦' : 'Last updated: January 2026'}
        </p>

        {[
          {
            title: isAr ? 'قبول الشروط' : 'Acceptance',
            body:  isAr
              ? 'باستخدام يومياتي، فأنت توافق على هذه الشروط. إذا لم توافق، أوقف استخدام التطبيق.'
              : 'By using Yawmiyyati, you agree to these terms. If you do not agree, stop using the app.',
          },
          {
            title: isAr ? 'طبيعة الخدمة' : 'Nature of the service',
            body:  isAr
              ? 'يومياتي أداة لمساعدتك على تتبع عباداتك الشخصية. التطبيق ليس مرجعاً دينياً. الطاعة لله وحده، والتطبيق مجرد وسيلة للمساعدة.'
              : 'Yawmiyyati is a tool to help you track your personal worship. The app is not a religious authority. Obedience is to Allah alone — the app is simply a tool to help.',
          },
          {
            title: isAr ? 'الحساب والأمان' : 'Account and security',
            body:  isAr
              ? 'أنت مسؤول عن المحافظة على سرية كلمة مرورك. أبلغنا فوراً إذا اشتبهت في استخدام غير مصرح لحسابك.'
              : 'You are responsible for maintaining the confidentiality of your password. Notify us immediately if you suspect unauthorized use of your account.',
          },
          {
            title: isAr ? 'الاشتراك والدفع' : 'Subscription and payment',
            body:  isAr
              ? 'يتم الدفع عبر Paymob وتخضع المعاملات لشروطها. الاشتراكات تتجدد تلقائياً ويمكن إلغاؤها في أي وقت. رسوم الفترة الحالية غير قابلة للاسترداد.'
              : 'Payments are processed by Paymob and transactions are subject to their terms. Subscriptions renew automatically and can be cancelled at any time. Current period fees are non-refundable.',
          },
          {
            title: isAr ? 'إنهاء الحساب' : 'Account termination',
            body:  isAr
              ? 'يمكنك حذف حسابك في أي وقت من إعدادات التطبيق. نحتفظ بحق إيقاف أي حساب ينتهك هذه الشروط.'
              : 'You can delete your account at any time from the app settings. We reserve the right to suspend any account that violates these terms.',
          },
          {
            title: isAr ? 'تحديد المسؤولية' : 'Limitation of liability',
            body:  isAr
              ? 'التطبيق مقدم "كما هو" بدون ضمانات. لا نتحمل مسؤولية أي ضرر ناتج عن استخدامه أو توقفه.'
              : 'The app is provided "as is" without warranties. We are not liable for any damages resulting from its use or unavailability.',
          },
          {
            title: isAr ? 'التغييرات على الشروط' : 'Changes to terms',
            body:  isAr
              ? 'قد نحدّث هذه الشروط. سنبلغك بالتغييرات الجوهرية عبر البريد الإلكتروني.'
              : 'We may update these terms. We will notify you of material changes by email.',
          },
        ].map((section, i) => (
          <div key={i} className={cn('mb-5', isAr && 'text-right')}>
            <h2 className="text-[14px] font-semibold text-gray-900 mb-2">{section.title}</h2>
            <p className="text-[13px] text-gray-600 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
