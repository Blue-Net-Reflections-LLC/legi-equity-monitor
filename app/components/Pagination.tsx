'use client';

import { Button } from "./ui/button";
import { useRouter, usePathname } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  baseUrl: string;
  className?: string;
}

export default function Pagination({ currentPage, totalItems, pageSize, baseUrl, className = '' }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const onPageChange = (page: number) => {
    router.push(`${pathname}?page=${page}`);
  };

  const renderPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (currentPage > 3) {
      pages.push(
        <Button key={1} variant="outline" size="sm" onClick={() => onPageChange(1)}>1</Button>,
        <span key="leftEllipsis" className="px-2">...</span>
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
        >
          {i}
        </Button>
      );
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      pages.push(
        <span key="rightEllipsis" className="px-2">...</span>,
        <Button key={totalPages} variant="outline" size="sm" onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </Button>
      );
    }
    
    return pages;
  };

  return (
    <nav className={`flex justify-center items-center gap-1 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Prev
      </Button>
      {renderPageNumbers()}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </nav>
  );
}

