import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import Reports from '@/components/screens/Reports'

export default async function ReportsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <Reports />
}
