import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import AdminPromo from '@/components/screens/AdminPromo'

export default async function AdminPromoPage() {
  const user = await getAuthUser()
  if (!user)         redirect('/login')
  if (!user.isAdmin) redirect('/today')
  return <AdminPromo />
}
