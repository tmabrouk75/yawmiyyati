import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import AdminDashboard from '@/components/screens/AdminDashboard'

export default async function AdminPage() {
  const user = await getAuthUser()
  if (!user)        redirect('/login')
  if (!user.isAdmin) redirect('/today')   // silently redirect non-admins
  return <AdminDashboard />
}
