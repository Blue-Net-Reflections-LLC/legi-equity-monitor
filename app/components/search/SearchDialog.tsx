'use client'

import { useState, useEffect, ChangeEvent, KeyboardEvent, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Bill, Sponsor } from '@/app/types'
import { SearchResults } from './SearchResults'
import { embeddingService } from '@/app/services/embedding.service'
import { debounce } from 'lodash'
import { useRouter } from 'next/navigation'

export interface SearchResult {
  type: 'bill' | 'sponsor'
  similarity: number
  item: Bill | Sponsor
  href?: string
}

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController>()
  const previousQueryRef = useRef<string | null>(null)
  const router = useRouter()

  const handleSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery === previousQueryRef.current) {
        return
      }
      setIsLoading(true)


      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = undefined
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

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
          signal,
        })

        if (!response.ok) {
          throw new Error('Search request failed')
        }

        const data = await response.json()
        if (!signal.aborted) {
          setResults(data.results)
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search failed:', error)
          setResults([])
        }
      } finally {
        previousQueryRef.current = searchQuery
        if (!abortControllerRef.current?.signal.aborted) {
          setIsLoading(false)
        }
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          abortControllerRef.current = undefined
        }
      }
    }, 300),
    [setResults, setIsLoading]
  )

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    handleSearch(e.target.value)
  }, [handleSearch])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch.cancel()
      handleSearch(query)
    }
  }, [query, handleSearch])

  const onSelect = useCallback((item: SearchResult) => {
    setOpen(false);
    router.push(item.href || '');
  }, [router, setOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      handleSearch.cancel()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [handleSearch])

  useEffect(() => {
    if (open && query === '' && previousQueryRef.current !== query) {
      handleSearch('')
    }
  }, [open, query, handleSearch])

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger asChild>
        <button 
          className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          data-track-click
          data-track-event-category="Navigation"
          data-track-event-action="search_open"
          data-track-event-label="Global Search"
        >
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
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
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
              onItemClick={onSelect}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 