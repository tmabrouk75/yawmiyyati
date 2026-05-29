import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { checkPremium } from '@/lib/auth'

// GET /api/groups — list user's groups (owned + member)
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [owned, memberships] = await Promise.all([
      prisma.group.findMany({
        where: { ownerId: user.id, isActive: true },
        include: {
          _count: { select: { members: true } },
          members: {
            where: { userId: user.id },
            select: { contribution: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.groupMember.findMany({
        where: { userId: user.id },
        include: {
          group: {
            include: {
              _count: { select: { members: true } },
              members: { select: { contribution: true } },
            },
          },
        },
      }),
    ])

    // Merge and deduplicate (owner might also be a member)
    const ownedIds = new Set(owned.map(g => g.id))
    const memberGroups = memberships
      .filter(m => !ownedIds.has(m.groupId))
      .map(m => m.group)

    const formatGroup = (g: any, isOwner: boolean) => {
      const totalContribution = g.members.reduce((sum: number, m: any) => sum + m.contribution, 0)
      return {
        id:            g.id,
        nameEn:        g.nameEn,
        nameAr:        g.nameAr,
        goalType:      g.goalType,
        goalTarget:    g.goalTarget,
        goalUnit:      g.goalUnit,
        deadline:      g.deadline,
        isActive:      g.isActive,
        memberCount:   g._count.members,
        totalProgress: totalContribution,
        progressPct:   Math.min(100, Math.round((totalContribution / g.goalTarget) * 100)),
        isOwner,
        myContribution: g.members.find((m: any) => true)?.contribution ?? 0,
      }
    }

    return NextResponse.json({
      groups: [
        ...owned.map(g => formatGroup(g, true)),
        ...memberGroups.map(g => formatGroup(g, false)),
      ],
    })
  } catch (error) {
    console.error('[GROUPS GET]', error)
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 })
  }
}

// POST /api/groups — create a group (Premium only)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Premium gate
    const isPremium = await checkPremium(user.id)
    if (!isPremium) {
      return NextResponse.json({
        error: 'Creating groups requires a Premium subscription',
        code: 'PREMIUM_REQUIRED',
      }, { status: 403 })
    }

    const body = await req.json()
    const { nameEn, nameAr, goalType, goalTarget, goalUnit, deadline } = body

    if (!nameEn || !goalType || !goalTarget || !goalUnit) {
      return NextResponse.json({ error: 'nameEn, goalType, goalTarget and goalUnit are required' }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: {
        ownerId:    user.id,
        nameEn,
        nameAr:     nameAr ?? nameEn,
        goalType,
        goalTarget: parseFloat(goalTarget),
        goalUnit,
        deadline:   deadline ? new Date(deadline) : null,
      },
    })

    // Owner is auto-added as a member
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: user.id, contribution: 0 },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('[GROUPS POST]', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
