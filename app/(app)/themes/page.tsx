import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAuthUser, checkPremium } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import ThemeStore from '@/components/screens/ThemeStore'

export default async function ThemesPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [isPremium, ownedThemes] = await Promise.all([
    checkPremium(user.id),
    prisma.userTheme.findMany({
      where:   { userId: user.id },
      include: { themeDefinition: true },
    }),
  ])

  // Suspense is required here because ThemeStore uses useSearchParams()
  // Without it Next.js 14 bails out of rendering and the page is blank
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-400 text-sm">Loading...</p></div>}>
      <ThemeStore
        isPremium={isPremium}
        currentTheme={user.theme}
        ownedThemeKeys={ownedThemes.map(t => t.themeDefinition.key)}
      />
    </Suspense>
  )
}
