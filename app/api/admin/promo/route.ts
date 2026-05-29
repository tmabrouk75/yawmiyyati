import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireAdmin } from '@/lib/admin/guard'

// GET /api/admin/promo — list all promo codes
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const codes = await prisma.promoCode.findMany({
    include: {
      _count: { select: { usages: true } },
      usages: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { redeemedAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ codes })
}

// POST /api/admin/promo — create a new promo code
// Body: {
//   code, type, premiumDays, discountPct?,
//   description?, labelEn?, labelAr?,
//   maxUses, expiresAt?
// }
export async function POST(req: NextRequest) {
  const { user: admin, error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const {
    code, type, premiumDays = 30, discountPct = 0,
    description, labelEn, labelAr,
    maxUses = 1, expiresAt,
  } = body

  if (!code || !type) {
    return NextResponse.json({ error: 'code and type are required' }, { status: 400 })
  }

  // Enforce uppercase, strip spaces
  const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '-')

  // Check not already exists
  const existing = await prisma.promoCode.findUnique({ where: { code: cleanCode } })
  if (existing) {
    return NextResponse.json({ error: 'A code with this name already exists' }, { status: 409 })
  }

  const promo = await prisma.promoCode.create({
    data: {
      code:              cleanCode,
      type,
      premiumDays:       parseInt(premiumDays),
      discountPct:       parseInt(discountPct),
      description:       description ?? null,
      labelEn:           labelEn ?? null,
      labelAr:           labelAr ?? null,
      maxUses:           parseInt(maxUses),
      expiresAt:         expiresAt ? new Date(expiresAt) : null,
      createdByAdminId:  admin!.id,
      isActive:          true,
    },
  })

  return NextResponse.json({ promo }, { status: 201 })
}

// PATCH /api/admin/promo — update a code (toggle active, extend expiry, etc.)
// Body: { id, isActive?, expiresAt?, maxUses?, description? }
export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { id, isActive, expiresAt, maxUses, description, labelEn, labelAr } = body

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const data: any = {}
  if (isActive    !== undefined) data.isActive    = isActive
  if (expiresAt   !== undefined) data.expiresAt   = expiresAt ? new Date(expiresAt) : null
  if (maxUses     !== undefined) data.maxUses     = parseInt(maxUses)
  if (description !== undefined) data.description = description
  if (labelEn     !== undefined) data.labelEn     = labelEn
  if (labelAr     !== undefined) data.labelAr     = labelAr

  const updated = await prisma.promoCode.update({ where: { id }, data })
  return NextResponse.json({ promo: updated })
}

// DELETE /api/admin/promo?id=xxx — permanently delete a code
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.promoCode.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
