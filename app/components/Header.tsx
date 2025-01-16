import Link from 'next/link'
import { Scale } from 'lucide-react'

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Scale size={24} className="text-zinc-900 dark:text-white" />
          <span className="text-xl font-bold text-zinc-900 dark:text-white">LegiEquity</span>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href="/" className="text-zinc-700 dark:text-neutral-200 hover:text-zinc-900 dark:hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/search" className="text-zinc-700 dark:text-neutral-200 hover:text-zinc-900 dark:hover:text-white transition-colors">
                Search
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

