import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { getAuthUser } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'Yawmiyyati — يومياتي',
  description: 'Track your daily Islamic activities — prayers, Quran, dhikr and more',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Yawmiyyati',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D1F2D',
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read language from cookie/user for SSR
  const user = await getAuthUser().catch(() => null)
  const cookieLang = cookies().get('yw_lang')?.value
  const initialLang = (user?.language?.toLowerCase() ?? cookieLang ?? 'en') as 'en' | 'ar'

  return (
    <html lang={initialLang} dir={initialLang === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-gray-50 antialiased">
        <LanguageProvider initial={initialLang}>
          {/* On mobile: full screen. On desktop: centered phone frame */}
          <main className="flex justify-center min-h-screen md:items-center md:bg-[#0D1F2D] md:py-6">
            <div className="
              w-full max-w-[430px] min-h-screen relative overflow-hidden flex flex-col
              md:min-h-0 md:h-[calc(100vh-48px)] md:max-h-[900px]
              md:rounded-[40px] md:shadow-[0_32px_80px_rgba(0,0,0,0.5)]
              md:border md:border-white/10
            ">
              {children}
            </div>
          </main>
        </LanguageProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.warn('SW registration failed:', err);
              });
            });
          }
        `}} />
      </body>
    </html>
  )
}
