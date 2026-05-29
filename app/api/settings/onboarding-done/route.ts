import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.user.update({ where: { id: user.id }, data: { onboardingDone: true } })
  return NextResponse.json({ success: true })
}
