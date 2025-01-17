'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/app/components/ui/button";

const RACE_CODES = {
  AI: 'American Indian/Alaska Native',
  AP: 'Asian/Pacific Islander',
  BH: 'Black/African American',
  WH: 'White'
} as const;

const SEVERITIES = ['mild', 'medium', 'high', 'urgent'] as const;
const IMPACT_TYPES = ['POSITIVE', 'NEGATIVE'] as const;

interface FilterOptions {
  committees: string[];
  categories: string[];
}

export default function FilterDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [options, setOptions] = useState<FilterOptions>({
    committees: [],
    categories: []
  });

  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    race_code: searchParams.get('race_code') || '',
    impact_type: searchParams.get('impact_type') || '',
    severity: searchParams.get('severity') || '',
    committee: searchParams.get('committee') || '',
    category: searchParams.get('category') || '',
  });

  // Fetch filter options
  useEffect(() => {
    async function fetchOptions() {
      try {
        setError(null);
        const response = await fetch('/api/filters');
        if (!response.ok) {
          throw new Error('Failed to fetch filter options');
        }
        const data = await response.json();
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
    fetchOptions();
  }, []);

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: typeof filters) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push('?' + params.toString());
    setFilters(newFilters);
  }, [router, searchParams]);

  const handleChange = (field: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    updateFilters({ ...filters, [field]: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('categories');
    selectedOptions.forEach(value => params.append('categories', value));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden md:inline">Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
        <SheetHeader>
          <SheetTitle>Filter Bills</SheetTitle>
          <SheetDescription>
            Filter bills by various criteria
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {/* Categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categories</label>
            <select
              className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
              multiple
              size={5}
              value={searchParams.getAll('categories')}
              onChange={handleCategoryChange}
            >
              {options.categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Race/Ethnicity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Race/Ethnicity</label>
            <select
              className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
              value={searchParams.get('race_code') || ''}
              onChange={e => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) {
                  params.set('race_code', e.target.value);
                } else {
                  params.delete('race_code');
                }
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              <option value="">All Groups</option>
              {Object.entries(RACE_CODES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          {/* Impact Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Impact Type</label>
            <select
              className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
              value={searchParams.get('impact_type') || ''}
              onChange={e => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) {
                  params.set('impact_type', e.target.value);
                } else {
                  params.delete('impact_type');
                }
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              <option value="">Any Impact</option>
              {IMPACT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Severity</label>
            <select
              className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
              value={searchParams.get('severity') || ''}
              onChange={e => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) {
                  params.set('severity', e.target.value);
                } else {
                  params.delete('severity');
                }
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              <option value="">Any Severity</option>
              {SEVERITIES.map(severity => (
                <option key={severity} value={severity}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Committee */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Committee</label>
            <select
              className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
              value={searchParams.get('committee') || ''}
              onChange={e => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) {
                  params.set('committee', e.target.value);
                } else {
                  params.delete('committee');
                }
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              <option value="">All Committees</option>
              {options.committees.map(committee => (
                <option key={committee} value={committee}>{committee}</option>
              ))}
            </select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 