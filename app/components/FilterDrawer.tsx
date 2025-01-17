'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button 
          className="p-3 bg-white dark:bg-zinc-800 rounded-lg shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-200 dark:border-zinc-700"
          title="Filter Bills"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="hidden sm:inline">Filters</span>
          <span className="sr-only">Open Filters</span>
        </button>
      </SheetTrigger>
      <SheetContent className="bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
        <SheetHeader>
          <SheetTitle>Filter Bills</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6 overflow-y-auto max-h-[calc(100vh-8rem)] pr-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Race/Ethnicity */}
          <div className="space-y-2">
            <label htmlFor="race_code" className="font-medium block">Race/Ethnicity</label>
            <select
              id="race_code"
              value={filters.race_code}
              onChange={handleChange('race_code')}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2"
            >
              <option value="">All Groups</option>
              {Object.entries(RACE_CODES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          {/* Impact Type */}
          <div className="space-y-2">
            <label htmlFor="impact_type" className="font-medium block">Impact Type</label>
            <select
              id="impact_type"
              value={filters.impact_type}
              onChange={handleChange('impact_type')}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2"
            >
              <option value="">Any Impact</option>
              {IMPACT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label htmlFor="severity" className="font-medium block">Severity</label>
            <select
              id="severity"
              value={filters.severity}
              onChange={handleChange('severity')}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2"
            >
              <option value="">Any Severity</option>
              {SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Committee */}
          {options.committees.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="committee" className="font-medium block">Committee</label>
              <select
                id="committee"
                value={filters.committee}
                onChange={handleChange('committee')}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2"
              >
                <option value="">All Committees</option>
                {options.committees.map((committee) => (
                  <option key={committee} value={committee}>{committee}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          {options.categories.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="category" className="font-medium block">Category</label>
              <select
                id="category"
                value={filters.category}
                onChange={handleChange('category')}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2"
              >
                <option value="">All Categories</option>
                {options.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 