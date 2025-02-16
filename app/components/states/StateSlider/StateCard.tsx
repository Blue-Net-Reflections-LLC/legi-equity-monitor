'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface StateCardProps {
  state: {
    name: string;
    code: string;
  };
  isSelected: boolean;
}

export function StateCard({ state, isSelected }: StateCardProps) {
  return (
    <Link
      href={`/${state.code.toLowerCase()}`}
      className={cn(
        "flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-lg overflow-hidden transition-all duration-300",
        "bg-transparent backdrop-blur-sm border border-zinc-200 dark:border-zinc-700",
        "hover:border-zinc-300 dark:hover:border-zinc-600",
        isSelected 
          ? "ring-2 ring-orange-500 dark:ring-orange-400" 
          : "hover:bg-zinc-100/10 dark:hover:bg-white/5",
        "scroll-snap-align-start py-2"
      )}
    >
      <div className="relative w-12 h-12 mb-1 flex items-center justify-center">
        {state.code === 'US' ? (
          <Image
            src="/images/Seal_of_the_United_States_Congress.svg"
            alt={state.name}
            fill
            className="object-contain"
          />
        ) : state.code === 'DC' ? (
          <div className={cn(
            "text-2xl font-bold",
            isSelected
              ? "text-orange-500 dark:text-orange-400"
              : "text-zinc-900 dark:text-white"
          )}>
            DC
          </div>
        ) : (
          <Image
            src={`/images/states/${state.code.toLowerCase()}.svg`}
            alt={state.name}
            fill
            className="object-contain"
          />
        )}
      </div>
      <div className={cn(
        "text-sm font-semibold text-center px-2",
        isSelected
          ? "text-orange-500 dark:text-orange-400"
          : "text-zinc-900 dark:text-white"
      )}>
        {state.name}
      </div>
    </Link>
  );
} 