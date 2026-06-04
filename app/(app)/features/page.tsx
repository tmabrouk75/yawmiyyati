import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Features from '@/components/screens/Features'

export default async function FeaturesPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <Features />
}
