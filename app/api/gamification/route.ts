import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { getUserTotalXp, getLevelFromXp } from '@/lib/xp/engine'

// GET /api/gamification
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [totalXp, badges, recentXp] = await Promise.all([
      getUserTotalXp(user.id),

      prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badgeDefinition: true },
        orderBy: { earnedAt: 'desc' },
      }),

      prisma.xpLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { points: true, reason: true, dateGregorian: true, createdAt: true },
      }),
    ])

    const allBadges = await prisma.badgeDefinition.findMany({
      orderBy: { category: 'asc' },
    })

    const earnedIds = new Set(badges.map(b => b.badgeDefinitionId))
    const levelInfo = getLevelFromXp(totalXp)

    return NextResponse.json({
      totalXp,
      level: levelInfo,
      earnedBadges: badges.map(b => ({
        id:           b.badgeDefinitionId,
        key:          b.badgeDefinition.key,
        nameEn:       b.badgeDefinition.nameEn,
        nameAr:       b.badgeDefinition.nameAr,
        descriptionEn:b.badgeDefinition.descriptionEn,
        descriptionAr:b.badgeDefinition.descriptionAr,
        icon:         b.badgeDefinition.icon,
        category:     b.badgeDefinition.category,
        earnedAt:     b.earnedAt,
      })),
      allBadges: allBadges.map(b => ({
        id:           b.id,
        key:          b.key,
        nameEn:       b.nameEn,
        nameAr:       b.nameAr,
        descriptionEn:b.descriptionEn,
        descriptionAr:b.descriptionAr,
        icon:         b.icon,
        category:     b.category,
        earned:       earnedIds.has(b.id),
      })),
      recentXp,
    })
  } catch (error) {
    console.error('[GAMIFICATION GET]', error)
    return NextResponse.json({ error: 'Failed to load gamification data' }, { status: 500 })
  }
}
