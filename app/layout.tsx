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

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LegiEquity Monitor',
  description: 'AI-powered legislative analysis for racial equity impact assessment',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  return (
    <html lang="en" className="[color-scheme:dark_light]">
      <head>
        <script dangerouslySetInnerHTML={{ __html: systemThemeScript() }} />
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

