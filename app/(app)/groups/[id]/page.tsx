import { redirect } from 'next/navigation'
import { getAuthUser, checkPremium } from '@/lib/auth'
import GroupDetail from '@/components/screens/GroupDetail'

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  const isPremium = await checkPremium(user.id)
  return <GroupDetail groupId={params.id} isPremium={isPremium} />
}
