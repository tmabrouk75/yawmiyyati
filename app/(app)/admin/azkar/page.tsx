import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import AdminAzkar from '@/components/screens/AdminAzkar'

export default async function AdminAzkarPage() {
  const user = await getAuthUser()
  if (!user)         redirect('/login')
  if (!user.isAdmin) redirect('/today')
  return <AdminAzkar />
}
