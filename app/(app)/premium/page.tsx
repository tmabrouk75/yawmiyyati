// ════════════════════════════════════════════════════════════
// app/(app)/premium/page.tsx
// ════════════════════════════════════════════════════════════
import { redirect } from 'next/navigation'
import { getAuthUser, checkPremium } from '@/lib/auth'
import Premium from '@/components/screens/Premium'

export default async function PremiumPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  const isPremium = await checkPremium(user.id)
  return <Premium isPremium={isPremium} />
}
