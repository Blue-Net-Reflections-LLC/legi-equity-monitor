'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SimplePagination } from '../ui/simple-pagination';

interface Bill {
  bill_id: number;
  bill_number: string;
  title: string;
  state_abbr: string;
  status_desc: string;
  sponsor_type_desc: string;
  overall_bias_score: number | null;
  overall_positive_impact_score: number | null;
  categories: Array<{
    category: string;
    bias_score: number;
    positive_impact_score: number;
  }>;
}

export function SponsoredBillsList({ bills }: { bills: Bill[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const billsContainerRef = useRef<HTMLDivElement>(null);
  const previousPage = useRef(currentPage);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && previousPage.current !== currentPage) {
      if (billsContainerRef.current) {
        const yOffset = -70;
        const y = billsContainerRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      previousPage.current = currentPage;
    }
  }, [currentPage, isClient]);

  const totalPages = Math.ceil(bills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBills = bills.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div ref={billsContainerRef}>
      {isClient ? (
        <>
          <div className="space-y-4">
            {currentBills.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No bills sponsored
              </p>
            ) : (
              <>
                {currentBills.map((bill) => (
                  <Link
                    key={bill.bill_id}
                    href={`/${bill.state_abbr}/bill/${bill.bill_id}`}
                    className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                          <span>{bill.state_abbr} {bill.bill_number}</span>
                          <span>•</span>
                          <span>{bill.status_desc}</span>
                        </div>
                        <h3 className="font-medium text-zinc-900 dark:text-white">
                          {bill.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                          {(bill.overall_bias_score !== null || bill.overall_positive_impact_score !== null) && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              bill.overall_bias_score === bill.overall_positive_impact_score
                                ? 'bg-gray-400 text-white dark:bg-gray-400 dark:text-white'
                                : Math.abs(bill.overall_bias_score || 0) > Math.abs(bill.overall_positive_impact_score || 0)
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {bill.overall_bias_score === bill.overall_positive_impact_score
                                ? 'Neutral'
                                : Math.abs(bill.overall_bias_score || 0) > Math.abs(bill.overall_positive_impact_score || 0)
                                  ? 'Bias'
                                  : 'Positive'
                              }
                            </span>
                          )}
                          {bill.categories?.length > 0 && (
                            <svg 
                              className="w-4 h-4 text-zinc-400 dark:text-zinc-500" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M14 5l7 7-7 7M3 12h18"
                              />
                            </svg>
                          )}
                          {bill.categories?.map((cat) => (
                            <span 
                              key={cat.category}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                cat.bias_score === cat.positive_impact_score
                                  ? 'bg-gray-400 text-white dark:bg-gray-400 dark:text-white'
                                  : Math.abs(cat.bias_score) > Math.abs(cat.positive_impact_score)
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}
                            >
                              {cat.category.split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {bill.sponsor_type_desc}
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-8">
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <Link
              key={bill.bill_id}
              href={`/${bill.state_abbr}/bill/${bill.bill_id}`}
              className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                    <span>{bill.state_abbr} {bill.bill_number}</span>
                    <span>•</span>
                    <span>{bill.status_desc}</span>
                  </div>
                  <h3 className="font-medium text-zinc-900 dark:text-white">
                    {bill.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    {(bill.overall_bias_score !== null || bill.overall_positive_impact_score !== null) && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        bill.overall_bias_score === bill.overall_positive_impact_score
                          ? 'bg-gray-400 text-white dark:bg-gray-400 dark:text-white'
                          : Math.abs(bill.overall_bias_score || 0) > Math.abs(bill.overall_positive_impact_score || 0)
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {bill.overall_bias_score === bill.overall_positive_impact_score
                          ? 'Neutral'
                          : Math.abs(bill.overall_bias_score || 0) > Math.abs(bill.overall_positive_impact_score || 0)
                            ? 'Bias'
                            : 'Positive'
                        }
                      </span>
                    )}
                    {bill.categories?.length > 0 && (
                      <svg 
                        className="w-4 h-4 text-zinc-400 dark:text-zinc-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M14 5l7 7-7 7M3 12h18"
                        />
                      </svg>
                    )}
                    {bill.categories?.map((cat) => (
                      <span 
                        key={cat.category}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          cat.bias_score === cat.positive_impact_score
                            ? 'bg-gray-400 text-white dark:bg-gray-400 dark:text-white'
                            : Math.abs(cat.bias_score) > Math.abs(cat.positive_impact_score)
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {cat.category.split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {bill.sponsor_type_desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 