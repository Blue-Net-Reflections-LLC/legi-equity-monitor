'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchResult } from './SearchDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Bill, Sponsor } from '@/app/types'
import { StateIcon } from './StateIcon'
import { Star as StarIcon } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-red-500',
  'bg-cyan-500',
  'bg-rose-500',
]

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

interface SearchResultsProps {
  results: SearchResult[]
  isLoading: boolean
  onItemClick?: () => void
}

export function SearchResults({ results, isLoading, onItemClick }: SearchResultsProps) {
  const router = useRouter()

  const bills = results.filter(r => r.type === 'bill').slice(0, 50)
  const sponsors = results.filter(r => r.type === 'sponsor').slice(0, 50)

  const handleItemClick = (path: string) => {
    if (onItemClick) onItemClick()
    router.push(path)
  }

  if (isLoading) {
    return (
      <div className="h-full overflow-auto space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (!results.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">
          No results found
        </p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="bills" className="h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2 p-0.5 bg-indigo-100/50 dark:bg-indigo-900/50 rounded">
        <TabsTrigger 
          value="bills"
          className="text-zinc-600 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:bg-white dark:data-[state=active]:bg-black rounded transition-colors px-4 py-1.5"
        >
          Bills ({bills.length})
        </TabsTrigger>
        <TabsTrigger 
          value="sponsors"
          className="text-zinc-600 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:bg-white dark:data-[state=active]:bg-black rounded transition-colors px-4 py-1.5"
        >
          Sponsors ({sponsors.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent 
        value="bills" 
        className="flex-1 min-h-0 mt-2 overflow-auto [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb]:bg-zinc-300
          dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
          [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <div className="space-y-2">
          {bills.map(result => {
            const bill = result.item as Bill
            return (
              <BillResult 
                key={bill.bill_id}
                bill={bill}
                onClick={() => handleItemClick(`/bill/${bill.bill_id}`)}
              />
            )
          })}
        </div>
      </TabsContent>

      <TabsContent 
        value="sponsors"
        className="flex-1 min-h-0 mt-2 overflow-auto [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-thumb]:rounded-full 
          [&::-webkit-scrollbar-thumb]:bg-zinc-300
          dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
          [&::-webkit-scrollbar-track]:bg-transparent"
      >
        <div className="space-y-2">
          {sponsors.map(result => {
            const sponsor = result.item as Sponsor
            return (
              <SponsorResult 
                key={sponsor.people_id}
                sponsor={sponsor}
                onClick={() => handleItemClick(`/sponsor/${sponsor.people_id}`)}
              />
            )
          })}
        </div>
      </TabsContent>
    </Tabs>
  )
}

function BillResult({ bill, onClick }: { bill: Bill, onClick: () => void }) {
  return (
    <div 
      className="flex items-start space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-900 rounded"
      onClick={onClick}
    >
      {bill.state_abbr === 'DC' ? (
        <div className="w-9 h-9 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
          <StarIcon className="w-6 h-6 fill-red-500 stroke-red-500" />
        </div>
      ) : bill.state_abbr === 'US' ? (
        <div className="w-9 h-9 rounded bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
          <Image
            src="/images/Seal_of_the_United_States_Congress.svg"
            alt="US Congress Seal"
            width={36}
            height={36}
            className="rounded"
          />
        </div>
      ) : (
        <StateIcon stateAbbr={bill.state_abbr} size={36} />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {bill.state_abbr} • {bill.bill_number}
        </div>
        <div className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1" title={bill.title}>
          {bill.title}
        </div>
      </div>
    </div>
  )
}

function SponsorResult({ sponsor, onClick }: { sponsor: Sponsor, onClick: () => void }) {
  return (
    <div 
      className="flex items-start space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-900 rounded"
      onClick={onClick}
    >
      {sponsor.photo_url ? (
        <Image
          src={sponsor.photo_url}
          alt={sponsor.name}
          width={36}
          height={36}
          className="rounded object-cover"
        />
      ) : (
        <div className={`w-9 h-9 rounded ${getAvatarColor(sponsor.people_id)} flex items-center justify-center text-sm font-medium text-white`}>
          {sponsor.first_name[0]}{sponsor.last_name[0]}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {sponsor.state_abbr} • {sponsor.party_name} • {sponsor.role_id === 1 ? 'Senator' : 'Representative'}
        </div>
        <div className="text-sm text-zinc-900 dark:text-zinc-100">
          {sponsor.name}
        </div>
      </div>
    </div>
  )
} 