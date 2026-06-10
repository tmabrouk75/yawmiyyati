'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { REFERRAL_COSTS, REFERRAL_RULES } from '@/lib/referral'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ReferralData {
  referralCode:   string
  referralPoints: number
  stats:          { total: number; sent: number; pending: number; activated: number }
  referrals:      Array<{
    id:          string
    status:      'SENT' | 'PENDING' | 'ACTIVATED'
    sentAt:      string | null
    sentToEmail: string | null
    signedUpAt:  string | null
    activatedAt: string | null
    referred:    { name: string; email: string; createdAt: string } | null
  }>
  redemptions: Array<{
    id:         string
    type:       'PREMIUM_MONTH' | 'THEME_UNLOCK'
    pointsCost: number
    themeKey:   string | null
    createdAt:  string
  }>
}

// â”€â”€â”€ Translations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const T = {
  en: {
    title:        'Referrals & Points',
    balance:      'Your Points Balance',
    points:       'pts',
    copyLink:     'Copy Link',
    copied:       'Copied!',
    shareQR:      'Show QR Code',
    hideQR:       'Hide QR Code',
    inviteTitle:  'Invite by Email',
    invitePh:     'friend@email.com',
    inviteBtn:    'Send Invite',
    sending:      'Sending...',
    sentOk:       'Sent âœ“',
    inviteErr:    'Could not send invite.',
    statsTitle:   'Your Referrals',
    total:        'Total',
    sent:         'Sent',
    pending:      'Pending',
    activated:    'Activated',
    redeemTitle:  'Redeem Points',
    redeemPrem:   '1 Month Premium',
    redeemTheme:  'Unlock a Theme',
    premCost:     '5 pts',
    themeCost:    '25 pts',
    redeemBtn:    'Redeem',
    notEnough:    'Not enough points',
    redeeming:    'Redeeming...',
    redeemOk:     'Done! âœ“',
    historyTitle: 'Redemption History',
    noHistory:    'No redemptions yet.',
    rulesTitle:   'How It Works',
    listTitle:    'Referral List',
    noReferrals:  'No referrals yet. Share your link!',
    statusSent:      'ðŸ“¨ Sent',
    statusPending:   'â³ Pending',
    statusActivated: 'âœ… Activated',
    back:         'â€¹ Back',
    loading:      'Loading...',
    themeSelect:  'Select a theme to unlock:',
    cancel:       'Cancel',
  },
  ar: {
    title:        'Ø§Ù„Ø¥Ø­Ø§Ù„Ø§Øª ÙˆØ§Ù„Ù†Ù‚Ø§Ø·',
    balance:      'Ø±ØµÙŠØ¯ Ù†Ù‚Ø§Ø·Ùƒ',
    points:       'Ù†Ù‚Ø·Ø©',
    copyLink:     'Ù†Ø³Ø® Ø§Ù„Ø±Ø§Ø¨Ø·',
    copied:       'ØªÙ… Ø§Ù„Ù†Ø³Ø®!',
    shareQR:      'Ø¹Ø±Ø¶ Ø±Ù…Ø² QR',
    hideQR:       'Ø¥Ø®ÙØ§Ø¡ QR',
    inviteTitle:  'Ø¯Ø¹ÙˆØ© Ø¹Ø¨Ø± Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„',
    invitePh:     'friend@email.com',
    inviteBtn:    'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¯Ø¹ÙˆØ©',
    sending:      'Ø¬Ø§Ø±Ù Ø§Ù„Ø¥Ø±Ø³Ø§Ù„...',
    sentOk:       'ØªÙ… Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ âœ“',
    inviteErr:    'ØªØ¹Ø°Ù‘Ø± Ø§Ù„Ø¥Ø±Ø³Ø§Ù„.',
    statsTitle:   'Ø¥Ø­Ø§Ù„Ø§ØªÙƒ',
    total:        'Ø§Ù„ÙƒÙ„',
    sent:         'Ù…ÙØ±Ø³ÙŽÙ„Ø©',
    pending:      'ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±',
    activated:    'Ù…ÙØ¹Ù‘Ù„Ø©',
    redeemTitle:  'Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø§Ù„Ù†Ù‚Ø§Ø·',
    redeemPrem:   'Ø´Ù‡Ø± Ø¨Ø±ÙŠÙ…ÙŠÙˆÙ…',
    redeemTheme:  'ÙØªØ­ Ø«ÙŠÙ…',
    premCost:     'Ù¥ Ù†Ù‚Ø§Ø·',
    themeCost:    'Ù¢Ù¥ Ù†Ù‚Ø·Ø©',
    redeemBtn:    'Ø§Ø³ØªØ¨Ø¯Ø§Ù„',
    notEnough:    'Ù†Ù‚Ø§Ø· ØºÙŠØ± ÙƒØ§ÙÙŠØ©',
    redeeming:    'Ø¬Ø§Ø±Ù Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„...',
    redeemOk:     'ØªÙ…! âœ“',
    historyTitle: 'Ø³Ø¬Ù„ Ø§Ù„Ø§Ø³ØªØ¨Ø¯Ø§Ù„',
    noHistory:    'Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø¨Ø¹Ø¯.',
    rulesTitle:   'ÙƒÙŠÙ ÙŠØ¹Ù…Ù„ Ø§Ù„Ù†Ø¸Ø§Ù…',
    listTitle:    'Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¥Ø­Ø§Ù„Ø§Øª',
    noReferrals:  'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø­Ø§Ù„Ø§Øª Ø¨Ø¹Ø¯. Ø´Ø§Ø±Ùƒ Ø±Ø§Ø¨Ø·Ùƒ!',
    statusSent:      'ðŸ“¨ Ù…ÙØ±Ø³ÙŽÙ„Ø©',
    statusPending:   'â³ ÙÙŠ Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±',
    statusActivated: 'âœ… Ù…ÙØ¹Ù‘Ù„Ø©',
    back:         'â€º Ø±Ø¬ÙˆØ¹',
    loading:      'Ø¬Ø§Ø±Ù Ø§Ù„ØªØ­Ù…ÙŠÙ„...',
    themeSelect:  'Ø§Ø®ØªØ± Ø«ÙŠÙ…Ø§Ù‹ Ù„ÙØªØ­Ù‡:',
    cancel:       'Ø¥Ù„ØºØ§Ø¡',
  },
}

// â”€â”€â”€ QR Generator component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function QRCode({ url }: { url: string }) {
  const encoded = encodeURIComponent(url)
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encoded}&color=0D1F2D&bgcolor=F5F0E8&margin=10`

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <img src={src} alt="QR Code" width={180} height={180} className="rounded-[12px]" />
      <p className="text-[11px] text-gray-400 text-center">Scan to join Yawmiyyati</p>
    </div>
  )
}

// â”€â”€â”€ Main Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ReferralScreen() {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [data,     setData]     = useState<ReferralData | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState(false)
  const [showQR,   setShowQR]   = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [redeemMsg,    setRedeemMsg]    = useState('')
  const [showThemePicker, setShowThemePicker] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yawmiyyati.com'

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const referralLink = data ? `${appUrl}/register?ref=${data.referralCode}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendInvite = async () => {
    if (!inviteEmail.includes('@')) return
    setInviteStatus('sending')
    const res = await fetch('/api/referral', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: inviteEmail }),
    })
    if (res.ok) {
      setInviteStatus('sent')
      setInviteEmail('')
      // Refresh data
      const fresh = await fetch('/api/referral').then(r => r.json())
      setData(fresh)
    } else {
      setInviteStatus('error')
    }
    setTimeout(() => setInviteStatus('idle'), 3000)
  }

  const redeem = async (type: 'PREMIUM_MONTH' | 'THEME_UNLOCK', themeKey?: string) => {
    setRedeemStatus('loading')
    const res = await fetch('/api/referral/redeem', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, themeKey }),
    })
    const json = await res.json()
    if (res.ok) {
      setRedeemMsg(t.redeemOk)
      setRedeemStatus('done')
      const fresh = await fetch('/api/referral').then(r => r.json())
      setData(fresh)
    } else {
      setRedeemMsg(json.error ?? t.notEnough)
      setRedeemStatus('done')
    }
    setShowThemePicker(false)
    setTimeout(() => { setRedeemStatus('idle'); setRedeemMsg('') }, 3000)
  }

  const statusLabel = (s: string) => {
    if (s === 'SENT')      return t.statusSent
    if (s === 'PENDING')   return t.statusPending
    if (s === 'ACTIVATED') return t.statusActivated
    return s
  }

  const statusColor = (s: string) => {
    if (s === 'SENT')      return 'bg-blue-50 text-blue-700 border-blue-200'
    if (s === 'PENDING')   return 'bg-amber-50 text-amber-700 border-amber-200'
    if (s === 'ACTIVATED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    return 'bg-gray-50 text-gray-500 border-gray-200'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-[13px] text-gray-400">{t.loading}</p>
      </div>
    )
  }

  const canRedeemPrem  = (data?.referralPoints ?? 0) >= REFERRAL_COSTS.PREMIUM_MONTH
  const canRedeemTheme = (data?.referralPoints ?? 0) >= REFERRAL_COSTS.THEME_UNLOCK

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* â”€â”€ TOP BAR â”€â”€ */}
      <div className={cn('flex items-center justify-between px-4 pt-5 pb-3')}>
        <button onClick={() => router.back()} className="text-[13px] text-gray-400">{t.back}</button>
        <h1 className="text-[17px] font-bold text-gray-900">{t.title}</h1>
        <div className="w-10" />
      </div>

      {/* â”€â”€ POINTS BALANCE â”€â”€ */}
      <div className="mx-4 mb-4 bg-[#0D1F2D] rounded-[16px] px-5 py-5 flex flex-col items-center">
        <p className="text-[11px] text-white/50 uppercase tracking-widest mb-1">{t.balance}</p>
        <p className="text-[52px] font-bold text-[#C9AA71] leading-none">{data?.referralPoints ?? 0}</p>
        <p className="text-[13px] text-white/50 mt-1">{t.points}</p>
        {/* Mini stats */}
        <div className="flex gap-4 mt-4 border-t border-white/10 pt-4 w-full justify-around">
          {([
            [t.sent,      data?.stats.sent ?? 0,      'text-blue-300'],
            [t.pending,   data?.stats.pending ?? 0,   'text-amber-300'],
            [t.activated, data?.stats.activated ?? 0, 'text-emerald-300'],
          ] as [string, number, string][]).map(([label, val, color]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className={cn('text-[20px] font-bold', color)}>{val}</span>
              <span className="text-[10px] text-white/40">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* â”€â”€ REFERRAL LINK â”€â”€ */}
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-4">
        <p className={cn('text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3', dir === 'rtl' && 'text-right')}>
          {lang === 'ar' ? 'Ø±Ø§Ø¨Ø· Ø§Ù„Ø¥Ø­Ø§Ù„Ø© Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ' : 'Your Referral Link'}
        </p>
        <div className={cn('flex items-center gap-2 bg-gray-50 rounded-[10px] px-3 py-2 mb-3')}>
          <p className="flex-1 text-[12px] text-gray-600 font-mono truncate" dir="ltr">{referralLink}</p>
          <button
            onClick={copyLink}
            className={cn(
              'text-[11px] font-semibold px-3 py-[5px] rounded-[8px] transition-all flex-shrink-0',
              copied ? 'bg-emerald-100 text-emerald-700' : 'bg-[#C9AA71] text-[#0D1F2D]'
            )}
          >
            {copied ? t.copied : t.copyLink}
          </button>
        </div>
        <button
          onClick={() => setShowQR(q => !q)}
          className="text-[12px] text-[#2D6A4F] font-medium"
        >
          {showQR ? t.hideQR : t.shareQR}
        </button>
        {showQR && referralLink && <QRCode url={referralLink} />}
      </div>

      {/* â”€â”€ INVITE BY EMAIL â”€â”€ */}
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-4">
        <p className={cn('text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3', dir === 'rtl' && 'text-right')}>{t.inviteTitle}</p>
        <div className={cn('flex gap-2')}>
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder={t.invitePh}
            dir="ltr"
            className="flex-1 h-[40px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={sendInvite}
            disabled={inviteStatus !== 'idle' || !inviteEmail.includes('@')}
            className={cn(
              'px-4 rounded-[10px] text-[12px] font-semibold transition-all flex-shrink-0',
              inviteStatus === 'sent'  ? 'bg-emerald-100 text-emerald-700' :
              inviteStatus === 'error' ? 'bg-red-100 text-red-600' :
              'bg-emerald-600 text-white disabled:opacity-40'
            )}
          >
            {inviteStatus === 'idle'    ? t.inviteBtn :
             inviteStatus === 'sending' ? t.sending :
             inviteStatus === 'sent'    ? t.sentOk : t.inviteErr}
          </button>
        </div>
      </div>

      {/* â”€â”€ REDEEM POINTS â”€â”€ */}
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-4">
        <p className={cn('text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3', dir === 'rtl' && 'text-right')}>{t.redeemTitle}</p>
        <div className="flex flex-col gap-2">

          {/* Premium month */}
          <div className={cn('flex items-center justify-between bg-amber-50 border border-amber-200 rounded-[12px] px-4 py-3')}>
            <div className={dir === 'rtl' ? 'text-right' : ''}>
              <p className="text-[14px] font-semibold text-amber-900">â­ {t.redeemPrem}</p>
              <p className="text-[11px] text-amber-600">{t.premCost}</p>
            </div>
            <button
              onClick={() => redeem('PREMIUM_MONTH')}
              disabled={!canRedeemPrem || redeemStatus !== 'idle'}
              className={cn(
                'text-[12px] font-semibold px-4 py-[7px] rounded-[10px] transition-all',
                redeemStatus === 'done' ? 'bg-emerald-100 text-emerald-700' :
                canRedeemPrem ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-400'
              )}
            >
              {redeemStatus === 'loading' ? t.redeeming :
               redeemStatus === 'done'    ? (redeemMsg || t.redeemOk) :
               canRedeemPrem ? t.redeemBtn : t.notEnough}
            </button>
          </div>

          {/* Theme unlock */}
          <div className={cn('flex items-center justify-between bg-purple-50 border border-purple-200 rounded-[12px] px-4 py-3')}>
            <div className={dir === 'rtl' ? 'text-right' : ''}>
              <p className="text-[14px] font-semibold text-purple-900">ðŸŽ¨ {t.redeemTheme}</p>
              <p className="text-[11px] text-purple-600">{t.themeCost}</p>
            </div>
            <button
              onClick={() => setShowThemePicker(true)}
              disabled={!canRedeemTheme || redeemStatus !== 'idle'}
              className={cn(
                'text-[12px] font-semibold px-4 py-[7px] rounded-[10px] transition-all',
                canRedeemTheme ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
              )}
            >
              {canRedeemTheme ? t.redeemBtn : t.notEnough}
            </button>
          </div>
        </div>
      </div>

      {/* â”€â”€ THEME PICKER MODAL â”€â”€ */}
      {showThemePicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-[24px] p-5 pb-10 max-h-[70vh] overflow-y-auto">
            <p className="text-[15px] font-bold text-gray-900 mb-4">{t.themeSelect}</p>
            {/* Simplified theme list â€” hardcoded keys matching the app's theme definitions */}
            {[
              { key: 'desert-gold',     label: 'ðŸŒ… Desert Gold' },
              { key: 'ocean-teal',      label: 'ðŸŒŠ Ocean Teal' },
              { key: 'midnight-purple', label: 'ðŸŒ™ Midnight Purple' },
              { key: 'olive-grove',     label: 'ðŸ«’ Olive Grove' },
              { key: 'rose-dawn',       label: 'ðŸŒ¸ Rose Dawn' },
            ].map(theme => (
              <button
                key={theme.key}
                onClick={() => redeem('THEME_UNLOCK', theme.key)}
                className="w-full text-left py-3 px-4 rounded-[12px] bg-gray-50 border border-gray-200 mb-2 text-[14px] font-medium text-gray-800 active:bg-gray-100"
              >
                {theme.label}
              </button>
            ))}
            <button onClick={() => setShowThemePicker(false)} className="w-full text-center text-[13px] text-gray-400 mt-2">
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ REFERRAL LIST â”€â”€ */}
      <div className="mx-4 mb-4">
        <p className={cn('text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2', dir === 'rtl' && 'text-right tracking-normal')}>{t.listTitle}</p>
        <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
          {!data?.referrals.length ? (
            <p className="text-center text-[13px] text-gray-400 py-8">{t.noReferrals}</p>
          ) : (
            data.referrals.map((ref, i) => (
              <div
                key={ref.id}
                className={cn('px-4 py-3', i < data.referrals.length - 1 && 'border-b border-gray-100')}
              >
                <div className={cn('flex items-center justify-between')}>
                  <div className={dir === 'rtl' ? 'text-right' : ''}>
                    <p className="text-[13px] font-semibold text-gray-900">
                      {ref.referred?.name ?? ref.sentToEmail ?? 'â€”'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {ref.referred?.email ?? ref.sentToEmail ?? ''}
                    </p>
                    <p className="text-[10px] text-gray-300 mt-[2px]">
                      {ref.activatedAt  ? new Date(ref.activatedAt).toLocaleDateString()  :
                       ref.signedUpAt   ? new Date(ref.signedUpAt).toLocaleDateString()   :
                       ref.sentAt       ? new Date(ref.sentAt).toLocaleDateString()       : ''}
                    </p>
                  </div>
                  <span className={cn('text-[10px] font-bold border rounded-full px-2 py-[3px]', statusColor(ref.status))}>
                    {statusLabel(ref.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* â”€â”€ HOW IT WORKS â”€â”€ */}
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-4">
        <p className={cn('text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3', dir === 'rtl' && 'text-right')}>{t.rulesTitle}</p>
        <ol className={cn('flex flex-col gap-2', dir === 'rtl' && 'text-right')}>
          {REFERRAL_RULES[lang].map((rule, i) => (
            <li key={i} className={cn('flex gap-3 text-[12px] text-gray-600 leading-relaxed')}>
              <span className="text-[#C9AA71] font-bold flex-shrink-0">{i + 1}.</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* â”€â”€ REDEMPTION HISTORY â”€â”€ */}
      {(data?.redemptions.length ?? 0) > 0 && (
        <div className="mx-4 mb-4">
          <p className={cn('text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2', dir === 'rtl' && 'text-right tracking-normal')}>{t.historyTitle}</p>
          <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
            {data!.redemptions.map((r, i) => (
              <div key={r.id} className={cn('flex items-center justify-between px-4 py-3', i < data!.redemptions.length - 1 && 'border-b border-gray-100')}>
                <div className={dir === 'rtl' ? 'text-right' : ''}>
                  <p className="text-[13px] font-medium text-gray-800">
                    {r.type === 'PREMIUM_MONTH' ? 'â­ ' + t.redeemPrem : 'ðŸŽ¨ ' + (r.themeKey ?? t.redeemTheme)}
                  </p>
                  <p className="text-[11px] text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-[12px] font-bold text-red-400">âˆ’{r.pointsCost} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

