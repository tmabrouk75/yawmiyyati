import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Gamification from '@/components/screens/Gamification'

export default async function GamificationPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <Gamification />
}
