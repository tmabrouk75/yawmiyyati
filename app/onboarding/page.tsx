import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Onboarding from '@/components/screens/Onboarding'

export default async function OnboardingPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.onboardingDone) redirect('/today')
  return <Onboarding />
}
