'use client'

import { cn } from '@/lib/utils'

// ─── FARD CHECKBOX — 3 states: unchecked / done / qadaa ──
// Tap once  → done (green)
// Tap twice → qadaa (dark red — prayed late as compensation)
// Tap third → back to unchecked

export type FardState = 'unchecked' | 'done' | 'qadaa'

interface FardCheckBoxProps {
  state:    FardState
  onChange: (val: FardState) => void
  size?:    'sm' | 'md'
}

const FARD_CYCLE: Record<FardState, FardState> = {
  unchecked: 'done',
  done:      'qadaa',
  qadaa:     'unchecked',
}

export function FardCheckBox({ state, onChange, size = 'md' }: FardCheckBoxProps) {
  const sizes = { sm: 'w-5 h-5 text-[10px]', md: 'w-[22px] h-[22px] text-[12px]' }

  const styles: Record<FardState, string> = {
    unchecked: 'border-[2px] border-emerald-600 bg-transparent text-transparent',
    done:      'bg-emerald-600 border-emerald-600 text-white',
    qadaa:     'bg-red-700 border-red-700 text-white',
  }

  const icons: Record<FardState, string> = {
    unchecked: '✓',
    done:      '✓',
    qadaa:     'Q',
  }

  return (
    <div
      role="checkbox"
      aria-checked={state !== 'unchecked'}
      title={state === 'qadaa' ? 'Qadaa — prayed late' : undefined}
      className={cn(
        'flex items-center justify-center rounded-[6px] cursor-pointer transition-all duration-150 select-none flex-shrink-0 font-semibold',
        sizes[size],
        styles[state],
      )}
      onClick={() => onChange(FARD_CYCLE[state])}
    >
      {icons[state]}
    </div>
  )
}

// ─── REGULAR CHECKBOX ─────────────────────────────────────

interface CheckBoxProps {
  checked:  boolean
  onChange: (val: boolean) => void
  variant?: 'default' | 'fard' | 'azkar' | 'ramadan' | 'monday' | 'whitedays' | 'mosque'
  size?:    'sm' | 'md'
  disabled?: boolean
}

export function CheckBox({ checked, onChange, variant = 'default', size = 'md', disabled }: CheckBoxProps) {
  const base  = 'flex items-center justify-center rounded-[6px] cursor-pointer transition-all duration-150 select-none flex-shrink-0'
  const sizes = { sm: 'w-5 h-5 text-[11px]', md: 'w-[22px] h-[22px] text-[12px]' }

  const variants: Record<string, string> = {
    default:  checked ? 'bg-emerald-600  border-emerald-600  text-white' : 'border border-gray-300 bg-transparent text-transparent',
    fard:     checked ? 'bg-emerald-700  border-emerald-700  text-white' : 'border-[2px] border-emerald-700 bg-transparent text-transparent',
    azkar:    checked ? 'bg-blue-500     border-blue-500     text-white' : 'border-[2px] border-blue-400   bg-transparent text-transparent',
    ramadan:  checked ? 'bg-emerald-600  text-white shadow-[0_0_0_2px_rgba(16,185,129,0.25)] border-[2.5px] border-emerald-600' : 'border-[2.5px] border-emerald-600 bg-transparent text-transparent',
    monday:   checked ? 'bg-blue-600     text-white border-[2.5px] border-blue-600'   : 'border-[2.5px] border-blue-600   bg-transparent text-transparent',
    whitedays:checked ? 'bg-gray-500     text-white border-[2.5px] border-gray-500'   : 'border-[2.5px] border-gray-500   shadow-[inset_0_0_0_2px_white] bg-transparent text-transparent',
    mosque:   checked ? 'text-white border-[2.5px]' : 'border-[2.5px] bg-transparent text-transparent',
  }

  const mosqueStyle = variant === 'mosque'
    ? { borderColor: '#1B4332', ...(checked ? { backgroundColor: '#1B4332' } : {}) }
    : {}

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      className={cn(base, sizes[size], variants[variant] ?? variants.default, disabled && 'opacity-50 pointer-events-none')}
      style={mosqueStyle}
      onClick={() => !disabled && onChange(!checked)}
    >
      ✓
    </div>
  )
}

// ─── NUMBER INPUT ─────────────────────────────────────────

interface NumberInputProps {
  value:       number
  onChange:    (val: number) => void
  placeholder?: string
  min?:        number
  max?:        number
  width?:      string
}

export function NumberInput({ value, onChange, placeholder = '0', min = 0, max, width = 'w-[52px]' }: NumberInputProps) {
  return (
    <input
      type="number"
      value={value || ''}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={e => {
        const v = parseInt(e.target.value) || 0
        onChange(Math.max(min, max ? Math.min(max, v) : v))
      }}
      className={cn(
        width,
        'h-[28px] rounded-[8px] border border-gray-200 bg-gray-50',
        'text-center text-[13px] font-medium text-gray-900',
        'focus:outline-none focus:border-emerald-500',
        'transition-colors duration-150'
      )}
    />
  )
}

// ─── ACTIVITY GROUP ───────────────────────────────────────

export function ActivityGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-0 mt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-gray-400 mb-[6px] px-[2px]">
        {title}
      </p>
      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// ─── ACTIVITY ROW ─────────────────────────────────────────

interface ActivityRowProps {
  icon:      string
  label:     string
  sublabel?: string
  right:     React.ReactNode
  isLast?:   boolean
  dir?:      'ltr' | 'rtl'
  dimmed?:   boolean   // for items being phased out (disabled in settings but still have history)
}

export function ActivityRow({ icon, label, sublabel, right, isLast, dir = 'ltr', dimmed }: ActivityRowProps) {
  return (
    <div
      className={cn(
        'flex items-center px-[14px] py-[10px] gap-[10px] transition-opacity duration-300',
        !isLast && 'border-b border-gray-100',
        dir === 'rtl' && 'flex-row-reverse',
        dimmed && 'opacity-40',
      )}
    >
      <span className="text-[15px] w-5 text-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-gray-900 leading-tight">{label}</div>
        {sublabel && <div className="text-[10px] text-gray-400 mt-[1px]">{sublabel}</div>}
      </div>
      <div className="flex items-center gap-[6px] flex-shrink-0">{right}</div>
    </div>
  )
}

