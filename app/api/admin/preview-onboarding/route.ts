import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'

// POST /api/admin/preview-onboarding
// Resets the admin's own onboardingDone flag so they can preview the flow
export async function POST() {
  const { user, error } = await requireAdmin()
  if (error) return error

  await prisma.user.update({
    where: { id: user!.id },
    data:  { onboardingDone: false },
  })

  return NextResponse.json({ success: true })
}
