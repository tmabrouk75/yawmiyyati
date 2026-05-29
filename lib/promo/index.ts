import { prisma } from '@/lib/db/prisma'

// ─── VALIDATE CODE (no side effects) ─────────────────────

export interface ValidateResult {
  valid:       boolean
  error?:      string
  errorAr?:    string
  code?:       any
}

export async function validatePromoCode(
  code: string,
  userId: string
): Promise<ValidateResult> {
  const promo = await prisma.promoCode.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { usages: { where: { userId } } },
  })

  if (!promo) {
    return { valid: false, error: 'Invalid code', errorAr: 'الكود غير صحيح' }
  }

  if (!promo.isActive) {
    return { valid: false, error: 'This code is no longer active', errorAr: 'هذا الكود لم يعد فعّالاً' }
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { valid: false, error: 'This code has expired', errorAr: 'انتهت صلاحية هذا الكود' }
  }

  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return { valid: false, error: 'This code has reached its maximum uses', errorAr: 'وصل هذا الكود للحد الأقصى من الاستخدامات' }
  }

  if (promo.usages.length > 0) {
    return { valid: false, error: 'You have already used this code', errorAr: 'لقد استخدمت هذا الكود من قبل' }
  }

  return { valid: true, code: promo }
}

// ─── REDEEM CODE ──────────────────────────────────────────

export interface RedeemResult {
  success:      boolean
  type:         string
  premiumDays:  number   // 0 = lifetime
  premiumUntil: Date | null
  themeKey:     string | null
  labelEn:      string
  labelAr:      string
  error?:       string
}

export async function redeemPromoCode(
  code: string,
  userId: string
): Promise<RedeemResult> {
  const validation = await validatePromoCode(code, userId)

  if (!validation.valid || !validation.code) {
    return {
      success:      false,
      type:         '',
      premiumDays:  0,
      premiumUntil: null,
      themeKey:     null,
      labelEn:      '',
      labelAr:      '',
      error:        validation.error,
    }
  }

  const promo = validation.code

  // ── Calculate premium expiry
  let premiumUntil: Date | null = null
  let grantedDays = promo.premiumDays

  if (promo.type === 'FREE_PREMIUM' || promo.type === 'TRIAL') {
    if (promo.premiumDays === 0) {
      premiumUntil = null  // lifetime
    } else {
      // Check if user already has premium — extend from current expiry
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true, premiumExpiresAt: true },
      })

      const baseDate = (user?.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > new Date())
        ? user.premiumExpiresAt   // extend from current expiry
        : new Date()              // start from today

      premiumUntil = new Date(baseDate)
      premiumUntil.setDate(premiumUntil.getDate() + promo.premiumDays)
    }

    // Grant premium
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium:        true,
        premiumExpiresAt: premiumUntil,
      },
    })
  }

  // ── THEME_UNLOCK: find ThemeDefinition by key, create UserTheme
  if (promo.type === 'THEME_UNLOCK' && promo.themeKey) {
    const themeDef = await prisma.themeDefinition.findUnique({
      where: { key: promo.themeKey },
    })

    if (!themeDef) {
      return {
        success:      false,
        type:         promo.type,
        premiumDays:  0,
        premiumUntil: null,
        themeKey:     promo.themeKey,
        labelEn:      '',
        labelAr:      '',
        error:        'Theme not found',
      }
    }

    // Upsert: safe if user somehow already owns it
    await prisma.userTheme.upsert({
      where:  { userId_themeDefinitionId: { userId, themeDefinitionId: themeDef.id } },
      create: { userId, themeDefinitionId: themeDef.id },
      update: {},   // already owned — no-op
    })
  }

  // ── Record usage
  await prisma.promoCodeUsage.create({
    data: {
      promoCodeId:  promo.id,
      userId,
      grantedDays,
      premiumUntil,
    },
  })

  // ── Increment use count
  await prisma.promoCode.update({
    where: { id: promo.id },
    data: { usedCount: { increment: 1 } },
  })

  return {
    success:      true,
    type:         promo.type,
    premiumDays:  grantedDays,
    premiumUntil,
    themeKey:     promo.themeKey ?? null,
    labelEn:      promo.labelEn ?? (promo.type === 'THEME_UNLOCK' ? 'Theme unlocked!' : 'Premium activated'),
    labelAr:      promo.labelAr ?? (promo.type === 'THEME_UNLOCK' ? 'تم فتح الثيم!' : 'تم تفعيل بريميوم'),
  }
}
