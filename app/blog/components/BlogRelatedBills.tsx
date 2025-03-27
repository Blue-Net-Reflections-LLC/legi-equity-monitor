'use client';

import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { BillLink } from '@/app/components/ui/seo-links';
import { SimplePagination } from '@/app/components/ui/simple-pagination';
import { Bill as BaseBill } from '@/app/types';

interface RelatedBill extends BaseBill {
  overall_bias_score: number | null;
  overall_positive_impact_score: number | null;
  membership_confidence: number;
}

interface BlogRelatedBillsProps {
  bills: RelatedBill[];
}

function getImpactType(positiveScore: number, biasScore: number): 'POSITIVE' | 'BIAS' | 'NEUTRAL' {
  if (positiveScore >= 0.6) return 'POSITIVE';
  if (biasScore >= 0.6) return 'BIAS';
  return 'NEUTRAL';
}

export function BlogRelatedBills({ bills }: BlogRelatedBillsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  // Don't render anything if there are no bills
  if (bills.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(bills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBills = bills.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to the top of the section with smooth behavior
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={sectionRef} className="mt-8 border-t border-zinc-200 dark:border-zinc-700 pt-8">
      <h2 className="text-xl font-semibold mb-6">Related Bills</h2>
      <div className="space-y-4">
        {currentBills.map((bill) => {
          const positiveScore = bill.overall_positive_impact_score || 0;
          const biasScore = bill.overall_bias_score || 0;
          const type = getImpactType(positiveScore, biasScore);
          const score = type === 'POSITIVE' ? positiveScore : type === 'BIAS' ? biasScore : Math.max(positiveScore, biasScore);
          const percentage = Math.round(score * 100);

          return (
            <BillLink
              key={bill.bill_id}
              stateCode={bill.state_abbr}
              billId={bill.bill_id.toString()}
              billNumber={bill.bill_number}
              title={bill.title}
              className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all relative"
            >
              {/* Top right badges */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {(bill.overall_bias_score !== null || bill.overall_positive_impact_score !== null) && (
                  <span className={`text-lg font-medium ${
                    type === 'POSITIVE' ? 'text-emerald-500 dark:text-emerald-400' :
                    type === 'BIAS' ? 'text-red-500 dark:text-red-400' :
                    'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {type === 'NEUTRAL' ? 'Neutral' : `${percentage}% ${type === 'BIAS' ? 'Bias' : 'Positive'}`}
                  </span>
                )}
              </div>

              <div className="pr-24"> {/* Add right padding to prevent text overlap with badges */}
                {/* Bill identifier */}
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  <span>{bill.state_abbr} {bill.bill_number}</span>
                  <span>•</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    {bill.status_desc}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-medium text-zinc-900 dark:text-white mb-1">
                  {bill.title}
                </h3>

                {/* Date */}
                {bill.latest_action_date && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {format(new Date(bill.latest_action_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </BillLink>
          );
        })}

        {totalPages > 1 && (
          <div className="mt-8">
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
} 