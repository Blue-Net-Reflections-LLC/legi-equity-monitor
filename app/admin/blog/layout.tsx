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

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full">
      {/* Blog Navigation */}
      <div className="w-64 min-h-screen border-r border-zinc-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold mb-4 px-4">Blog Admin</h2>
        <nav className="space-y-2">
        {navItems.map((item) => (
            <Link
            key={item.href}
            href={item.href}
            className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                pathname === item.href
                ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
            )}
            >
            {item.icon}
            {item.title}
            </Link>
        ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
} 