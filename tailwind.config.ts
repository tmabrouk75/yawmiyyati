import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand — Madinah Night (default theme)
        brand: {
          gold:       '#C9AA71',
          'gold-dim': 'rgba(201,170,113,0.6)',
          navy:       '#0D1F2D',
          'navy-mid': '#152433',
          'navy-light':'#1E3448',
        },
        // Semantic
        emerald: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        // Fasting badge colors
        fasting: {
          ramadan:   '#1D9E75',
          monday:    '#3A6BB5',
          whitedays: '#888888',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"',
          'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
        arabic: [
          '"Segoe UI"', 'Tahoma', '"Arabic Typesetting"',
          '"Traditional Arabic"', 'sans-serif',
        ],
      },
      borderRadius: {
        phone: '44px',
        card:  '14px',
        pill:  '999px',
      },
      boxShadow: {
        phone: '0 0 0 1.5px #333, inset 0 0 0 1px #2a2a2a',
        card:  '0 1px 3px rgba(0,0,0,0.08)',
      },
      screens: {
        // Mobile-first — max 430px is phone
        xs:  '375px',
        sm:  '430px',
      },
      maxWidth: {
        mobile: '430px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.35s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}

export default config
