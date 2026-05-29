import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Support from '@/components/screens/Support'

export default async function SupportPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <Support />
}
