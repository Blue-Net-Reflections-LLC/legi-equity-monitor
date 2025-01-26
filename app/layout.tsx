import '@/app/globals.css'
import { Inter } from 'next/font/google'
import Header from '@/app/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LegiEquity Monitor',
  description: 'AI-powered legislative analysis for racial equity impact assessment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="container mx-auto px-4 pt-8 pb-2">
          {children}
        </main>
      </body>
    </html>
  )
}

