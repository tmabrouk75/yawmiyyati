import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import ReferralScreen from '@/components/screens/Referral'

export default async function ReferralPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <ReferralScreen />
}
