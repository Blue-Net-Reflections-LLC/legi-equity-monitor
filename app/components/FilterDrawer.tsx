'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  // Fetch filter options
  useEffect(() => {
    async function fetchOptions() {
      try {
        const response = await fetch('/api/filters');
        if (!response.ok) {
          throw new Error('Failed to fetch filter options');
        }
        const data = await response.json();
        setOptions(data);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    }
    fetchOptions();
  }, []);

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
        <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Categories */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categories</label>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md dark:border-zinc-700">
              {options.categories.map(category => {
                const isChecked = searchParams.getAll('categories').includes(category);
                return (
                  <label key={category} className="flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (e.target.checked) {
                          params.append('categories', category);
                        } else {
                          const values = params.getAll('categories').filter(v => v !== category);
                          params.delete('categories');
                          values.forEach(v => params.append('categories', v));
                        }
                        router.push(`${pathname}?${params.toString()}`);
                      }}
                      className="rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Race/Ethnicity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Race/Ethnicity</label>
            <div className="grid grid-cols-1 gap-2 p-2 border rounded-md dark:border-zinc-700">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('race_code');
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className={`text-left py-1 px-2 rounded text-sm ${!searchParams.get('race_code') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                All Groups
              </button>
              {Object.entries(RACE_CODES).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('race_code', code);
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className={`text-left py-1 px-2 rounded text-sm ${searchParams.get('race_code') === code 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Impact Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Impact Type</label>
            <div className="grid grid-cols-1 gap-2 p-2 border rounded-md dark:border-zinc-700">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('impact_type');
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className={`text-left py-1 px-2 rounded text-sm ${!searchParams.get('impact_type') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                Any Impact
              </button>
              {IMPACT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('impact_type', type);
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className={`text-left py-1 px-2 rounded text-sm ${searchParams.get('impact_type') === type 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Severity</label>
            <div className="grid grid-cols-1 gap-2 p-2 border rounded-md dark:border-zinc-700">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('severity');
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className={`text-left py-1 px-2 rounded text-sm ${!searchParams.get('severity') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                Any Severity
              </button>
              {SEVERITIES.map(severity => (
                <button
                  key={severity}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('severity', severity);
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className={`text-left py-1 px-2 rounded text-sm ${searchParams.get('severity') === severity 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
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