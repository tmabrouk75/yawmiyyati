'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export default function PrivacyPolicy() {
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
          {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </h1>
        <p className={cn('text-[12px] text-gray-400 mb-6', isAr && 'text-right')}>
          {isAr ? 'آخر تحديث: يناير ٢٠٢٦' : 'Last updated: January 2026'}
        </p>

        {[
          {
            title: isAr ? 'ما البيانات التي نجمعها' : 'What data we collect',
            body:  isAr
              ? 'نجمع اسمك وبريدك الإلكتروني وكلمة مرور مشفرة عند التسجيل. نجمع نشاطاتك اليومية التي تدخلها أنت (الصلاة، القرآن، الذكر، الصيام، الصدقة). نجمع بلدك لاحتساب مواقيت الصلاة. لا نجمع أي بيانات تلقائياً من جهازك.'
              : 'We collect your name, email, and encrypted password when you register. We collect your daily activities that you enter yourself (prayer, Quran, dhikr, fasting, sadaqah). We collect your country for prayer time calculations. We collect no data automatically from your device.',
          },
          {
            title: isAr ? 'كيف نستخدم بياناتك' : 'How we use your data',
            body:  isAr
              ? 'نستخدم بياناتك فقط لتشغيل التطبيق وتزويدك بتقاريرك الشخصية. لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث. لا نستخدمها للإعلانات.'
              : 'We use your data only to operate the app and provide your personal reports. We never sell or share your data with third parties. We do not use it for advertising.',
          },
          {
            title: isAr ? 'تخزين البيانات' : 'Data storage',
            body:  isAr
              ? 'بياناتك مخزّنة على خوادم Supabase (PostgreSQL) في منطقة أوروبا. البيانات مشفرة أثناء النقل (HTTPS) وأثناء التخزين.'
              : 'Your data is stored on Supabase (PostgreSQL) servers in the EU region. Data is encrypted in transit (HTTPS) and at rest.',
          },
          {
            title: isAr ? 'حقوقك' : 'Your rights',
            body:  isAr
              ? 'يمكنك تصدير بياناتك كاملاً من صفحة التصدير (بريميوم). يمكنك حذف حسابك وجميع بياناتك نهائياً من الإعدادات. يمكنك التواصل معنا لأي طلب متعلق ببياناتك.'
              : 'You can export all your data from the Export page (Premium). You can permanently delete your account and all data from Settings. You can contact us for any data request.',
          },
          {
            title: isAr ? 'ملفات الارتباط (Cookies)' : 'Cookies',
            body:  isAr
              ? 'نستخدم ملف ارتباط واحد فقط لتسجيل الدخول (JWT httpOnly cookie). لا نستخدم ملفات ارتباط للتتبع أو الإعلانات.'
              : 'We use one cookie only for login sessions (JWT httpOnly cookie). We use no tracking or advertising cookies.',
          },
          {
            title: isAr ? 'التواصل' : 'Contact',
            body:  isAr
              ? 'لأي استفسار حول خصوصيتك: t.mabrouk@outlook.com'
              : 'For any privacy questions: t.mabrouk@outlook.com',
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
