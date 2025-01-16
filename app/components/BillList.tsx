'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bill, BillWithImpacts, ImpactLevel } from '@/app/types'
import { Card, CardHeader, CardContent, CardFooter } from '@/app/components/ui/card'
import ImpactBadge from '@/app/components/ImpactBadge'

const RACE_CODES = {
  AI: 'American Indian/Alaska Native',
  AP: 'Asian/Pacific Islander',
  BH: 'Black/African American',
  WH: 'White'
} as const;

export default function BillList({ bills }: { bills: BillWithImpacts[] }) {
  const pathname = usePathname();
  const stateCode = pathname.split('/').filter(Boolean)[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <p className="text-sm text-gray-600 line-clamp-3">
                  {bill.description}
                </p>
              </div>
              
              {/* Impact Badges */}
              {bill.racial_impacts && (
                <div className="w-32 flex flex-col gap-2">
                  {Object.entries(RACE_CODES).map(([code, name]) => {
                    const impact = bill.racial_impacts?.[code];
                    if (!impact) return null;
                    
                    return (
                      <div key={code} className="flex flex-col gap-1">
                        <div className="text-xs font-medium text-gray-500 truncate" title={name}>
                          {name.split('/')[0]}
                        </div>
                        <ImpactBadge 
                          level={impact.severity as ImpactLevel}
                          sentiment={impact.impact_type.toLowerCase() as 'positive' | 'negative'}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-gray-500">
            <div className="w-full">
              <div className="flex justify-between items-center">
                <span>Last Action:</span>
                <span>{bill.last_action_date ? new Date(bill.last_action_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="mt-1 text-gray-600">{bill.last_action}</div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

