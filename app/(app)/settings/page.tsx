import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import Settings from '@/components/screens/Settings'

export default async function SettingsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [userActivities, userSurahs, qadaRecords] = await Promise.all([
    prisma.userActivity.findMany({
      where: { userId: user.id },
      include: {
        activityDefinition: {
          select: {
            key: true, nameEn: true, nameAr: true,
            category: true, canDisable: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.userSurah.findMany({
      where: { userId: user.id },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.qadaRecord.findMany({
      where: { userId: user.id },
      orderBy: { ramadanYear: 'desc' },
    }),
  ])

  return (
    <Settings
      user={{
        name:             user.name,
        email:            user.email,
        language:         user.language,
        theme:            user.theme,
        isPremium:        user.isPremium,
        isAdmin:          user.isAdmin,
        remindersEnabled: user.remindersEnabled,
        emailReminders:   user.emailReminders,
        gender:           user.gender ?? null,
      }}
      userActivities={userActivities.map(a => ({
        id:         a.id,
        key:        a.activityDefinition.key,
        nameEn:     a.activityDefinition.nameEn,
        nameAr:     a.activityDefinition.nameAr,
        category:   a.activityDefinition.category,
        isEnabled:  a.isEnabled,
        canDisable: a.activityDefinition.canDisable,
        sortOrder:  a.sortOrder,
      }))}
      userSurahs={userSurahs}
      qadaRecords={qadaRecords}
    />
  )
}
