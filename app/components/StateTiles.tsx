"use client";

import Link from 'next/link';

interface State {
  name: string;
  code: string;
  enabled: boolean;
}

const STATES: State[] = [
  { name: 'Georgia', code: 'GA', enabled: true },
  // Add other states as disabled for now
  { name: 'Florida', code: 'FL', enabled: false },
  { name: 'Alabama', code: 'AL', enabled: false },
  { name: 'South Carolina', code: 'SC', enabled: false },
  { name: 'North Carolina', code: 'NC', enabled: false },
  { name: 'Tennessee', code: 'TN', enabled: false },
  { name: 'Mississippi', code: 'MS', enabled: false },
  { name: 'Louisiana', code: 'LA', enabled: false },
];

export default function StateTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATES.map(({ name, code, enabled }) => (
        <div key={code} className="relative">
          {enabled ? (
            <Link
              href={`/${code.toLowerCase()}`}
              className="relative flex items-center justify-center h-40 bg-zinc-50/10 dark:bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden group hover:bg-zinc-100/20 dark:hover:bg-white/20 transition-all duration-300"
            >
              <span className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
                {name}
              </span>
            </Link>
          ) : (
            <div className="relative flex items-center justify-center h-40 bg-zinc-100/5 dark:bg-white/5 rounded-lg overflow-hidden cursor-not-allowed">
              <span className="text-lg font-semibold text-zinc-400 dark:text-zinc-600">
                {name}
              </span>
              <div className="absolute inset-0 flex items-center justify-center bg-white/10 dark:bg-black/10 backdrop-blur-[1px]">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Coming Soon</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 