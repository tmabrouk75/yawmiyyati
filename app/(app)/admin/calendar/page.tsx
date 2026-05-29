import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import AdminCalendar from '@/components/screens/AdminCalendar'

export default async function AdminCalendarPage() {
  const user = await getAuthUser()
  if (!user)         redirect('/login')
  if (!user.isAdmin) redirect('/today')
  return <AdminCalendar />
}
