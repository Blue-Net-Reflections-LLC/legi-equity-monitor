"use client";

import Link from 'next/link';
import Image from 'next/image';
import { STATES, State } from '../constants/states';

export default function StateTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATES.map(({ name, code }) => (
        <div key={code} className="relative p-1">
          <Link
            href={`/${code.toLowerCase()}`}
            className="relative flex flex-col items-center justify-center h-40 bg-zinc-50/10 dark:bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden group hover:bg-zinc-100/20 dark:hover:bg-white/20 transition-all duration-300 border border-zinc-200 dark:border-zinc-700 p-4 hover:border-zinc-300 dark:hover:border-zinc-600"
          >
            <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
              {code === 'US' ? (
                <Image
                  src="/images/Seal_of_the_United_States_Congress.svg"
                  alt={name}
                  fill
                  className="object-contain"
                />
              ) : code === 'DC' ? (
                <div className="text-4xl font-bold text-zinc-600 dark:text-zinc-400">
                  DC
                </div>
              ) : (
                <Image
                  src={`/images/states/${code.toLowerCase()}.svg`}
                  alt={name}
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
              {name}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 