'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { BillFilters } from "./BillFilters";
import type { BillFilters as BillFiltersType } from "@/app/types/filters";
import { FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

interface BillFiltersWrapperProps {
  filters: BillFiltersType;
  stateCode: string;
}

export function BillFiltersWrapper({ filters, stateCode }: BillFiltersWrapperProps) {
  const router = useRouter();
  const [optimisticParty, setOptimisticParty] = useState<string | undefined>(filters.party);

  const handlePartyChange = useCallback((party: string) => {
    // Optimistically update the UI
    setOptimisticParty(party === 'ALL' ? undefined : party);

    // Update URL and trigger navigation
    const searchParams = new URLSearchParams(window.location.search);
    if (party === 'ALL') {
      searchParams.delete('party');
    } else {
      searchParams.set('party', party);
    }
    router.push(`/${stateCode.toLowerCase()}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  }, [stateCode, router]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 text-gray-900 dark:text-zinc-100">
          <FilterIcon className="h-4 w-4" />
          Filter Bills
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "sm:max-w-[800px] lg:max-w-[1000px] max-h-[80vh] overflow-y-auto",
        "bg-white dark:bg-zinc-900",
        "[&>button>svg]:text-gray-900 dark:[&>button>svg]:text-zinc-100"
      )}>
        <BillFilters 
          filters={{
            ...filters,
            party: optimisticParty || 'ALL'
          }}
          stateCode={stateCode}
          onPartyChange={handlePartyChange}
          onFilterChange={(newFilters) => {
            // Convert filters to URL params and navigate
            const params = new URLSearchParams();
            
            // Handle category filters
            newFilters.categories.forEach(category => {
              if (category.selected || category.impactTypes.some(i => i.selected)) {
                params.append('category', category.id);
                const selectedImpacts = category.impactTypes.filter(i => i.selected);
                if (selectedImpacts.length > 0) {
                  selectedImpacts.forEach(impact => {
                    params.append(`impact_${category.id}`, impact.type);
                  });
                }
              }
            });

            // Handle party filter
            if (newFilters.party !== 'ALL') {
              params.set('party', newFilters.party);
            }

            // Handle support filter
            if (newFilters.support !== 'ALL') {
              params.set('support', newFilters.support);
            }

            // Handle committee filters
            const selectedCommittees = newFilters.committees.filter(c => c.selected);
            if (selectedCommittees.length > 0) {
              selectedCommittees.forEach(committee => {
                params.append('committee', committee.name);
              });
            }

            window.location.href = `/${stateCode.toLowerCase()}${params.toString() ? `?${params.toString()}` : ''}`;
          }} 
        />
      </DialogContent>
    </Dialog>
  );
} 