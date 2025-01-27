'use client';

import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  className?: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function Pagination({ currentPage, totalItems, pageSize, className = '', searchParams = {} }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const onPageChange = (page: number) => {
    const params = new URLSearchParams();
    // Preserve all existing search params except page
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'page' && typeof value === 'string') {
        params.set(key, value);
      }
    });
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (currentPage > 3) {
      pages.push(
        <Button 
          key={1} 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(1)}
          className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          1
        </Button>,
        <span key="leftEllipsis" className="px-2 text-zinc-600 dark:text-zinc-400">...</span>
      );
    }
    
    // Show 3 pages around current page
    for (let i = Math.max(1, currentPage - 1); 
         i <= Math.min(totalPages, currentPage + 1); 
         i++) {
      pages.push(
        <Button
          key={i}
          size="sm"
          variant={currentPage === i ? "default" : "outline"}
          onClick={() => onPageChange(i)}
          disabled={currentPage === i}
          className={currentPage === i 
            ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            : "text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }
        >
          {i}
        </Button>
      );
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      pages.push(
        <span key="rightEllipsis" className="px-2 text-zinc-600 dark:text-zinc-400">...</span>,
        <Button 
          key={totalPages} 
          variant="outline" 
          size="sm" 
          onClick={() => onPageChange(totalPages)}
          className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {totalPages}
        </Button>
      );
    }
    
    return pages;
  };

  return (
    <nav className={`flex justify-center items-center gap-1pb-6 pb-6 pt-2   ${className}`}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        Prev
      </Button>
      {renderPageNumbers()}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
      >
        Next
      </Button>
    </nav>
  );
}

