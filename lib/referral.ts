/**
 * Referral system utilities
 */

/** Generate a random 8-character alphanumeric referral code (uppercase, no ambiguous chars) */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O, 1/I
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** Points cost for each redemption type */
export const REFERRAL_COSTS = {
  PREMIUM_MONTH: 5,
  THEME_UNLOCK:  25,
} as const

/** Days of premium granted per redemption */
export const PREMIUM_DAYS_PER_REDEMPTION = 30

/**
 * Rules text for display to users (en + ar)
 */
export const REFERRAL_RULES = {
  en: [
    'Share your unique referral link or QR code with friends.',
    'When a friend signs up using your link, their referral appears as Pending.',
    'Once they record at least 3 daily logs on 3 different days, it becomes Activated and you earn 1 point.',
    'Redeem 5 points for 1 month of Premium, or 25 points to permanently unlock any theme.',
    'Points never expire. Each person can only be referred once.',
  ],
  ar: [
    'شارك رابطك الخاص أو رمز QR مع أصدقائك.',
    'عندما يشترك صديق باستخدام رابطك، تظهر إحالته بحالة "في الانتظار".',
    'بمجرد تسجيله 3 سجلات يومية في 3 أيام مختلفة، تصبح الإحالة "مفعّلة" وتحصل على نقطة.',
    'استبدل 5 نقاط بشهر بريميوم مجاني، أو 25 نقطة لفتح أي ثيم بشكل دائم.',
    'النقاط لا تنتهي. كل شخص يمكن إحالته مرة واحدة فقط.',
  ],
}
