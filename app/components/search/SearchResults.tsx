'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchResult } from './SearchDialog'
import { Bill, Sponsor } from '@/app/types'
import { StateIcon } from './StateIcon'
import { Star as StarIcon } from 'lucide-react'
import { memo } from 'react'

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

export const SearchResults = memo(function SearchResults({ 
  results, 
  isLoading, 
  onItemClick 
}: SearchResultsProps) {
  const router = useRouter()

  const bills = results.filter(r => r.type === 'bill').slice(0, 50)
  const sponsors = results.filter(r => r.type === 'sponsor').slice(0, 50)

  const handleItemClick = (path: string) => {
    if (onItemClick) onItemClick()
    router.push(path)
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto px-2 [&::-webkit-scrollbar]:w-2 
        [&::-webkit-scrollbar-thumb]:rounded-full 
        [&::-webkit-scrollbar-thumb]:bg-zinc-300
        dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
        [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {sponsors.length > 0 && (
          <div className="mt-2">
            <h3 className="font-medium text-sm text-white bg-indigo-500/90 dark:bg-indigo-500/50 px-3 py-1 rounded mb-2">
              Sponsors ({sponsors.length})
            </h3>
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
          </div>
        )}

        {bills.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-sm text-white bg-indigo-500/90 dark:bg-indigo-500/50 px-3 py-1 rounded mb-2">
              Bills ({bills.length})
            </h3>
            <div className="space-y-2">
              {bills.map(result => {
                const bill = result.item as Bill
                return (
                  <BillResult 
                    key={bill.bill_id}
                    bill={bill}
                    onClick={() => handleItemClick(`/${bill.state_abbr.toLowerCase()}/bill/${bill.bill_id}`)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

const BillResult = memo(function BillResult({ bill, onClick }: { bill: Bill, onClick: () => void }) {
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
})

const SponsorResult = memo(function SponsorResult({ sponsor, onClick }: { sponsor: Sponsor, onClick: () => void }) {
  return (
    <div 
      className="flex items-start space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-900 rounded"
      onClick={onClick}
    >
      {sponsor.votesmart_id ? (
        <div className="relative w-9 h-9 rounded overflow-hidden">
          <Image
            src={`https://static.votesmart.org/static/canphoto/${sponsor.votesmart_id}.jpg`}
            alt={sponsor.name}
            fill
            className="object-cover"
            sizes="36px"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/placeholder-headshot.png';
            }}
          />
        </div>
      ) : (
        <div className={`w-9 h-9 rounded ${getAvatarColor(sponsor.people_id)} flex items-center justify-center text-sm font-medium text-white`}>
          {sponsor.first_name[0]}{sponsor.last_name[0]}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {sponsor.state_abbr} • {sponsor.party_name} • {sponsor.body_name}
        </div>
        <div className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {sponsor.name}
        </div>
      </div>
    </div>
  )
}) 