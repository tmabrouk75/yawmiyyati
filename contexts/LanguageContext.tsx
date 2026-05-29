'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Lang = 'en' | 'ar'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  dir: 'ltr' | 'rtl'
  isAr: boolean
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  dir: 'ltr',
  isAr: false,
})

export function LanguageProvider({
  children,
  initial = 'en',
}: {
  children: React.ReactNode
  initial?: Lang
}) {
  const [lang, setLangState] = useState<Lang>(initial)

  // Sync html dir attribute
  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l)
    // Persist to localStorage for guest / fast load
    try { localStorage.setItem('yw_lang', l) } catch {}
    // Persist to server if logged in
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: l.toUpperCase() }),
      })
    } catch {}
  }, [])

  return (
    <LanguageContext.Provider value={{
      lang,
      setLang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      isAr: lang === 'ar',
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}

// ─── Language toggle component (reusable everywhere) ──────

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang()

  return (
    <div className={`flex bg-white/10 rounded-[8px] p-[2px] gap-[2px] ${className ?? ''}`}>
      {(['en', 'ar'] as Lang[]).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={[
            'px-[10px] py-[4px] rounded-[6px] text-[11px] font-semibold transition-all duration-150',
            lang === l
              ? 'bg-white text-gray-900'
              : 'text-white/60 hover:text-white/90',
          ].join(' ')}
        >
          {l === 'en' ? 'EN' : 'ع'}
        </button>
      ))}
    </div>
  )
}
