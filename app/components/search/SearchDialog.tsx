'use client'

import { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from 'react'
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Bill, Sponsor } from '@/app/types'
import { SearchResults } from './SearchResults'
import { embeddingService } from '@/app/services/embedding.service'

export interface SearchResult {
  type: 'bill' | 'sponsor'
  similarity: number
  item: Bill | Sponsor
}

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true)

    try {
      // Generate embedding for the search query
      const embedding = await embeddingService.generateEmbedding(searchQuery)

      // Call search API with keyword and embedding
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: searchQuery,
          embedding,
        }),
      })

      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data = await response.json()
      console.log(data)
      setResults(data.results)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search handler
  const debouncedSearch = (searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300) // 300ms debounce delay
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          <Search className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[600px] h-[80vh] flex flex-col bg-white dark:bg-zinc-950 p-0 gap-0 border-zinc-200 dark:border-zinc-800" 
        showCloseButton={false}
      >
        <div className="flex-1 min-h-0 flex flex-col p-3">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-400" />
              <Input
                type="search"
                placeholder="Search bills and sponsors..."
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setQuery(e.target.value)
                  debouncedSearch(e.target.value)
                }}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current)
                    }
                    handleSearch(query)
                  }
                }}
                className="w-full pl-9 bg-zinc-100/80 dark:bg-zinc-900 border-0 focus-visible:ring-0 text-zinc-900 dark:text-zinc-100"
                autoFocus
              />
            </div>
            <kbd className="hidden sm:block text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 flex content-center h-10 rounded">
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