'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { SearchResult } from './SearchDialog'
import { Bill, Sponsor, BlogPost } from '@/app/types'
import { StateIcon } from './StateIcon'
import { Star as StarIcon } from 'lucide-react'
import { memo } from 'react'
import { Search, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface SearchResultsProps {
  results: SearchResult[]
  onItemClick?: (item: SearchResult) => void
}

export const SearchResults = memo(function SearchResults({ 
  results, 
  onItemClick,
}: SearchResultsProps) {
  const router = useRouter()

  const bills = results.filter(r => r.type === 'bill')
  const sponsors = results.filter(r => r.type === 'sponsor')
  const blogPosts = results.filter(r => r.type === 'blog_post')

  const handleItemClick = (item: SearchResult) => {
    let href: string
    switch (item.type) {
      case 'bill':
        href = `/${(item.item as Bill).state_abbr.toLowerCase()}/bill/${(item.item as Bill).bill_id}`
        break
      case 'sponsor':
        href = `/sponsor/${(item.item as Sponsor).people_id}`
        break
      case 'blog_post':
        href = `/blog/${(item.item as BlogPost).slug}`
        break
      default:
        href = '/unknown'
    }
    if (onItemClick) onItemClick({ ...item, href })
    router.push(href)
  }

  if (!results.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/50 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-zinc-400 to-zinc-500 opacity-10 animate-[ping_3s_ease-in-out_infinite]" />
            <Search className="w-8 h-8 text-zinc-400 dark:text-zinc-500 relative z-10" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No matching results found
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sponsors.length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-white bg-indigo-500/90 dark:bg-indigo-500/50 px-3 py-1 rounded mb-2">
            Sponsors ({sponsors.length})
          </h3>
          <div className="space-y-2">
            {sponsors.map((result, index) => {
              const sponsor = result.item as Sponsor
              return (
                <SponsorResult 
                  key={`sponsor-${sponsor.people_id}-${index}`}
                  sponsor={sponsor}
                  onClick={() => handleItemClick(result)}
                  data-result-index={index}
                />
              )
            })}
          </div>
        </div>
      )}

      {blogPosts.length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-white bg-indigo-500/90 dark:bg-indigo-500/50 px-3 py-1 rounded mb-2">
            Articles ({blogPosts.length})
          </h3>
          <div className="space-y-2">
            {blogPosts.map((result, index) => {
              const offset = sponsors.length
              return (
                <BlogPostResult 
                  key={`blog-${(result.item as BlogPost).post_id}-${index}`}
                  blogPost={result.item as BlogPost}
                  onClick={() => handleItemClick(result)}
                  data-result-index={offset + index}
                />
              )
            })}
          </div>
        </div>
      )}

      {bills.length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-white bg-indigo-500/90 dark:bg-indigo-500/50 px-3 py-1 rounded mb-2">
            Bills ({bills.length})
          </h3>
          <div className="space-y-2">
            {bills.map((result, index) => {
              const offset = sponsors.length + blogPosts.length
              const bill = result.item as Bill
              return (
                <BillResult 
                  key={`bill-${bill.bill_id}-${index}`}
                  bill={bill}
                  onClick={() => handleItemClick(result)}
                  data-result-index={offset + index}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})

interface ResultProps extends React.HTMLAttributes<HTMLAnchorElement> {
  onClick: () => void
}

const BillResult = memo(function BillResult({ bill, onClick, ...props }: { bill: Bill, onClick: () => void } & ResultProps) {
  return (
    <Link 
      {...props}
      href={`/${bill.state_abbr.toLowerCase()}/bill/${bill.bill_id}`}
      className="flex items-start space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-900 rounded block"
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
    </Link>
  )
})

const SponsorResult = memo(function SponsorResult({ 
  sponsor, 
  onClick,
  ...props
}: { 
  sponsor: Sponsor, 
  onClick: () => void 
} & ResultProps) {
  return (
    <Link 
      {...props}
      href={`/sponsor/${sponsor.people_id}`}
      className="flex items-start space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-900 rounded block"
      onClick={onClick}
    >
      {sponsor.votesmart_id ? (
        <div className="relative w-9 h-9" data-sponsor-id={sponsor.people_id}>
          <Image
            src={`https://static.votesmart.org/static/canphoto/${sponsor.votesmart_id}.jpg`}
            alt={sponsor.name}
            fill
            className="object-cover"
            sizes="48px"
            onError={() => {
              const imgContainer = document.querySelector(`[data-sponsor-id="${sponsor.people_id}"]`);
              if (imgContainer) {
                imgContainer.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                    <svg 
                      class="w-8 h-8 text-zinc-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <AvatarPlaceholder />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {sponsor.state_abbr} • {sponsor.party_name} • {sponsor.body_name}
        </div>
        <div className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {sponsor.name}
        </div>
      </div>
    </Link>
  )
})

function AvatarPlaceholder() {
  return (
    <div className="w-9 h-9 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded">
      <svg 
        className="w-6 h-6 text-zinc-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

const BlogPostResult = memo(function BlogPostResult({ 
  blogPost, 
  onClick,
  ...props
}: { 
  blogPost: BlogPost, 
  onClick: () => void 
} & ResultProps) {
  return (
    <Link 
      {...props}
      href={`/blog/${blogPost.slug}`}
      className="flex items-start space-x-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-900 rounded block"
      onClick={onClick}
    >
      <div className="relative w-9 h-9">
        {blogPost.main_image ? (
          <Image
            src={blogPost.main_image}
            alt={blogPost.title}
            fill
            className="object-cover rounded"
            sizes="36px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded">
            <FileText className="w-5 h-5 text-zinc-400" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <span>Article</span>
          {blogPost.published_at && (
            <>
              <span>•</span>
              <time>{format(new Date(blogPost.published_at), 'MMM d, yyyy')}</time>
            </>
          )}
        </div>
        <div className="text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
          {blogPost.title}
        </div>
      </div>
    </Link>
  )
}) 