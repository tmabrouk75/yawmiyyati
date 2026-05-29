'use client'

import { cn } from '@/lib/utils'

// ─── SETTINGS GROUP ───────────────────────────────────────

export function SettingsGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-4 mb-0', className)}>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// ─── SECTION HEADER ───────────────────────────────────────

export function SectionHeader({
  title,
  dir = 'ltr',
}: {
  title: string
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <p
      className={cn(
        'mx-4 mt-5 mb-2 text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 px-[2px]',
        dir === 'rtl' && 'text-right tracking-normal text-[11px] normal-case'
      )}
    >
      {title}
    </p>
  )
}

// ─── SETTINGS ROW ─────────────────────────────────────────

export function SettingsRow({
  icon,
  label,
  sublabel,
  right,
  onPress,
  isLast = false,
  dir = 'ltr',
  danger = false,
}: {
  icon?: string
  label: string
  sublabel?: string
  right?: React.ReactNode
  onPress?: () => void
  isLast?: boolean
  dir?: 'ltr' | 'rtl'
  danger?: boolean
}) {
  const Tag = onPress ? 'button' : 'div'
  return (
    <Tag
      onClick={onPress}
      className={cn(
        'flex items-center w-full px-[14px] py-[11px] gap-3 text-left transition-colors',
        !isLast && 'border-b border-gray-100',
        onPress && 'active:bg-gray-50 cursor-pointer',
        dir === 'rtl' && 'flex-row-reverse text-right'
      )}
    >
      {icon && (
        <span className="text-[18px] w-[22px] text-center flex-shrink-0">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className={cn('text-[14px]', danger ? 'text-red-500' : 'text-gray-900')}>
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] text-gray-400 mt-[1px]">{sublabel}</div>
        )}
      </div>
      {right && (
        <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
      )}
      {onPress && !right && (
        <span className="text-gray-300 text-[16px]">
          {dir === 'rtl' ? '‹' : '›'}
        </span>
      )}
    </Tag>
  )
}

// ─── TOGGLE SWITCH ────────────────────────────────────────

export function Toggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        'relative w-[44px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0',
        value ? 'bg-emerald-500' : 'bg-gray-200',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200',
          value ? 'translate-x-[21px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  )
}

// ─── BADGE ────────────────────────────────────────────────

export function Badge({
  label,
  color = 'emerald',
}: {
  label: string
  color?: 'emerald' | 'gold' | 'gray'
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    gold:    'bg-amber-50  text-amber-700  border-amber-100',
    gray:    'bg-gray-100  text-gray-500   border-gray-200',
  }
  return (
    <span className={cn(
      'text-[10px] font-semibold px-[8px] py-[3px] rounded-full border',
      colors[color]
    )}>
      {label}
    </span>
  )
}

// ─── AVATAR ───────────────────────────────────────────────

export function Avatar({
  name,
  size = 48,
}: {
  name: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="text-emerald-700 font-semibold"
        style={{ fontSize: size * 0.36 }}
      >
        {initials}
      </span>
    </div>
  )
}
