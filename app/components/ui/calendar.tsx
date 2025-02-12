'use client';

import * as React from 'react';
import { DayPicker, DayPickerSingleProps } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface CalendarProps extends Omit<DayPickerSingleProps, 'mode'> {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  className?: string;
}

export function Calendar({ 
  selected, 
  onSelect, 
  disabled,
  className,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      modifiers={{ disabled: disabled }}
      className={cn(
        'p-3 bg-white dark:bg-zinc-950 text-neutral-950 dark:text-neutral-50',
        '[&_.rdp-nav_button>svg]:fill-neutral-950 [&_.rdp-nav_button>svg]:dark:fill-white',
        '[&_.rdp-nav_button>svg]:w-4 [&_.rdp-nav_button>svg]:h-4',
        '[&_.rdp-nav_button]:h-8 [&_.rdp-nav_button]:w-8 [&_.rdp-nav_button]:p-0',
        '[&_.rdp-nav_button]:hover:bg-zinc-100 [&_.rdp-nav_button]:dark:hover:bg-zinc-800',
        className
      )}
      required={false}
      {...props}
    />
  );
} 