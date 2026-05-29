import { redirect } from 'next/navigation'
import { getAuthUser, checkPremium } from '@/lib/auth'
import ExportScreen from '@/components/screens/Export'

export default async function ExportPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  const isPremium = await checkPremium(user.id)
  return <ExportScreen isPremium={isPremium} />
}
