'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bill } from '@/app/types'
import { Card, CardHeader, CardContent, CardFooter } from '@/app/components/ui/card'

export default function BillList({ bills }: { bills: Bill[] }) {
  const pathname = usePathname();
  const stateCode = pathname.split('/').filter(Boolean)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {bills.map((bill) => (
        <Card key={bill.bill_id}>
          <CardHeader className="pb-2">
            <Link 
              href={`/${stateCode}/bill/${bill.bill_id}`}
              className="text-lg font-semibold hover:text-blue-600 transition-colors"
            >
              {bill.bill_number}
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="font-medium mb-2">
                  <Link 
                    href={`/${stateCode}/bill/${bill.bill_id}`}
                    className="hover:text-blue-600 transition-colors line-clamp-2"
                    title={bill.title}
                  >
                    {bill.title}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                  {bill.description}
                </p>
                
                {/* Bill Type and Status */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {bill.bill_type_name}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {bill.status_desc}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-gray-500 dark:text-gray-400">
            <div className="w-full">
              <div className="flex justify-between items-center">
                <span>Status Date:</span>
                <span>{bill.status_date ? new Date(bill.status_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="mt-1 text-gray-600 dark:text-gray-300">
                {bill.pending_committee_name ? `In Committee: ${bill.pending_committee_name}` : bill.status_desc}
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

