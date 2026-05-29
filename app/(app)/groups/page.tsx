// app/(app)/groups/page.tsx
import { redirect } from 'next/navigation'
import { getAuthUser, checkPremium } from '@/lib/auth'
import Groups from '@/components/screens/Groups'

export default async function GroupsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  const isPremium = await checkPremium(user.id)
  return <Groups isPremium={isPremium} />
}
