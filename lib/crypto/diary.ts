// At-rest encryption for diary entries (AES-256-GCM).
//
// Why: diary text is the most private thing users write in the app. With this,
// anyone looking at the database (Supabase dashboard, a leaked connection
// string, a backup file) sees only ciphertext.
//
// Key: DIARY_ENCRYPTION_KEY env var, base64 of 32 random bytes.
//   Generate one:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
//
// IMPORTANT: if this key is lost, encrypted entries are unrecoverable.
// Keep it in Vercel env vars and .env.local only.
//
// Stored format: "enc1:<iv b64>:<authTag b64>:<ciphertext b64>"
// Legacy plaintext rows (written before this existed) are returned as-is by
// decryptDiaryText, so no data migration is required.

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const PREFIX = 'enc1'

function getKey(): Buffer {
  const raw = process.env.DIARY_ENCRYPTION_KEY
  if (!raw) throw new Error('DIARY_ENCRYPTION_KEY is not set')
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('DIARY_ENCRYPTION_KEY must be base64 of exactly 32 bytes')
  return key
}

export function encryptDiaryText(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decryptDiaryText(stored: string): string {
  if (!stored.startsWith(PREFIX + ':')) return stored // legacy plaintext row
  try {
    const [, ivB64, tagB64, dataB64] = stored.split(':')
    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
  } catch (err) {
    console.error('[DIARY DECRYPT] failed:', err)
    // Never return raw ciphertext to the UI
    return ''
  }
}
