import Link from 'next/link'
import { Scale } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Scale size={24} />
          <span className="text-xl font-bold">Legislation Tracker</span>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
            <li><Link href="/search" className="hover:text-gray-300">Search</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

