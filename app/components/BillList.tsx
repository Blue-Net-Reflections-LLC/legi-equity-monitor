'use client';

import Link from 'next/link';
import { Bill } from '@/app/types';

export default function BillList({ bills }: { bills: Bill[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {bills.map((bill) => (
        <Link 
          key={bill.bill_id} 
          href={`/${bill.state_abbr.toLowerCase()}/bill/${bill.bill_id}`}
          className="block"
        >
          <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  {bill.bill_number}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {bill.title}
                </div>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {bill.status_desc}
              </div>
            </div>
            <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              {bill.pending_committee_name || bill.status_desc}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

