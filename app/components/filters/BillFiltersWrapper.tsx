'use client';

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { BillFilters } from "./BillFilters";
import type { BillFilters as BillFiltersType } from "@/app/types/filters";
import { FilterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { VisuallyHidden } from "@/app/components/ui/visually-hidden";

interface BillFiltersWrapperProps {
  filters: BillFiltersType;
  stateCode: string;
}

export function BillFiltersWrapper({ filters, stateCode }: BillFiltersWrapperProps) {
  const router = useRouter();
  const [optimisticParty, setOptimisticParty] = useState<string | undefined>(filters.party);
  const [open, setOpen] = useState(false);

  const handlePartyChange = useCallback((party: string) => {
    // Optimistically update the UI
    setOptimisticParty(party === 'ALL' ? undefined : party as 'D' | 'R' | 'I');

    // Update URL and trigger navigation
    const searchParams = new URLSearchParams(window.location.search);
    if (party === 'ALL') {
      searchParams.delete('party');
    } else {
      searchParams.set('party', party);
    }
    router.push(`/${stateCode.toLowerCase()}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
    setOpen(false); // Close dialog after applying party filter
  }, [stateCode, router]);

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <DialogTrigger asChild>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-purple-600 dark:bg-purple-700 text-white border-purple-400 dark:border-transparent
                transition-all duration-200 hover:scale-105 
                hover:bg-purple-700 dark:hover:bg-purple-800
                hover:border-purple-500 dark:hover:border-transparent
                text-base font-semibold px-4 py-2"
              >
                <FilterIcon className="h-5 w-5 mr-1" />
                Explore
              </Button>
            </TooltipTrigger>
          </DialogTrigger>
          <TooltipContent className="bg-zinc-900 text-zinc-100 border border-zinc-700">
            <p>Explore bill selection</p>
          </TooltipContent>
        </Tooltip>
        <DialogContent className={cn(
          "sm:max-w-[800px] lg:max-w-[1000px] max-h-[80vh] overflow-y-auto",
          "bg-white dark:bg-zinc-900",
          "[&>button>svg]:text-gray-900 dark:[&>button>svg]:text-zinc-100"
        )}>
          <VisuallyHidden>
            <DialogTitle>Filter Bills</DialogTitle>
          </VisuallyHidden>
          <BillFilters 
            filters={{
              ...filters,
              party: (optimisticParty as 'D' | 'R' | 'I') || 'ALL'
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

              // Use Next.js router instead of window.location
              router.push(`/${stateCode.toLowerCase()}${params.toString() ? `?${params.toString()}` : ''}`);
              setOpen(false); // Close dialog after applying filters
            }} 
          />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
} 