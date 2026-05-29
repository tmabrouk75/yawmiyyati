'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ADMIN_TABS = [
  { label: 'Dashboard',            labelAr: 'لوحة التحكم',       href: '/admin',          icon: '📊' },
  { label: 'Islamic Calendar',     labelAr: 'التقويم الإسلامي',  href: '/admin/calendar', icon: '🌙' },
  { label: 'Promo Codes & Grants', labelAr: 'أكواد الترقية',    href: '/admin/promo',    icon: '🎁' },
]

interface AppShellProps {
  children:  React.ReactNode
  isAdmin:   boolean
  lang:      'en' | 'ar'
}

export default function AppShell({ children, isAdmin, lang }: AppShellProps) {
  const [isDesktop, setIsDesktop] = useState(false)
  const pathname = usePathname()
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Mobile or non-admin — render as normal
  if (!isAdmin || !isDesktop) {
    return <>{children}</>
  }

  // ── Desktop admin: persistent split layout ──
  return (
    <div className="fixed inset-0 z-50 flex" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ══ LEFT: Admin panel ══ */}
      <div
        className="w-1/2 flex-shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden"
        dir={dir}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className={cn('flex items-center gap-3', dir === 'rtl' && 'flex-row-reverse')}>
            <span className="text-[22px]">🛡️</span>
            <div className={dir === 'rtl' ? 'text-right' : ''}>
              <p className="text-[15px] font-bold text-gray-900">
                {lang === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
              </p>
              <p className="text-[10px] text-gray-400">Yawmiyyati · يومياتي</p>
            </div>
          </div>
          <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase tracking-wide flex-shrink-0">
            Admin
          </span>
        </div>

        {/* Tab navigation */}
        <div className={cn('flex border-b border-gray-100 bg-white px-2 flex-shrink-0', dir === 'rtl' && 'flex-row-reverse')}>
          {ADMIN_TABS.map(tab => {
            const isActive = tab.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(tab.href)
            return (
              <a
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-1 px-3 py-[11px] text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <span className="text-[14px]">{tab.icon}</span>
                <span>{lang === 'ar' ? tab.labelAr : tab.label}</span>
              </a>
            )
          })}
        </div>

        {/* Admin page content — scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {pathname.startsWith('/admin')
            ? children     // render the admin page component directly
            : (
              // Not on an admin page — show a prompt to navigate
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                <span className="text-[32px]">📊</span>
                <p className="text-[13px] font-medium text-gray-700">
                  {lang === 'ar' ? 'انتقل إلى أحد أقسام الإدارة' : 'Navigate to an admin section'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {lang === 'ar'
                    ? 'استخدم التبويبات أعلاه للوصول إلى لوحة التحكم أو التقويم أو الأكواد'
                    : 'Use the tabs above to access Dashboard, Calendar, or Promo Codes'}
                </p>
                <a
                  href="/admin"
                  className="mt-2 px-4 py-2 rounded-[10px] bg-emerald-600 text-white text-[12px] font-semibold"
                >
                  {lang === 'ar' ? 'فتح لوحة التحكم' : 'Open Dashboard'}
                </a>
              </div>
            )
          }
        </div>
      </div>

      {/* ══ RIGHT: App in phone frame ══ */}
      <div className="w-1/2 bg-[#0D1F2D] flex items-center justify-center py-6 overflow-hidden">
        {/* Phone shell */}
        <div
          className="relative flex-shrink-0"
          style={{ width: '400px', height: 'calc(100vh - 48px)', maxHeight: '900px' }}
        >
          {/* Outer phone body */}
          <div className="absolute inset-0 rounded-[44px] bg-[#1a1a1a] shadow-[0_32px_80px_rgba(0,0,0,0.6)]"/>

          {/* Screen area */}
          <div className="absolute inset-[7px] rounded-[38px] overflow-hidden bg-white flex flex-col">
            {/* Dynamic island / notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-black rounded-b-[16px] z-20 flex items-center justify-center gap-[6px]">
              <div className="w-[8px] h-[8px] rounded-full bg-[#1a1a1a] border border-gray-700"/>
              <div className="w-[4px] h-[4px] rounded-full bg-[#1a1a1a] border border-gray-700"/>
            </div>

            {/* App content — only shown when NOT on admin page */}
            {!pathname.startsWith('/admin') ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {children}
              </div>
            ) : (
              /* On admin pages: show a live preview hint */
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6 bg-gray-50">
                <span className="text-[36px]">📱</span>
                <p className="text-[13px] font-semibold text-gray-700">
                  {lang === 'ar' ? 'معاينة التطبيق' : 'App Preview'}
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {lang === 'ar'
                    ? 'انتقل إلى صفحة التطبيق (اليوم، التقارير...) لترى معاينة حية هنا'
                    : 'Navigate to an app page (Today, Reports…) to see a live preview here'}
                </p>
                <a
                  href="/today"
                  className="mt-2 px-4 py-[9px] rounded-[10px] bg-[#2D6A4F] text-white text-[12px] font-semibold"
                >
                  {lang === 'ar' ? '← اليوم' : 'Go to Today →'}
                </a>
              </div>
            )}
          </div>

          {/* Phone side buttons */}
          <div className="absolute left-[-4px] top-[110px] w-[4px] h-[34px] bg-[#2a2a2a] rounded-l-full"/>
          <div className="absolute left-[-4px] top-[158px] w-[4px] h-[56px] bg-[#2a2a2a] rounded-l-full"/>
          <div className="absolute left-[-4px] top-[228px] w-[4px] h-[56px] bg-[#2a2a2a] rounded-l-full"/>
          <div className="absolute right-[-4px] top-[158px] w-[4px] h-[76px] bg-[#2a2a2a] rounded-r-full"/>
        </div>

        {/* Label under phone */}
        <div className="absolute bottom-3 text-[10px] text-white/20 font-medium uppercase tracking-widest">
          {lang === 'ar' ? 'معاينة حية · التطبيق' : 'Live Preview · App'}
        </div>
      </div>

    </div>
  )
}
