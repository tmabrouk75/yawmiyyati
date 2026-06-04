'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const LABELS = {
  en: { today: 'Today', reports: 'Reports', badges: 'Badges', features: 'My Space', settings: 'Settings' },
  ar: { today: 'اليوم', reports: 'التقارير', badges: 'الإنجازات', features: 'مساحتي', settings: 'الإعدادات' },
}

const TABS = [
  { key: 'today',    href: '/today',       icon: '🏠' },
  { key: 'reports',  href: '/reports',      icon: '📊' },
  { key: 'badges',   href: '/gamification', icon: '🏅' },
  { key: 'features', href: '/features',     icon: '⭐' },
  { key: 'settings', href: '/settings',     icon: '⚙️' },
]

// Admin tab is never in the bottom nav — admin access is via Settings → Admin Dashboard link
// This keeps the nav at 5 tabs on all screen sizes including iPhone SE

export default function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const { lang, dir } = useLang()
  const pathname = usePathname()
  const router   = useRouter()
  const labels   = LABELS[lang]

  // On admin pages, highlight Settings tab
  const effectivePath = pathname.startsWith('/admin') ? '/settings' : pathname
  const tabs = dir === 'rtl' ? [...TABS].reverse() : TABS

  return (
    <nav className="safe-bottom flex-shrink-0 bg-white border-t border-gray-100" aria-label="Main navigation">
      {/* Admin banner — shown at top of nav only when inside admin section */}
      {isAdmin && pathname.startsWith('/admin') && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-[5px] flex items-center justify-between">
          <span className="text-[11px] text-red-600 font-semibold">🛡️ Admin Mode</span>
          <button onClick={() => router.push('/today')} className="text-[10px] text-red-400">Exit →</button>
        </div>
      )}
      <div className="flex items-stretch h-[58px]">
        {tabs.map(tab => {
          const isActive = effectivePath.startsWith(tab.href)
          return (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-[3px] transition-all relative',
                isActive ? 'opacity-100' : 'opacity-35',
              )}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-emerald-500" />
              )}
              <span className="text-[18px] leading-none">{tab.icon}</span>
              <span className={cn(
                'text-[9px] font-medium leading-none',
                isActive ? 'text-emerald-600' : 'text-gray-500',
              )}>
                {labels[tab.key as keyof typeof labels]}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
