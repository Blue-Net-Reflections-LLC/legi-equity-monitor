"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-zinc-900 dark:text-white mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300 mb-6">Page Not Found</h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-center mb-8 max-w-md">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors duration-200"
      >
        Return Home
      </Link>
    </div>
  );
} 