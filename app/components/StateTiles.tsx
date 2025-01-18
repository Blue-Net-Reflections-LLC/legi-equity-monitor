"use client";

import Link from 'next/link';

interface State {
  name: string;
  code: string;
}

const STATES: State[] = [
  { name: 'Georgia', code: 'GA' },
  { name: 'Florida', code: 'FL' },
  { name: 'Alabama', code: 'AL' },
  { name: 'South Carolina', code: 'SC' },
  { name: 'North Carolina', code: 'NC' },
  { name: 'Tennessee', code: 'TN' },
  { name: 'Mississippi', code: 'MS' },
  { name: 'Louisiana', code: 'LA' },
  { name: 'California', code: 'CA' },
  { name: 'Texas', code: 'TX' },
  { name: 'New York', code: 'NY' },
  { name: 'Illinois', code: 'IL' },
];

export default function StateTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATES.map(({ name, code }) => (
        <div key={code} className="relative">
          <Link
            href={`/${code.toLowerCase()}`}
            className="relative flex items-center justify-center h-40 bg-zinc-50/10 dark:bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden group hover:bg-zinc-100/20 dark:hover:bg-white/20 transition-all duration-300"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
              {name}
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
} 