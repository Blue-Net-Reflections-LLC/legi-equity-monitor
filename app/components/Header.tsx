'use client'

import Link from 'next/link'
import { Scale, Menu, Search } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useState } from 'react'
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

  const handleSignOut = async () => {
    await signOutAction();
    window.location.href = '/';
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
            <button className="p-2 hover:bg-accent rounded-full text-zinc-600 dark:text-zinc-200">
              <Search className="h-5 w-5" />
            </button>

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
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-200 hover:bg-accent hover:text-accent-foreground"
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

