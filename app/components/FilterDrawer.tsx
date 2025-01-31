'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/app/components/ui/button";
import { useAnalytics } from '@/app/hooks/useAnalytics';
import { GTagData } from '@/app/utils/analytics';

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

interface FilterEventData extends GTagData {
  event_category: string;
  event_label: string;
  filter_categories?: string[];
  filter_race_code?: string | null;
  filter_impact_type?: string | null;
  filter_severity?: string | null;
  filter_committee?: string | null;
}

function FilterDrawerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();
  
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

  const handleFilterApply = (params: URLSearchParams) => {
    // Track the filter application
    trackEvent('filter_apply', {
      event_category: 'Filter',
      event_label: 'Bills Filter',
      filter_categories: params.getAll('categories'),
      filter_race_code: params.get('race_code'),
      filter_impact_type: params.get('impact_type'),
      filter_severity: params.get('severity'),
      filter_committee: params.get('committee')
    } as FilterEventData);
    
    // Apply the filter
    router.push(`${pathname}?${params.toString()}`);
  };

  // Update the category checkbox handler
  const handleCategoryChange = (category: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.append('categories', category);
    } else {
      const values = params.getAll('categories').filter(v => v !== category);
      params.delete('categories');
      values.forEach(v => params.append('categories', v));
    }
    handleFilterApply(params);
  };

  // Update other filter handlers similarly
  const handleRaceCodeChange = (code: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (code) {
      params.set('race_code', code);
    } else {
      params.delete('race_code');
    }
    handleFilterApply(params);
  };

  const handleImpactTypeChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type) {
      params.set('impact_type', type);
    } else {
      params.delete('impact_type');
    }
    handleFilterApply(params);
  };

  const handleSeverityChange = (severity: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (severity) {
      params.set('severity', severity);
    } else {
      params.delete('severity');
    }
    handleFilterApply(params);
  };

  const handleCommitteeChange = (committee: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (committee) {
      params.set('committee', committee);
    } else {
      params.delete('committee');
    }
    handleFilterApply(params);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          data-track-click
          data-track-event-category="Filter"
          data-track-event-action="filter_open"
          data-track-event-label="Bills Filter"
        >
          <Filter className="h-4 w-4" />
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
                      onChange={e => handleCategoryChange(category, e.target.checked)}
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
                onClick={() => handleRaceCodeChange('')}
                className={`text-left py-1 px-2 rounded text-sm ${!searchParams.get('race_code') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                All Groups
              </button>
              {Object.entries(RACE_CODES).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => handleRaceCodeChange(code)}
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
                onClick={() => handleImpactTypeChange('')}
                className={`text-left py-1 px-2 rounded text-sm ${!searchParams.get('impact_type') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                Any Impact
              </button>
              {IMPACT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleImpactTypeChange(type)}
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
                onClick={() => handleSeverityChange('')}
                className={`text-left py-1 px-2 rounded text-sm ${!searchParams.get('severity') 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                Any Severity
              </button>
              {SEVERITIES.map(severity => (
                <button
                  key={severity}
                  onClick={() => handleSeverityChange(severity)}
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
              onChange={e => handleCommitteeChange(e.target.value)}
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

export default function FilterDrawer() {
  return (
      <FilterDrawerContent />
  );
} 