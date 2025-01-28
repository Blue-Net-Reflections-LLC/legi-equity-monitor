'use client';

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterTagProps {
  id: string;
  label: string;
  onRemove: () => void;
  className?: string;
}

export function FilterTag({ id, label, onRemove, className }: FilterTagProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800",
        className
      )}
    >
      {label}
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Remove {label} filter</span>
      </button>
    </div>
  );
} 