'use client'

import Link from 'next/link'
import { Scale, Menu } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { SearchDialog } from './search/SearchDialog'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

const NavLinks = ({ onClick }: { onClick?: () => void }) => (
  <ul className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
    <li>
      <Link 
        href="/" 
        className="text-zinc-700 dark:text-neutral-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
        onClick={onClick}
      >
        Home
      </Link>
    </li>
    <li>
      <Link 
        href="/about" 
        className="text-zinc-700 dark:text-neutral-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
        onClick={onClick}
      >
        About
      </Link>
    </li>
    <li>
      <Link 
        href="/blog" 
        className="text-zinc-700 dark:text-neutral-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
        onClick={onClick}
      >
        Impact Blog
      </Link>
    </li>
    <li>
      <Link 
        href="/contact" 
        className="text-zinc-700 dark:text-neutral-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
        onClick={onClick}
      >
        Contact
      </Link>
    </li>
  </ul>
)

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="absolute top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Scale size={24} className="text-zinc-900 dark:text-white" />
          <span className="text-xl font-bold text-zinc-900 dark:text-white">LegiEquity</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-4">
          <NavLinks />
          <div className="flex items-center space-x-2">
            <SearchDialog />
            <ThemeToggle showTooltip />
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex sm:hidden items-center space-x-2">
          <SearchDialog />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800">
                <Menu className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white dark:bg-zinc-950">
              <div className="absolute left-4 top-3">
                <ThemeToggle showTooltip />
              </div>
              <div className="flex flex-col h-full pt-16">
                <nav className="flex flex-col space-y-4">
                  <NavLinks onClick={() => setOpen(false)} />
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

