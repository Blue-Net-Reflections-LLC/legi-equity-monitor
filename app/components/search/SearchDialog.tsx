'use client'

import { useState, useEffect, ChangeEvent, KeyboardEvent, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/app/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, Sparkles, Loader2 } from "lucide-react"
import { Bill, Sponsor, BlogPost } from '@/app/types'
import { SearchResults } from './SearchResults'
import { embeddingService } from '@/app/services/embedding.service'
import { debounce } from 'lodash'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/lib/redux/store'
import { getBillPath, getSponsorPath } from '@/app/utils/slugUtils'

export interface SearchResult {
  type: 'bill' | 'sponsor' | 'blog_post'
  similarity: number
  item: Bill | Sponsor | BlogPost
  href?: string
}

const defaultQuery = 'congress'
export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const hasInitialized = useRef(false)
  const abortControllerRef = useRef<AbortController>()
  const previousQueryRef = useRef<string | null>(null)
  const resultsContainerRef = useRef<HTMLDivElement>(null)
  const previousResultsLengthRef = useRef<number>(0)
  const router = useRouter()
  const embeddingStatus = useSelector((state: RootState) => state.embedding)

  const handleSearch = useCallback(
    debounce(async (searchQuery: string, pageNum: number = 1, currentResults: SearchResult[] = []) => {
      if (searchQuery === previousQueryRef.current && pageNum === 1) {
        return
      }
      setIsLoading(true)

      // Store the current results length before loading more
      if (pageNum > 1) {
        previousResultsLengthRef.current = currentResults.length
      }

      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = undefined
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      try {
        // Use the service without worrying about initialization
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
            page: pageNum
          }),
          signal,
        })

        if (!response.ok) {
          throw new Error('Search request failed')
        }

        const data = await response.json()
        if (!signal.aborted) {
          // Always set results directly for page 1 or new queries
          if (pageNum === 1 || previousQueryRef.current !== searchQuery) {
            setResults(data.results)
            // Force scroll to top for new searches with smooth behavior
            if (resultsContainerRef.current) {
              resultsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
            }
          } else {
            // Only append for subsequent pages of the same query
            setResults(prev => [...prev, ...data.results])
          }
          setHasMore(data.has_more)
          setPage(data.page)
          hasInitialized.current = true

          // Scroll to new results if this was a "load more" action
          if (pageNum > 1 && resultsContainerRef.current) {
            const container = resultsContainerRef.current
            // Wait for DOM to update
            setTimeout(() => {
              const resultElements = container.querySelectorAll('[data-result-index]')
              // Find the first element of the new results
              const firstNewResult = Array.from(resultElements).find(
                el => parseInt(el.getAttribute('data-result-index') || '') === previousResultsLengthRef.current
              )

              if (firstNewResult) {
                firstNewResult.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 100)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search failed:', error)
          setResults([])
          setHasMore(false)
        }
      } finally {
        if (pageNum === 1) {
          previousQueryRef.current = searchQuery
        }
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

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      handleSearch(query || defaultQuery, page + 1, results)
    }
  }, [query, page, isLoading, hasMore, handleSearch, results])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setPage(1)
    handleSearch(e.target.value, 1, [])
  }, [handleSearch])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch.cancel()
      handleSearch(query, 1, [])
    }
  }, [query, handleSearch])

  const handleItemClick = (item: SearchResult) => {
    let href: string
    switch (item.type) {
      case 'bill':
        const bill = item.item as Bill;
        href = getBillPath(
          bill.state_abbr.toLowerCase(),
          bill.bill_id.toString(),
          bill.bill_number,
          bill.title
        );
        break;
      case 'sponsor':
        const sponsor = item.item as Sponsor;
        href = getSponsorPath(
          sponsor.people_id.toString(),
          sponsor.name
        );
        break;
      case 'blog_post':
        href = `/blog/${(item.item as BlogPost).slug}`
        break;
      default:
        href = '/unknown'
    }
    // Close the dialog
    setOpen(false)
    // Navigate to the URL
    router.push(href)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (handleSearch.cancel) {
        handleSearch.cancel();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [handleSearch]);

  useEffect(() => {
    if (open && query === '' && previousQueryRef.current !== query) {
      // Don't initialize here, just start the search
      handleSearch(defaultQuery, 1, [])
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
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for bills, sponsors, and articles across the platform
        </DialogDescription>
        {embeddingStatus.status !== 'ready' ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 animate-spin" />
                <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse relative z-10" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {embeddingStatus.message || 'AI Driven Search is initializing'}
              </p>
              {embeddingStatus.error && (
                <p className="text-sm text-red-500">
                  Error: {embeddingStatus.error}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 p-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-400" />
                <Input
                  type="search"
                  placeholder="Search bills, sponsors, and articles..."
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 bg-zinc-100/80 dark:bg-zinc-900 border-0 focus-visible:ring-0 text-zinc-900 dark:text-zinc-100"
                  autoFocus
                />
              </div>
              <kbd 
                className="hidden sm:block text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 flex content-center h-10 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setOpen(false)}
              >
                ESC
              </kbd>
            </div>
            <div ref={resultsContainerRef} className="flex-1 min-h-0 overflow-auto px-3 
              [&::-webkit-scrollbar]:w-2 
              [&::-webkit-scrollbar-thumb]:rounded-full 
              [&::-webkit-scrollbar-thumb]:bg-zinc-300
              dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
              [&::-webkit-scrollbar-track]:bg-transparent"
            >
              <SearchResults 
                results={results} 
                onItemClick={handleItemClick}
              />
              {hasMore && (
                <div className="mt-4 text-center pb-2">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-orange-500"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      'Show More'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 