'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bill } from '@/app/types'
import { Card, CardHeader, CardContent, CardFooter } from '@/app/components/ui/card'
import { BillCard } from "@/app/components/BillCard"

interface BillListProps {
  bills: Bill[]
}

export function BillList({ bills }: BillListProps) {
  const pathname = usePathname();
  const stateCode = pathname.split('/').filter(Boolean)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:mx-0 -mx-6">
      {bills.map((bill) => (
        <BillCard key={bill.bill_id} bill={bill} />
      ))}
    </div>
  );
}

