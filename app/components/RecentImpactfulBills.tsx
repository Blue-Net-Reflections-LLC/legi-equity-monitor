'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { BillLink } from '@/app/components/ui/seo-links';

interface Bill {
  bill_id: number;
  state_abbr: string;
  state_name: string;
  bill_number: string;
  title: string;
  latest_action_date: string;
  overall_bias_score: number;
  overall_positive_impact_score: number;
  status_id: number;
}

const STATUS_BADGES: Record<number, { label: string, class: string }> = {
  1: { label: 'Introduced', class: 'bg-blue-500/10 text-blue-500 dark:text-blue-400' },
  2: { label: 'Engrossed', class: 'bg-purple-500/10 text-purple-500 dark:text-purple-400' },
  3: { label: 'Enrolled', class: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' },
  4: { label: 'Passed', class: 'bg-orange-500/10 text-orange-500 dark:text-orange-400' }
};

export default function RecentImpactfulBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentBills() {
      try {
        const response = await fetch('/api/bills/recent-impactful');
        if (!response.ok) throw new Error('Failed to fetch bills');
        const data = await response.json();
        setBills(data);
      } catch (error) {
        console.error('Error fetching recent bills:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentBills();
  }, []);

  const scrollLeft = () => {
    const container = document.getElementById('bills-container');
    if (container) {
      container.scrollBy({ left: -900, behavior: 'smooth' }); // Width of 3 cards (300px * 3)
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('bills-container');
    if (container) {
      container.scrollBy({ left: 900, behavior: 'smooth' }); // Width of 3 cards (300px * 3)
    }
  };

  // Calculate impact score (same logic as bill detail page)
  const calculateImpact = (biasScore: number, positiveScore: number) => {
    const score = positiveScore >= biasScore ? positiveScore : biasScore;
    const type = positiveScore >= biasScore ? 'positive' : 'bias';
    const percentage = Math.round(score * 100);

    let colorClass = '';
    if (type === 'positive') {
      colorClass = percentage >= 70 ? 'text-emerald-500 dark:text-emerald-400' :
                  percentage >= 40 ? 'text-yellow-500 dark:text-yellow-400' :
                  'text-zinc-500 dark:text-zinc-400';
    } else {
      colorClass = percentage >= 70 ? 'text-red-500 dark:text-red-400' :
                  percentage >= 40 ? 'text-yellow-500 dark:text-yellow-400' :
                  'text-zinc-500 dark:text-zinc-400';
    }

    return {
      score: percentage,
      type,
      colorClass
    };
  };

  if (loading) {
    return (
      <section className="relative py-12 px-4 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  // Don't render the section if there are no bills
  if (bills.length === 0) {
    return null;
  }

  return (
    <section className="relative py-12 px-4 bg-white dark:bg-zinc-900">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="inline-flex items-center gap-2 rounded bg-emerald-500/10 px-6 py-3 text-lg font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide">
            <Scale className="w-5 h-5" />
            Recent High-Impact Bills
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        <div
          id="bills-container"
          className="grid grid-flow-col sm:auto-cols-[calc(100%-1rem)] md:auto-cols-[calc(50%-0.75rem)] lg:auto-cols-[calc(33.333%-1rem)] overflow-x-auto gap-6 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]{display:none} [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {bills.map((bill) => {
            const impact = calculateImpact(bill.overall_bias_score, bill.overall_positive_impact_score);
            const status = STATUS_BADGES[bill.status_id];
            
            return (
              <BillLink
                key={bill.bill_id}
                stateCode={bill.state_abbr.toLowerCase()}
                billId={bill.bill_id.toString()}
                billNumber={bill.bill_number}
                title={bill.title}
                className="snap-start group"
              >
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 h-full border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                  <div className="flex gap-4">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {bill.state_abbr === 'US' ? (
                        <Image
                          src="/images/Seal_of_the_United_States_Congress.svg"
                          alt="US Congress"
                          fill
                          className="object-contain"
                        />
                      ) : bill.state_abbr === 'DC' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                            DC
                          </span>
                        </div>
                      ) : (
                        <Image
                          src={`/images/states/${bill.state_abbr.toLowerCase()}.svg`}
                          alt={bill.state_abbr}
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            {bill.bill_number}
                          </span>
                          {status && (
                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${status.class}`}>
                              {status.label}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${impact.colorClass}`}>
                          {impact.score}% {impact.type === 'positive' ? 'Positive' : 'Bias'}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                        {bill.state_name}
                      </div>
                      <h3 
                        className="text-base font-medium text-zinc-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors line-clamp-2"
                        title={bill.title}
                      >
                        {bill.title}
                      </h3>
                      <time className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        {format(new Date(bill.latest_action_date), 'MMM d, yyyy')}
                      </time>
                    </div>
                  </div>
                </div>
              </BillLink>
            );
          })}
        </div>
      </div>
    </section>
  );
} 