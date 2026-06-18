import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { recomputeStreakGoal } from '@/lib/xp/engine'

// GET /api/settings — return full user settings
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [userActivities, userSurahs, qadaRecords] = await Promise.all([
      prisma.userActivity.findMany({
        where: { userId: user.id },
        include: { activityDefinition: true },
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

    return NextResponse.json({
      user: {
        name:             user.name,
        email:            user.email,
        language:         user.language,
        theme:            user.theme,
        isPremium:        user.isPremium,
        remindersEnabled: user.remindersEnabled,
        emailReminders:   user.emailReminders,
        streakGoals:      user.streakGoals ?? ['fard'],
      },
      userActivities: userActivities.map(a => ({
        id:          a.id,
        key:         a.activityDefinition.key,
        nameEn:      a.activityDefinition.nameEn,
        nameAr:      a.activityDefinition.nameAr,
        category:    a.activityDefinition.category,
        isEnabled:   a.isEnabled,
        sortOrder:   a.sortOrder,
      })),
      userSurahs,
      qadaRecords,
    })
  } catch (error) {
    console.error('[SETTINGS GET]', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

// PATCH /api/settings — update user preferences
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { language, theme, remindersEnabled, emailReminders, name, country, gender, streakGoals } = body

    const updateData: any = {}
    if (language)         updateData.language         = language
    if (theme)            updateData.theme            = theme
    if (name)             updateData.name             = name
    if (country)          updateData.country          = country
    if (gender !== undefined) updateData.gender       = gender
    if (remindersEnabled !== undefined) updateData.remindersEnabled = remindersEnabled
    if (emailReminders   !== undefined) updateData.emailReminders   = emailReminders
    if (Array.isArray(streakGoals)) {
      const allowed = ['fard', 'sunnah', 'zikr', 'mosque', 'qiyam_witr', 'morning_evening_azkar', 'quran']
      updateData.streakGoals = streakGoals.filter((g: unknown): g is string => typeof g === 'string' && allowed.includes(g))
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { language: true, theme: true, remindersEnabled: true, emailReminders: true, name: true },
    })

    // If the streak goal changed, refresh only TODAY's flag so the change takes
    // effect immediately. Earlier days are never touched, so history stays frozen.
    if (updateData.streakGoals) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const todayLog = await prisma.dailyLog.findUnique({
        where: { userId_dateGregorian: { userId: user.id, dateGregorian: today } },
        select: { id: true },
      })
      if (todayLog) await recomputeStreakGoal(user.id, today)
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error('[SETTINGS PATCH]', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
