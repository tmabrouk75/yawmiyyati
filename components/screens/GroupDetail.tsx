'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const T = {
  en: {
    back:        'Back',
    progress:    'Group progress',
    members:     'Members',
    myContrib:   'My contribution',
    addContrib:  'Add contribution',
    addAmount:   'Amount to add',
    add:         'Add',
    adding:      'Adding...',
    target:      'Target',
    addMember:   'Add member',
    enterEmail:  "Member's email address",
    invite:      'Add',
    inviting:    'Adding...',
    invited:     '✓ Added',
    inviteErr:   'Could not find that email',
    leave:       'Leave group',
    delete:      'Delete group',
    completed:   'Goal Completed! 🎉',
    deadline:    'Deadline',
    noDeadline:  'No deadline',
    privacy:     'Only contribution totals are visible — no personal activity data is shared.',
    loading:     'Loading...',
    you:         'You',
    owner:       'Owner',
    me:          '(me)',
  },
  ar: {
    back:        'رجوع',
    progress:    'تقدم المجموعة',
    members:     'الأعضاء',
    myContrib:   'مساهمتي',
    addContrib:  'إضافة مساهمة',
    addAmount:   'الكمية المضافة',
    add:         'إضافة',
    adding:      'جارٍ الإضافة...',
    target:      'الهدف',
    addMember:   'إضافة عضو',
    enterEmail:  'البريد الإلكتروني للعضو',
    invite:      'إضافة',
    inviting:    'جارٍ الإضافة...',
    invited:     '✓ تمت الإضافة',
    inviteErr:   'البريد الإلكتروني غير موجود',
    leave:       'مغادرة المجموعة',
    delete:      'حذف المجموعة',
    completed:   'اكتمل الهدف! 🎉',
    deadline:    'الموعد النهائي',
    noDeadline:  'بلا موعد',
    privacy:     'تظهر مجاميع المساهمات فقط — لا تُشارك أي بيانات شخصية.',
    loading:     'جارٍ التحميل...',
    you:         'أنت',
    owner:       'المنشئ',
    me:          '(أنا)',
  },
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 40; const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, pct) / 100) * circ
  const color = pct >= 100 ? '#059669' : pct >= 60 ? '#0d9488' : '#6366f1'
  return (
    <div className="relative w-[100px] h-[100px]">
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8"/>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8"
          stroke={color} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold" style={{ color }}>{pct}%</span>
        {pct >= 100 && <span className="text-[12px]">🎉</span>}
      </div>
    </div>
  )
}

export default function GroupDetail({ groupId, isPremium }: { groupId: string; isPremium: boolean }) {
  const { lang, dir } = useLang()
  const t = T[lang]
  const router = useRouter()

  const [group,    setGroup]    = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [amount,   setAmount]   = useState('')
  const [adding,   setAdding]   = useState(false)
  const [email,    setEmail]    = useState('')
  const [inviting, setInviting] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  const load = useCallback(async () => {
    const res  = await fetch(`/api/groups/${groupId}`)
    const data = await res.json()
    setGroup(data.group)
    setLoading(false)
  }, [groupId])

  useEffect(() => { load() }, [load])

  const addContrib = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setAdding(true)
    const res  = await fetch(`/api/groups/${groupId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ amount: parseFloat(amount) }),
    })
    const data = await res.json()
    if (res.ok) {
      setGroup((g: any) => ({
        ...g,
        totalProgress: data.totalProgress,
        progressPct:   data.progressPct,
        members: g.members.map((m: any) =>
          m.isMe ? { ...m, contribution: data.myContribution } : m
        ),
      }))
      setAmount('')
    }
    setAdding(false)
  }

  const addMember = async () => {
    if (!email.trim()) return
    setInviting('loading')
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setGroup((g: any) => ({ ...g, members: [...g.members, { ...data.member, isMe: false }] }))
      setEmail('')
      setInviting('ok')
      setTimeout(() => setInviting('idle'), 2500)
    } else {
      setInviting('err')
      setTimeout(() => setInviting('idle'), 2500)
    }
  }

  const leaveOrDelete = async (action: 'leave' | 'delete') => {
    if (action === 'delete') {
      await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/groups/${groupId}/members`, { method: 'DELETE' })
    }
    router.push('/groups')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-gray-400">{t.loading}</p>
      </div>
    )
  }
  if (!group) return null

  const myMember   = group.members.find((m: any) => m.isMe)
  const goalType   = group.goalType?.replace(/_/g, ' ')
  const deadlineStr = group.deadline
    ? new Date(group.deadline).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')
    : t.noDeadline

  return (
    <div dir={dir} className="flex flex-col min-h-full bg-gray-50 pb-10">

      {/* TOP BAR */}
      <div className={cn('flex items-center gap-3 px-4 pt-4 pb-2', dir === 'rtl' && 'flex-row-reverse')}>
        <button onClick={() => router.back()} className="text-[13px] text-gray-400">
          {dir === 'rtl' ? '›' : '‹'} {t.back}
        </button>
      </div>
      <div className={cn('px-4 pb-4', dir === 'rtl' && 'text-right')}>
        <h1 className="text-[18px] font-semibold text-gray-900">
          {lang === 'ar' ? group.nameAr : group.nameEn}
        </h1>
        <p className="text-[12px] text-gray-400 mt-[2px]">
          {goalType} · {t.deadline}: {deadlineStr}
        </p>
      </div>

      {/* PROGRESS */}
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-5 flex items-center gap-5"
        style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
        <ProgressRing pct={group.progressPct}/>
        <div className={cn('flex-1', dir === 'rtl' && 'text-right')}>
          <p className="text-[11px] text-gray-400 font-medium mb-1">{t.progress}</p>
          <p className="text-[22px] font-bold text-gray-900">
            {group.totalProgress.toLocaleString()}
            <span className="text-[13px] text-gray-400 font-normal ml-1">/ {group.goalTarget.toLocaleString()} {group.goalUnit}</span>
          </p>
          {myMember && (
            <p className="text-[12px] text-gray-500 mt-1">
              {t.myContrib}: <span className="font-semibold text-gray-800">{myMember.contribution.toLocaleString()}</span>
            </p>
          )}
          {group.progressPct >= 100 && (
            <p className="text-[13px] font-semibold text-emerald-600 mt-1">{t.completed}</p>
          )}
        </div>
      </div>

      {/* ADD CONTRIBUTION */}
      {group.progressPct < 100 && (
        <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-4">
          <p className={cn('text-[12px] font-semibold text-gray-700 mb-3', dir === 'rtl' && 'text-right')}>
            {t.addContrib}
          </p>
          <div className={cn('flex gap-2', dir === 'rtl' && 'flex-row-reverse')}>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={t.addAmount}
              min="0"
              dir="ltr"
              className="flex-1 h-[42px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[14px] focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={addContrib}
              disabled={adding || !amount}
              className="px-5 h-[42px] rounded-[10px] bg-emerald-600 text-white text-[13px] font-semibold disabled:opacity-40"
            >
              {adding ? t.adding : t.add}
            </button>
          </div>
        </div>
      )}

      {/* MEMBERS */}
      <p className={cn('mx-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2', dir === 'rtl' && 'text-right tracking-normal normal-case text-[11px]')}>
        {t.members} ({group.members.length})
      </p>
      <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        {[...group.members]
          .sort((a: any, b: any) => b.contribution - a.contribution)
          .map((member: any, i: number) => {
            const pct = group.totalProgress > 0
              ? Math.round((member.contribution / group.totalProgress) * 100)
              : 0
            const isOwner = member.userId === group.owner?.id
            return (
              <div key={member.userId}
                className={cn('px-4 py-[10px] flex items-center gap-3', i > 0 && 'border-t border-gray-100', dir === 'rtl' && 'flex-row-reverse')}>
                {/* Rank */}
                <span className="text-[13px] font-bold text-gray-300 w-5 text-center flex-shrink-0">{i + 1}</span>
                {/* Name */}
                <div className={cn('flex-1 min-w-0', dir === 'rtl' && 'text-right')}>
                  <div className="flex items-center gap-1 flex-wrap"
                    style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
                    <span className="text-[13px] font-medium text-gray-900 truncate">{member.name}</span>
                    {member.isMe   && <span className="text-[10px] text-emerald-600 font-semibold">{t.me}</span>}
                    {isOwner       && <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-[1px]">{t.owner}</span>}
                  </div>
                  {/* Contribution bar */}
                  <div className="flex items-center gap-2 mt-1"
                    style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row' }}>
                    <div className="flex-1 h-[4px] bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="text-[11px] text-gray-500 flex-shrink-0 font-medium">
                      {member.contribution.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* ADD MEMBER (owner only, Premium) */}
      {group.isOwner && isPremium && (
        <div className="mx-4 mb-4 bg-white border border-gray-200 rounded-[14px] p-4">
          <p className={cn('text-[12px] font-semibold text-gray-700 mb-3', dir === 'rtl' && 'text-right')}>
            {t.addMember}
          </p>
          <div className={cn('flex gap-2', dir === 'rtl' && 'flex-row-reverse')}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.enterEmail}
              dir="ltr"
              className="flex-1 h-[42px] rounded-[10px] border border-gray-200 bg-gray-50 px-3 text-[13px] focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={addMember}
              disabled={inviting === 'loading' || inviting === 'ok'}
              className={cn(
                'px-4 h-[42px] rounded-[10px] text-[12px] font-semibold transition-all',
                inviting === 'ok'  ? 'bg-emerald-50 text-emerald-700' :
                inviting === 'err' ? 'bg-red-50 text-red-500' :
                'bg-gray-800 text-white disabled:opacity-50'
              )}
            >
              {inviting === 'idle'    ? t.invite
               : inviting === 'loading' ? t.inviting
               : inviting === 'ok'    ? t.invited
               : t.inviteErr}
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY NOTE */}
      <p className={cn('mx-4 mb-5 text-[11px] text-gray-400 text-center', dir === 'rtl' && 'text-center')}>
        🔒 {t.privacy}
      </p>

      {/* ACTIONS */}
      <div className="mx-4 flex flex-col gap-2">
        {!group.isOwner && (
          <button
            onClick={() => leaveOrDelete('leave')}
            className="w-full py-[12px] rounded-[12px] border border-red-100 text-red-500 text-[13px] font-medium"
          >
            {t.leave}
          </button>
        )}
        {group.isOwner && (
          <button
            onClick={() => leaveOrDelete('delete')}
            className="w-full py-[12px] rounded-[12px] border border-red-100 text-red-500 text-[13px] font-medium"
          >
            {t.delete}
          </button>
        )}
      </div>

    </div>
  )
}
