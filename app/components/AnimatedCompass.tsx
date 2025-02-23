'use client';

import { ArrowUpRight, Compass } from "lucide-react";
import Link from "next/link";

export default function AnimatedCompass() {
  return (
    <div className="relative flex flex-col items-center gap-3">
      {/* Main Compass Container */}
      <div className="relative">
        {/* Rotating Outer Ring */}
        <div className="absolute -inset-1 rounded-full border-2 border-dashed border-emerald-500/30 dark:border-emerald-500/30 animate-spin-slow"></div>
        
        <div className="relative z-10 bg-zinc-900/10 dark:bg-white/10 backdrop-blur-lg rounded-full p-6 border border-zinc-900/20 dark:border-white/20 shadow-xl">
          <div className="relative">
            {/* Center Icon */}
            <Compass className="w-8 h-8 text-emerald-600 dark:text-emerald-500 animate-pulse" />
            
            {/* Orbiting Dots */}
            <div className="absolute inset-0 animate-spin-reverse">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Bubble with Link */}
      <div className="pointer-events-auto bg-zinc-900/10 dark:bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-zinc-900/20 dark:border-white/20">
        <div className="flex flex-col items-center gap-1">
          <p className="text-zinc-900 dark:text-white text-sm font-medium text-center">
            Click any state on the map
          </p>
          <Link
            href="/states"
            className="group inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            or browse all states
            <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
} 