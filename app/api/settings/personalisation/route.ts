import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { commitmentFactors, ageRange, acquisitionChannel } = body

    const updateData: Record<string, unknown> = {}

    if (Array.isArray(commitmentFactors)) {
      updateData.commitmentFactors = commitmentFactors.filter(
        (f: unknown) => typeof f === 'string'
      )
    }

    if (typeof ageRange === 'string' && ageRange.trim()) {
      updateData.ageRange = ageRange.trim()
    }

    if (typeof acquisitionChannel === 'string' && acquisitionChannel.trim()) {
      updateData.acquisitionChannel = acquisitionChannel.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to update' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data:  updateData,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[personalisation] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
