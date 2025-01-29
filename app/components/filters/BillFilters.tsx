'use client';

import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { CheckCircle, AlertCircle, MinusCircle } from "lucide-react";
import type { BillFilters as BillFiltersType, ImpactType } from "@/app/types/filters";
import { FilterTag } from "@/app/components/filters/FilterTag";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

interface BillFiltersProps {
  filters: BillFiltersType;
  onFilterChange: (filters: BillFiltersType) => void;
}

const CATEGORIES = [
  { id: 'gender', name: 'Gender' },
  { id: 'disability', name: 'Disability' },
  { id: 'age', name: 'Age' },
  { id: 'race', name: 'Race' },
  { id: 'religion', name: 'Religion' },
  { id: 'veterans', name: 'Veterans' }
];

const ImpactIcons = {
  POSITIVE: CheckCircle,
  BIAS: AlertCircle,
  NEUTRAL: MinusCircle
};

const ImpactLabels = {
  POSITIVE: 'Positive Impact',
  BIAS: 'Bias Impact',
  NEUTRAL: 'Neutral Impact'
};

const PARTY_LABELS = {
  'ALL': 'All Parties',
  'D': 'Democratic',
  'R': 'Republican',
  'I': 'Independent'
} as const;

export function BillFilters({ filters, onFilterChange }: BillFiltersProps) {
  const handleCategoryImpactChange = (categoryId: string, impactType: ImpactType) => {
    onFilterChange({
      ...filters,
      categories: filters.categories.map(c => 
        c.id === categoryId 
          ? {
              ...c,
              impactTypes: c.impactTypes.map(i => ({
                ...i,
                selected: i.type === impactType ? !i.selected : i.selected
              }))
            }
          : c
      ),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* First Column: Categories */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Impact Categories</h3>
          <div className="rounded-lg p-2 bg-zinc-900 h-[240px] overflow-y-auto">
            <div className="space-y-1">
              {CATEGORIES.map(category => {
                const categoryFilter = filters.categories.find(c => c.id === category.id);
                return (
                  <div
                    key={category.id}
                    className={cn(
                      "flex items-center gap-2 p-0.5 rounded-lg",
                      "transition-colors w-full"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-7 font-normal px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 flex-1",
                        (categoryFilter?.selected || categoryFilter?.impactTypes.some(i => i.selected)) && "bg-zinc-700"
                      )}
                      onClick={() => {
                        const isCurrentlySelected = categoryFilter?.selected || categoryFilter?.impactTypes.some(i => i.selected);
                        onFilterChange({
                          ...filters,
                          categories: filters.categories.map(c => 
                            c.id === category.id 
                              ? {
                                  ...c,
                                  selected: !isCurrentlySelected,
                                  impactTypes: isCurrentlySelected 
                                    ? c.impactTypes.map(i => ({ ...i, selected: false }))
                                    : c.impactTypes
                              }
                              : c
                          ),
                        });
                      }}
                    >
                      {category.name}
                    </Button>
                    <div className="flex gap-1.5 shrink-0">
                      <TooltipProvider>
                        {(['POSITIVE', 'BIAS', 'NEUTRAL'] as const).map((type) => {
                          const Icon = ImpactIcons[type];
                          const isSelected = categoryFilter?.impactTypes.find(i => i.type === type)?.selected;
                          return (
                            <Tooltip key={type}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-7 w-7 p-0 rounded-md bg-zinc-800 hover:bg-zinc-700",
                                    isSelected && "bg-zinc-700 ring-1 ring-inset",
                                    type === 'POSITIVE' && isSelected && "ring-green-500",
                                    type === 'BIAS' && isSelected && "ring-red-500",
                                    type === 'NEUTRAL' && isSelected && "ring-gray-500"
                                  )}
                                  onClick={() => handleCategoryImpactChange(category.id, type)}
                                >
                                  <Icon className={cn(
                                    "h-4 w-4",
                                    type === 'POSITIVE' && "text-green-500",
                                    type === 'BIAS' && "text-red-500",
                                    type === 'NEUTRAL' && "text-gray-500"
                                  )} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-zinc-900 border border-zinc-700 text-zinc-100">
                                <p>{ImpactLabels[type]}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Second Column: Committees */}
        {filters.committees.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Committees</h3>
            <div className="rounded-lg p-2 bg-zinc-900 h-[240px] overflow-y-auto">
              <div className="space-y-1">
                {/* Show all committees */}
                {filters.committees.map(committee => (
                  <div
                    key={committee.id}
                    className="flex items-center gap-2 p-0.5 rounded-lg w-full"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-9 font-normal px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 w-full justify-start text-xs",
                        committee.selected && "bg-zinc-700 ring-1 ring-inset ring-zinc-600"
                      )}
                      onClick={() => {
                        onFilterChange({
                          ...filters,
                          committees: filters.committees.map(c => 
                            c.id === committee.id 
                              ? { ...c, selected: !c.selected }
                              : c
                          ),
                        });
                      }}
                    >
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          committee.selected ? "bg-zinc-100" : "bg-zinc-600"
                        )} />
                        <span className="truncate">{committee.name}</span>
                      </div>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Third Column: Party and Support */}
        <div className="space-y-4 flex flex-col">
          {/* Party Filter */}
            <h3 className="font-medium text-lg">Party</h3>
            <div className="rounded-lg p-2 bg-zinc-900">
              <Select 
                value={filters.party} 
                onValueChange={(value: BillFiltersType['party']) => onFilterChange({ 
                  ...filters, 
                  party: value
                })}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 h-9">
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {Object.entries(PARTY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          {/* Support Filter */}
          <div className="flex-1">
            <h3 className="font-medium text-lg">Support</h3>
            <div className="rounded-lg p-2 bg-zinc-900 mt-4">
              <div className="space-y-1">
                {['ALL', 'HAS_SUPPORT', 'NO_SUPPORT'].map((support) => (
                  <div key={support} className="flex items-center gap-2 p-0.5 rounded-lg w-full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFilterChange({ ...filters, support: support as BillFiltersType['support'] })}
                      className={cn(
                        "h-9 font-normal px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 flex-1 justify-start",
                        filters.support === support && "bg-zinc-700"
                      )}
                    >
                      {support === 'ALL' ? 'All Support' : 
                       support === 'HAS_SUPPORT' ? 'Has Support' : 'No Support'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

<style jsx global>{`
  .tooltip-content {
    background-color: rgb(24 24 27) !important; /* zinc-900 */
    border: 1px solid rgb(63 63 70) !important; /* zinc-700 */
    color: rgb(244 244 245) !important; /* zinc-100 */
  }
`}</style> 