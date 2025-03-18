import type { Metadata } from 'next'
import '@/app/globals.css'
import { Inter } from 'next/font/google'
import Header from '@/app/components/Header'
import { systemThemeScript } from './utils/theme-script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { AnalyticsProvider } from './providers/AnalyticsProvider'
import { ReduxProvider } from './providers/ReduxProvider'
import ClientLayout from './components/ClientLayout'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/app/(auth)/auth'
import Script from 'next/script'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

// Define the base URL for the entire application
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://legiequity.us'

// Check if we're in development or if this is the dev site
function isDevelopment() {
  // Check based on environment variable
  if (process.env.NODE_ENV === 'development') return true
  
  // Check based on hostname
  try {
    const headersList = headers()
    const host = headersList.get('host') || ''
    return host.includes('dev.legiequity') || host.includes('localhost') || host.includes('127.0.0.1')
  } catch (e) {
    return false
  }
}

export const metadata: Metadata = {
  title: 'LegiEquity Monitor',
  description: 'AI-powered legislative analysis for racial equity impact assessment',
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: '/',
  },
  // Add robots directive based on environment
  robots: isDevelopment() ? {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    }
  } : {
    index: true,
    follow: true,
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  return (
    <html lang="en" className="[color-scheme:dark_light] dark">
      <head>
        <meta name="apple-mobile-web-app-title" content="LegiEquity" />
        {isDevelopment() && (
          <meta name="robots" content="noindex, nofollow" />
        )}
        <script dangerouslySetInnerHTML={{ __html: systemThemeScript() }} />
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.GOOGLE_ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} antialiased bg-white dark:bg-zinc-900`}>
        <SessionProvider session={session}>
          <ReduxProvider>
            <ClientLayout>
              <Header />
              <main className="w-full pt-8 pb-2">
                <AnalyticsProvider>
                  {children}
                </AnalyticsProvider>
              </main>
              <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
            </ClientLayout>
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

