import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import BottomNav from '@/components/layout/BottomNav'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const lang = user.language?.toLowerCase() === 'ar' ? 'ar' : 'en'

  return (
    <AppShell isAdmin={user.isAdmin ?? false} lang={lang}>
      <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
        <div className="flex-1 overflow-y-auto scroll-area">
          {children}
        </div>
        <BottomNav isAdmin={user.isAdmin ?? false} />
      </div>
    </AppShell>
  )
}
