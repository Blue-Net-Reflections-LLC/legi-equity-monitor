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
  { id: 'race', name: 'Race' },
  { id: 'religion', name: 'Religion' },
  { id: 'gender', name: 'Gender' },
  { id: 'age', name: 'Age' },
  { id: 'nationality', name: 'Nationality' },
  { id: 'sexual_orientation', name: 'Sexual Orientation' },
  { id: 'disability', name: 'Disability' },
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
  // Generate active filter tags
  const activeTags = [
    // Category filters with impact types
    ...filters.categories
      .filter(c => c.selected || c.impactTypes.some(i => i.selected))
      .map(category => ({
        id: `category-${category.id}`,
        label: `${category.name}${category.impactTypes.filter(i => i.selected).map(i => ` (${i.type})`).join(', ')}`,
        onRemove: () => onFilterChange({
          ...filters,
          categories: filters.categories.map(c => 
            c.id === category.id 
              ? { ...c, selected: false, impactTypes: c.impactTypes.map(i => ({ ...i, selected: false })) }
              : c
          ),
        }),
      })),
    // Party filter
    ...(filters.party !== 'ALL' ? [{
      id: `party-${filters.party}`,
      label: `Party: ${filters.party}`,
      onRemove: () => onFilterChange({ ...filters, party: 'ALL' }),
    }] : []),
    // Support filter
    ...(filters.support !== 'ALL' ? [{
      id: `support-${filters.support}`,
      label: filters.support === 'HAS_SUPPORT' ? 'Has Support' : 'No Support',
      onRemove: () => onFilterChange({ ...filters, support: 'ALL' }),
    }] : []),
    // Committee filters
    ...filters.committees
      .filter(c => c.selected)
      .map(committee => ({
        id: `committee-${committee.id}`,
        label: `Committee: ${committee.name}`,
        onRemove: () => onFilterChange({
          ...filters,
          committees: filters.committees.map(c => 
            c.id === committee.id ? { ...c, selected: false } : c
          ),
        }),
      })),
  ];

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
      {/* Active filters */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeTags.map(tag => (
            <FilterTag key={tag.id} {...tag} />
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onFilterChange({
                ...filters,
                party: 'ALL',
                support: 'ALL',
                categories: filters.categories.map(c => ({
                  ...c,
                  impactTypes: c.impactTypes.map(i => ({ ...i, selected: false }))
                })),
                committees: filters.committees.map(c => ({ ...c, selected: false })),
              });
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* First Column: Categories */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Impact Categories</h3>
          <div className="space-y-2 border rounded-lg p-3 bg-white dark:bg-zinc-900">
            {CATEGORIES.map(category => {
              const categoryFilter = filters.categories.find(c => c.id === category.id);
              return (
                <div
                  key={category.id}
                  className={cn(
                    "flex items-center justify-between p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700",
                    "hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors",
                    (categoryFilter?.selected || categoryFilter?.impactTypes.some(i => i.selected)) && "bg-zinc-50 dark:bg-zinc-800"
                  )}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 flex-1 justify-start font-normal px-2",
                      (categoryFilter?.selected || categoryFilter?.impactTypes.some(i => i.selected)) && "font-medium"
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
                                impactTypes: c.impactTypes.map(i => ({ 
                                  ...i, 
                                  selected: false 
                                }))
                            }
                            : c
                        ),
                      });
                    }}
                  >
                    {category.name}
                  </Button>
                  <div className="flex gap-1 px-1">
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
                                  "p-1 h-7 w-7",
                                  isSelected && "bg-zinc-200 dark:bg-zinc-700"
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
                            <TooltipContent>
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

        {/* Second Column: Committees */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Committees</h3>
          <div className="border rounded-lg bg-white dark:bg-zinc-900">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-700 max-h-[400px] overflow-y-auto">
              {filters.committees.map(committee => (
                <Button
                  key={committee.id}
                  variant={committee.selected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start h-9 rounded-none text-sm",
                    "transition-colors",
                    committee.selected && "font-medium"
                  )}
                  onClick={() => onFilterChange({
                    ...filters,
                    committees: filters.committees.map(c => 
                      c.id === committee.id ? { ...c, selected: !c.selected } : c
                    ),
                  })}
                >
                  {committee.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Third Column: Party and Support */}
        <div className="space-y-6">
          {/* Party Filter */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Party</h3>
            <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
              <Select 
                value={filters.party} 
                onValueChange={(value: BillFiltersType['party']) => onFilterChange({ 
                  ...filters, 
                  party: value
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARTY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Support Filter */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Support</h3>
            <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'HAS_SUPPORT', 'NO_SUPPORT'].map((support) => (
                  <Button
                    key={support}
                    variant={filters.support === support ? "default" : "outline"}
                    size="sm"
                    onClick={() => onFilterChange({ ...filters, support: support as BillFiltersType['support'] })}
                    className="flex-1"
                  >
                    {support === 'ALL' ? 'All Support' : 
                     support === 'HAS_SUPPORT' ? 'Has Support' : 'No Support'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 