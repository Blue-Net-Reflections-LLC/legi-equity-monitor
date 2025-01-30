'use client'

import type { Metadata } from 'next'
import '@/app/globals.css'
import { Inter } from 'next/font/google'
import Header from '@/app/components/Header'
import { systemThemeScript } from './utils/theme-script'
import { useEffect } from 'react'
import { embeddingService } from './services/embedding.service'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LegiEquity Monitor',
  description: 'AI-powered legislative analysis for racial equity impact assessment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Prefetch the model when the app loads
    embeddingService.load().catch(console.error)

    // Cleanup when the app unmounts
    return () => {
      embeddingService.dispose()
    }
  }, [])

  return (
    <html lang="en" className="[color-scheme:dark_light]" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: systemThemeScript() }} />
      </head>
      <body className={`${inter.className} antialiased bg-white dark:bg-zinc-900`}>
        <Header />
        <main className="container mx-auto px-4 pt-8 pb-2">
          {children}
        </main>
      </body>
    </html>
  )
}

