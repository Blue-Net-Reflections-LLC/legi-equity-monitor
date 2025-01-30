'use client'

import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react'
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Bill, Sponsor } from '@/app/types'
import { SearchResults } from './SearchResults'

export interface SearchResult {
  type: 'bill' | 'sponsor'
  similarity: number
  item: Bill | Sponsor
}

// Mock data for testing UI
const MOCK_RESULTS: SearchResult[] = [
  {
    type: 'bill',
    similarity: 0.95,
    item: {
      bill_id: 1,
      bill_number: "HB 1234",
      title: "Education Equity Act",
      description: "A bill to ensure equal access to educational resources across all communities.",
      state_abbr: "CA",
      state_name: "California",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.89,
    item: {
      people_id: 1,
      name: "Sarah Johnson",
      first_name: "Sarah",
      last_name: "Johnson",
      middle_name: null,
      suffix: null,
      nickname: null,
      state_abbr: "CA",
      state_name: "California",
      party_name: "Democratic",
      party_id: 1,
      role_id: 2,
      photo_url: "https://static.votesmart.org/canphoto/180828.jpg",
      url: null,
      contact_form: null,
      rss_url: null,
      twitter_account: null,
      facebook_account: null,
      youtube_account: null
    } as any
  },
  {
    type: 'bill',
    similarity: 0.87,
    item: {
      bill_id: 2,
      bill_number: "SB 5678",
      title: "Healthcare Access Improvement",
      description: "Comprehensive legislation to expand healthcare access.",
      state_abbr: "NY",
      state_name: "New York",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.85,
    item: {
      people_id: 2,
      name: "Michael Chen",
      first_name: "Michael",
      last_name: "Chen",
      middle_name: null,
      suffix: null,
      nickname: null,
      state_abbr: "NY",
      state_name: "New York",
      party_name: "Republican",
      party_id: 2,
      role_id: 1,
      photo_url: "https://static.votesmart.org/canphoto/181072.jpg",
      url: null,
      contact_form: null,
      rss_url: null,
      twitter_account: null,
      facebook_account: null,
      youtube_account: null
    } as any
  },
  {
    type: 'bill',
    similarity: 0.84,
    item: {
      bill_id: 3,
      bill_number: "HB 789",
      title: "Clean Energy Innovation Act",
      description: "Promoting renewable energy development.",
      state_abbr: "WA",
      state_name: "Washington",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.82,
    item: {
      people_id: 3,
      name: "Emily Rodriguez",
      first_name: "Emily",
      last_name: "Rodriguez",
      state_abbr: "TX",
      state_name: "Texas",
      party_name: "Democratic",
      role_id: 2,
      photo_url: null,
    } as any
  },
  {
    type: 'bill',
    similarity: 0.81,
    item: {
      bill_id: 4,
      bill_number: "SB 901",
      title: "Mental Health Services Expansion",
      description: "Expanding access to mental health services.",
      state_abbr: "FL",
      state_name: "Florida",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.80,
    item: {
      people_id: 4,
      name: "James Wilson",
      first_name: "James",
      last_name: "Wilson",
      middle_name: null,
      suffix: null,
      nickname: null,
      state_abbr: "OH",
      state_name: "Ohio",
      party_name: "Republican",
      party_id: 2,
      role_id: 1,
      photo_url: null,
      url: null,
      contact_form: null,
      rss_url: null,
      twitter_account: null,
      facebook_account: null,
      youtube_account: null
    } as any
  },
  {
    type: 'bill',
    similarity: 0.79,
    item: {
      bill_id: 5,
      bill_number: "HB 456",
      title: "Small Business Support Act",
      description: "Supporting local business growth.",
      state_abbr: "MA",
      state_name: "Massachusetts",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.78,
    item: {
      people_id: 5,
      name: "Lisa Thompson",
      first_name: "Lisa",
      last_name: "Thompson",
      state_abbr: "IL",
      state_name: "Illinois",
      party_name: "Democratic",
      role_id: 2,
      photo_url: null,
    } as any
  },
  {
    type: 'bill',
    similarity: 0.77,
    item: {
      bill_id: 6,
      bill_number: "SB 234",
      title: "Infrastructure Modernization Plan",
      description: "Upgrading state infrastructure.",
      state_abbr: "MI",
      state_name: "Michigan",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.76,
    item: {
      people_id: 6,
      name: "Robert Kim",
      first_name: "Robert",
      last_name: "Kim",
      state_abbr: "VA",
      state_name: "Virginia",
      party_name: "Republican",
      role_id: 1,
      photo_url: null,
    } as any
  },
  {
    type: 'bill',
    similarity: 0.75,
    item: {
      bill_id: 7,
      bill_number: "HB 567",
      title: "Public Transportation Enhancement",
      description: "Improving public transit systems.",
      state_abbr: "OR",
      state_name: "Oregon",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.74,
    item: {
      people_id: 7,
      name: "Maria Garcia",
      first_name: "Maria",
      last_name: "Garcia",
      state_abbr: "AZ",
      state_name: "Arizona",
      party_name: "Democratic",
      role_id: 2,
      photo_url: null,
    } as any
  },
  {
    type: 'bill',
    similarity: 0.73,
    item: {
      bill_id: 8,
      bill_number: "SB 789",
      title: "Environmental Protection Act",
      description: "Strengthening environmental regulations.",
      state_abbr: "CO",
      state_name: "Colorado",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.72,
    item: {
      people_id: 8,
      name: "David Lee",
      first_name: "David",
      last_name: "Lee",
      state_abbr: "NJ",
      state_name: "New Jersey",
      party_name: "Republican",
      role_id: 1,
      photo_url: null,
    } as any
  },
  {
    type: 'bill',
    similarity: 0.71,
    item: {
      bill_id: 9,
      bill_number: "HB 890",
      title: "Digital Privacy Protection Act",
      description: "Enhancing data privacy regulations.",
      state_abbr: "MN",
      state_name: "Minnesota",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.70,
    item: {
      people_id: 9,
      name: "Rachel Martinez",
      first_name: "Rachel",
      last_name: "Martinez",
      state_abbr: "WI",
      state_name: "Wisconsin",
      party_name: "Democratic",
      role_id: 2,
      photo_url: null,
    } as any
  },
  {
    type: 'bill',
    similarity: 0.69,
    item: {
      bill_id: 10,
      bill_number: "SB 123",
      title: "Affordable Housing Initiative",
      description: "Expanding affordable housing access.",
      state_abbr: "PA",
      state_name: "Pennsylvania",
    } as Bill
  },
  {
    type: 'sponsor',
    similarity: 0.68,
    item: {
      people_id: 10,
      name: "Thomas Brown",
      first_name: "Thomas",
      last_name: "Brown",
      state_abbr: "NC",
      state_name: "North Carolina",
      party_name: "Republican",
      role_id: 1,
      photo_url: null,
    } as any
  }
]

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // If empty query, show all results
      if (!searchQuery.trim()) {
        setResults(MOCK_RESULTS)
        return
      }
      
      // Filter mock results based on search query
      const filteredResults = MOCK_RESULTS.filter(result => {
        const searchLower = searchQuery.toLowerCase()
        if (result.type === 'bill') {
          const bill = result.item as Bill
          return (
            bill.bill_number.toLowerCase().includes(searchLower) ||
            bill.title.toLowerCase().includes(searchLower) ||
            bill.description.toLowerCase().includes(searchLower) ||
            bill.state_name.toLowerCase().includes(searchLower)
          )
        } else {
          const sponsor = result.item as Sponsor
          return (
            sponsor.name.toLowerCase().includes(searchLower) ||
            sponsor.state_name.toLowerCase().includes(searchLower)
          )
        }
      })
      
      setResults(filteredResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize with all results
  useEffect(() => {
    handleSearch('')
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
          <Search className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px] h-[80vh] flex flex-col bg-zinc-950 p-0 gap-0 border-zinc-800" 
        showCloseButton={false}
      >
        <div className="flex-1 min-h-0 flex flex-col p-3">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="search"
                placeholder="Search bills and sponsors..."
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleSearch(query)
                  }
                }}
                className="w-full pl-9 bg-zinc-900 border-0 focus-visible:ring-0 text-zinc-100"
                autoFocus
              />
            </div>
            <kbd className="hidden sm:block text-sm font-mono text-zinc-500 bg-zinc-900 px-3 flex content-center h-10 rounded">
              ESC
            </kbd>
          </div>
          <div className="flex-1 min-h-0 mt-2">
            <SearchResults 
              results={results} 
              isLoading={isLoading}
              onItemClick={() => setOpen(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 