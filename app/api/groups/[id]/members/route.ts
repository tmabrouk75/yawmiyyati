import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser, checkPremium } from '@/lib/auth'

// POST /api/groups/[id]/members — add a member by email or userId (owner only, Premium)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only Premium owners can add members
    const isPremium = await checkPremium(user.id)
    if (!isPremium) {
      return NextResponse.json({
        error: 'Adding members requires a Premium subscription',
        code: 'PREMIUM_REQUIRED',
      }, { status: 403 })
    }

    const group = await prisma.group.findUnique({ where: { id: params.id } })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the group owner can add members' }, { status: 403 })
    }

    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    })
    if (!targetUser) {
      return NextResponse.json({ error: 'No account found with that email' }, { status: 404 })
    }

    // Check not already a member
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: targetUser.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'This person is already a member' }, { status: 409 })
    }

    const member = await prisma.groupMember.create({
      data: { groupId: params.id, userId: targetUser.id, contribution: 0 },
    })

    return NextResponse.json({
      member: { userId: targetUser.id, name: targetUser.name, contribution: 0 },
    }, { status: 201 })
  } catch (error) {
    console.error('[MEMBERS POST]', error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}

// DELETE /api/groups/[id]/members?userId=xxx — remove member or leave group
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const targetUserId = req.nextUrl.searchParams.get('userId') ?? user.id
    const group = await prisma.group.findUnique({ where: { id: params.id } })

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    // Only owner can remove others; anyone can remove themselves (leave)
    if (targetUserId !== user.id && group.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can remove other members' }, { status: 403 })
    }
    // Owner cannot leave their own group — must delete instead
    if (targetUserId === group.ownerId) {
      return NextResponse.json({ error: 'Owner cannot leave — delete the group instead' }, { status: 400 })
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: params.id, userId: targetUserId } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MEMBERS DELETE]', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
