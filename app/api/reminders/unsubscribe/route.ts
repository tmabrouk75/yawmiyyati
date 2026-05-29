import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyUnsubscribeToken } from '@/lib/email/send'

// POST /api/reminders/unsubscribe
export async function POST(req: NextRequest) {
  try {
    const { uid, token } = await req.json()
    if (!uid || !token) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    if (!verifyUnsubscribeToken(uid, token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: uid },
      data:  { emailReminders: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[UNSUBSCRIBE]', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
