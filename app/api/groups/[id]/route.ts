import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/groups/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { contribution: 'desc' },
        },
      },
    })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Check membership
    const isMember = group.members.some(m => m.userId === user.id)
    const isOwner  = group.ownerId === user.id
    if (!isMember && !isOwner) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
    }

    const totalContribution = group.members.reduce((sum, m) => sum + m.contribution, 0)

    return NextResponse.json({
      group: {
        id:          group.id,
        nameEn:      group.nameEn,
        nameAr:      group.nameAr,
        goalType:    group.goalType,
        goalTarget:  group.goalTarget,
        goalUnit:    group.goalUnit,
        deadline:    group.deadline,
        isActive:    group.isActive,
        isOwner,
        owner:       group.owner,
        totalProgress: totalContribution,
        progressPct: Math.min(100, Math.round((totalContribution / group.goalTarget) * 100)),
        // Only show contribution numbers — no personal activity data
        members: group.members.map(m => ({
          userId:       m.userId,
          name:         m.user.name,
          contribution: m.contribution,
          isMe:         m.userId === user.id,
        })),
      },
    })
  } catch (error) {
    console.error('[GROUP GET]', error)
    return NextResponse.json({ error: 'Failed to load group' }, { status: 500 })
  }
}

// POST /api/groups/[id] — add contribution
// Body: { amount: number }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount } = await req.json()
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: user.id } },
    })
    if (!member) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })

    const updated = await prisma.groupMember.update({
      where: { groupId_userId: { groupId: params.id, userId: user.id } },
      data: { contribution: { increment: parseFloat(amount) } },
    })

    // Get updated group total
    const total = await prisma.groupMember.aggregate({
      where: { groupId: params.id },
      _sum: { contribution: true },
    })

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      select: { goalTarget: true },
    })

    const totalProgress = total._sum.contribution ?? 0
    const progressPct   = group
      ? Math.min(100, Math.round((totalProgress / group.goalTarget) * 100))
      : 0

    return NextResponse.json({
      myContribution: updated.contribution,
      totalProgress,
      progressPct,
    })
  } catch (error) {
    console.error('[GROUP POST]', error)
    return NextResponse.json({ error: 'Failed to add contribution' }, { status: 500 })
  }
}

// DELETE /api/groups/[id] — owner deletes group
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const group = await prisma.group.findUnique({ where: { id: params.id } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the group owner can delete it' }, { status: 403 })
    }

    await prisma.group.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[GROUP DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
