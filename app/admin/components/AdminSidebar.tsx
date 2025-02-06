'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ScrollText, Network, ClipboardList, Users } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'

const adminNavItems = [
  {
    title: 'Home',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    title: 'Blog Posts',
    href: '/admin/blog',
    icon: ScrollText
  },
  {
    title: 'Clustering',
    href: '/admin/clustering',
    icon: Network
  },
  {
    title: 'Bills Analysis',
    href: '/admin/bills',
    icon: ClipboardList
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users
  }
]

export function AdminSidebar() {
  const { sidebarExpanded, setSidebarExpanded, setActiveSection } = useAdmin()
  const pathname = usePathname()

  return (
    <div 
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 z-20 mt-2",
        sidebarExpanded ? "w-48" : "w-16"
      )}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
    >
      <nav className="p-3 space-y-2">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap",
                isActive 
                  ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "transition-opacity",
                sidebarExpanded ? "opacity-100" : "opacity-0"
              )}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 