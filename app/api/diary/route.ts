import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'
import { encryptDiaryText, decryptDiaryText } from '@/lib/crypto/diary'

// GET /api/diary — newest first
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await prisma.diaryEntry.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    // Content is encrypted at rest — decrypt before sending to the owner
    const entries = rows.map(e => ({
      ...e,
      content:     decryptDiaryText(e.content),
      customTitle: e.customTitle ? decryptDiaryText(e.customTitle) : null,
    }))

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('[DIARY GET]', error)
    return NextResponse.json({ error: 'Failed to load diary' }, { status: 500 })
  }
}

// POST /api/diary — create entry (content is encrypted before it is stored)
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content, customTitle, format } = await req.json()
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 })
    if (content.length > 20000) return NextResponse.json({ error: 'Entry too long' }, { status: 400 })

    const title = customTitle?.trim() || null

    const entry = await prisma.diaryEntry.create({
      data: {
        userId:      user.id,
        content:     encryptDiaryText(content.trim()),
        customTitle: title ? encryptDiaryText(title) : null,
        format:      format ?? 'text',
      },
    })

    // Return the readable version to the client
    return NextResponse.json({
      entry: { ...entry, content: content.trim(), customTitle: title },
    }, { status: 201 })
  } catch (error) {
    console.error('[DIARY POST]', error)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}
