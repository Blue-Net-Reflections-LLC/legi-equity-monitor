'use client';

import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { BillFilters } from "./BillFilters";
import type { BillFilters as BillFiltersType } from "@/app/types/filters";
import { FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillFiltersWrapperProps {
  filters: BillFiltersType;
  stateCode: string;
}

export function BillFiltersWrapper({ filters, stateCode }: BillFiltersWrapperProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FilterIcon className="h-4 w-4" />
          Filter Bills
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "sm:max-w-[800px] lg:max-w-[1000px] max-h-[80vh] overflow-y-auto",
        "bg-white dark:bg-zinc-900",
        "before:fixed before:inset-0 before:bg-black/50 before:-z-10"
      )}>
        <BillFilters 
          filters={filters} 
          onFilterChange={(newFilters) => {
            // Convert filters to URL params and navigate
            const params = new URLSearchParams();
            
            // Handle category filters
            newFilters.categories.forEach(category => {
              if (category.selected || category.impactTypes.some(i => i.selected)) {
                params.append('category', category.id);
                const selectedImpacts = category.impactTypes.filter(i => i.selected);
                if (selectedImpacts.length > 0) {
                  // Only use the last selected impact type
                  const lastSelectedImpact = selectedImpacts[selectedImpacts.length - 1];
                  params.set(`impact_${category.id}`, lastSelectedImpact.type);
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
              params.set('committee', selectedCommittees.map(c => c.name).join(','));
            }

            window.location.href = `/${stateCode.toLowerCase()}${params.toString() ? `?${params.toString()}` : ''}`;
          }} 
        />
      </DialogContent>
    </Dialog>
  );
} 