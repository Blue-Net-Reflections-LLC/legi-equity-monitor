'use client';

import { Bill } from '@/app/types'
import { BillCard } from "@/app/components/BillCard"

interface BillListProps {
  bills: Bill[]
}

export function BillList({ bills }: BillListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:mx-0 -mx-6">
      {bills.map((bill) => (
        <BillCard key={bill.bill_id} bill={bill} />
      ))}
    </div>
  );
}

