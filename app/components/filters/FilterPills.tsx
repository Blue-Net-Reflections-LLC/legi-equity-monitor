'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, MinusCircle } from "lucide-react";
import type { BillFilters as BillFiltersType } from "@/app/types/filters";

const impactTypeIcons = {
  POSITIVE: CheckCircle,
  BIAS: AlertCircle,
  NEUTRAL: MinusCircle
} as const;

const categoryColors = {
  gender: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
  disability: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
  age: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
  race: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400",
  religion: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400",
  veterans: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400"
} as const;

const partyNames = {
  'D': 'Democrat',
  'R': 'Republican',
  'I': 'Independent'
} as const;

interface FilterPillsProps {
  categoryFilters: Array<{ id: string; impactTypes: Array<'POSITIVE' | 'BIAS' | 'NEUTRAL'> }>;
  billFilters: BillFiltersType;
  filters: {
    party?: string;
    support?: string;
    committee?: string[];
  };
  searchParams: { [key: string]: string | string[] | undefined };
  stateCode: string;
}

export function FilterPills({ 
  categoryFilters = [],
  billFilters, 
  filters = {},
  searchParams, 
  stateCode 
}: FilterPillsProps) {
  const router = useRouter();

  const hasActiveFilters = (categoryFilters?.length > 0) || 
    filters.party || 
    filters.support || 
    (filters.committee?.length > 0);

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-wrap gap-2 justify-end">
        {/* Category filters with impact types */}
        {categoryFilters?.map(({ id }) => {
          const category = billFilters.categories.find(c => c.id === id);
          if (!category || !categoryColors[id as keyof typeof categoryColors]) return null;
          const selectedImpacts = category.impactTypes.filter(i => i.selected);
          const newParams = new URLSearchParams(searchParams as Record<string, string>);
          
          // Get all categories except the one being removed
          const otherCategories = categoryFilters
            .filter(cat => cat.id !== id)
            .map(cat => cat.id);
          
          // Clear the current parameters
          newParams.delete('category');
          newParams.delete(`impact_${id}`);
          
          // Add back other categories and their impacts
          otherCategories.forEach(catId => {
            newParams.append('category', catId);
            const impactParam = searchParams[`impact_${catId}`];
            if (impactParam) {
              if (Array.isArray(impactParam)) {
                impactParam.forEach(imp => newParams.append(`impact_${catId}`, imp));
              } else {
                newParams.append(`impact_${catId}`, impactParam);
              }
            }
          });
          
          return (
            <button
              key={`filter-${id}`}
              onClick={() => {
                router.push(`/${stateCode.toLowerCase()}${newParams.toString() ? `?${newParams.toString()}` : ''}`);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:opacity-90 transition-colors ${categoryColors[id as keyof typeof categoryColors]}`}
            >
              {category.name}
              {selectedImpacts.map(impact => {
                const Icon = impactTypeIcons[impact.type];
                return (
                  <Icon
                    key={impact.type}
                    className={`h-4 w-4 ${
                      impact.type === 'POSITIVE' ? 'text-emerald-600 dark:text-emerald-400' :
                      impact.type === 'BIAS' ? 'text-red-600 dark:text-red-400' :
                      'text-zinc-600 dark:text-zinc-400'
                    }`}
                  />
                );
              })}
              <span className="ml-1 text-zinc-400 hover:text-zinc-500">×</span>
            </button>
          );
        })}
        
        {/* Party filter */}
        {filters.party && (() => {
          const newParams = new URLSearchParams(searchParams as Record<string, string>);
          newParams.delete('party');
          return (
            <button
              onClick={() => {
                router.push(`/${stateCode.toLowerCase()}${newParams.toString() ? `?${newParams.toString()}` : ''}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 px-3 py-1.5 text-sm hover:opacity-90 transition-colors"
            >
              {partyNames[filters.party as keyof typeof partyNames] || filters.party}
              <span className="text-zinc-400 hover:text-zinc-500">×</span>
            </button>
          );
        })()}

        {/* Support filter */}
        {filters.support && (() => {
          const newParams = new URLSearchParams(searchParams as Record<string, string>);
          newParams.delete('support');
          return (
            <button
              onClick={() => {
                router.push(`/${stateCode.toLowerCase()}${newParams.toString() ? `?${newParams.toString()}` : ''}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400 px-3 py-1.5 text-sm hover:opacity-90 transition-colors"
            >
              {filters.support === 'HAS_SUPPORT' ? 'Has Support' : 'No Support'}
              <span className="text-zinc-400 hover:text-zinc-500">×</span>
            </button>
          );
        })()}

        {/* Committee filter */}
        {filters.committee && filters.committee.map(committee => {
          const newParams = new URLSearchParams(searchParams as Record<string, string>);
          // Remove only this specific committee
          newParams.delete('committee');
          filters.committee?.filter(c => c !== committee).forEach(c => {
            newParams.append('committee', c);
          });
          return (
            <button
              key={`committee-${committee}`}
              onClick={() => {
                router.push(`/${stateCode.toLowerCase()}${newParams.toString() ? `?${newParams.toString()}` : ''}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-400 px-3 py-1.5 text-sm hover:opacity-90 transition-colors"
            >
              {committee}
              <span className="text-zinc-400 hover:text-zinc-500">×</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => {
          router.push(`/${stateCode.toLowerCase()}`);
        }}
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 whitespace-nowrap"
      >
        Clear all
      </button>
    </div>
  );
} 