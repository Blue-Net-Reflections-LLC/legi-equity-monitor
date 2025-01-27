'use client';

import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  className?: string;
  searchParams?: { [key: string]: string | string[] | undefined };
  handlePageChange?: (page: number) => void;
  isLoading?: boolean;
}

export default function Pagination({ currentPage, totalItems, pageSize, className = '', searchParams = {}, handlePageChange, isLoading }: PaginationProps) {
  const pathname = usePathname();

  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    // Preserve all existing search params except page
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && typeof value === 'string') {
        params.set(key, value);
      }
    });
    params.set('page', page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const onPageClick = (page: number) => {
    handlePageChange?.(page);
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (currentPage > 3) {
      pages.push(
        <Link key={1} href={getPageUrl(1)} onClick={() => onPageClick(1)}>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            disabled={isLoading}
          >
            1
          </Button>
        </Link>,
        <span key="leftEllipsis" className="px-2 text-zinc-600 dark:text-zinc-400">...</span>
      );
    }
    
    // Show 3 pages around current page
    for (let i = Math.max(1, currentPage - 1); 
         i <= Math.min(totalPages, currentPage + 1); 
         i++) {
      pages.push(
        <Link key={i} href={getPageUrl(i)} onClick={() => onPageClick(i)}>
          <Button
            size="sm"
            variant={currentPage === i ? "default" : "outline"}
            disabled={currentPage === i || isLoading}
            className={currentPage === i 
              ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              : "text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }
          >
            {i}
          </Button>
        </Link>
      );
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      pages.push(
        <span key="rightEllipsis" className="px-2 text-zinc-600 dark:text-zinc-400">...</span>,
        <Link key={totalPages} href={getPageUrl(totalPages)} onClick={() => onPageClick(totalPages)}>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            disabled={isLoading}
          >
            {totalPages}
          </Button>
        </Link>
      );
    }
    
    return pages;
  };

  return (
    <nav className={`flex justify-center items-center gap-1pb-6 pb-6 pt-2  ${className}`}>
      <Link 
        href={getPageUrl(currentPage - 1)} 
        onClick={() => onPageClick(currentPage - 1)}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1 || isLoading}
          className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          Prev
        </Button>
      </Link>
      {renderPageNumbers()}
      <Link 
        href={getPageUrl(currentPage + 1)}
        onClick={() => onPageClick(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages || isLoading}
          className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          Next
        </Button>
      </Link>
    </nav>
  );
}
