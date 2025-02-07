'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  mode?: 'single' | 'range';
  className?: string;
}

export function Calendar({ 
  selected, 
  onSelect, 
  disabled,
  className,
  mode = 'single' 
}: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      modifiers={{ disabled: disabled }}
      className={cn(
        'p-3 bg-popover text-popover-foreground',
        className
      )}
      required={false}
    />
  );
} 