'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileText, PlusCircle } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: 'View Posts',
    href: '/admin/blog',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    title: 'Create Post',
    href: '/admin/blog/create',
    icon: <PlusCircle className="w-4 h-4" />,
  },
];

export default function BlogAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex mx-4">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 fixed top-14 bottom-0 left-14">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Blog Admin</h1>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  "text-zinc-400 hover:text-white hover:bg-zinc-900",
                  "transition-colors"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64  ">
         {children}
      </div>
    </div>
  );
} 