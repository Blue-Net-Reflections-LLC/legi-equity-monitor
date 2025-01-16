'use client';

import { ReactNode } from "react";

export default function AnimatedContent({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-8 items-center justify-center px-4 w-full">
      {children}
    </div>
  );
} 