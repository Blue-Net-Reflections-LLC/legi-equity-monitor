'use client'

import Link from 'next/link'
import { Scale, Menu, Search } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { signOutAction } from '../(auth)/actions';
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { SearchDialog } from './search/SearchDialog'

const NavLinks = ({ onClick }: { onClick?: () => void }) => (
  <nav className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
    <Link 
      href="/" 
      className="text-sm text-zinc-600 dark:text-zinc-200 hover:text-orange-500 transition-colors"
      onClick={onClick}
    >
      Home
    </Link>
    <Link 
      href="/about" 
      className="text-sm text-zinc-600 dark:text-zinc-200 hover:text-orange-500 transition-colors"
      onClick={onClick}
    >
      About
    </Link>
    <Link 
      href="/blog" 
      className="text-sm text-zinc-600 dark:text-zinc-200 hover:text-orange-500 transition-colors"
      onClick={onClick}
    >
      Impact Blog
    </Link>
    <Link 
      href="/contact" 
      className="text-sm text-zinc-600 dark:text-zinc-200 hover:text-orange-500 transition-colors"
      onClick={onClick}
    >
      Contact
    </Link>
  </nav>
)

export default function Header() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role && ['admin', 'author', 'editor'].includes(session.user.role);
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowProfile(false);
    }, 500);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setShowProfile(true);
  };

  const handleSignOut = async () => {
    await signOutAction();
    window.location.href = '/';
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div className="w-full max-w-[2000px] mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-zinc-900 dark:text-white" />
            <span className="text-xl font-bold text-zinc-900 dark:text-white">LegiEquity</span>
          </Link>
        </div>

        <div className="flex items-center space-x-6">
          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <NavLinks />
          </div>

          <div className="flex items-center space-x-4">
            <SearchDialog />

            <ThemeToggle />

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-zinc-600 dark:text-zinc-200">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-white dark:bg-zinc-900">
                <div className="flex flex-col gap-4 py-4">
                  <NavLinks onClick={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            {!session ? (
              <Link 
                href="/login"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-200 hover:text-orange-500 transition-colors"
                onClick={() => {
                  sessionStorage.removeItem('redirect');
                  sessionStorage.setItem('redirect', window.location.href);
                }}
              >
                Sign In
              </Link>
            ) : (
              <Popover open={showProfile} onOpenChange={setShowProfile}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-200 hover:bg-accent hover:text-accent-foreground"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    {session.user.image && (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm">{session.user.name?.split(' ')[0]}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-56 border bg-white dark:bg-zinc-900/95 border-zinc-200 dark:border-zinc-800" 
                  align="end"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {session.user.email}
                      </p>
                    </div>
                    {isAdmin && (
                      <>
                        <Separator className="bg-zinc-200 dark:bg-zinc-800" />
                        <div className="space-y-1.5">
                          <Link 
                            href="/admin" 
                            className="block text-sm text-zinc-600 dark:text-zinc-100 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                          >
                            Admin Dashboard
                          </Link>
                        </div>
                        <Separator className="bg-zinc-200 dark:bg-zinc-800" />
                      </>
                    )}
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-center py-1.5 text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

