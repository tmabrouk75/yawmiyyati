import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import PrayerNotifications from '@/components/screens/PrayerNotifications'

export default async function PrayerTimesPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <PrayerNotifications />
}
