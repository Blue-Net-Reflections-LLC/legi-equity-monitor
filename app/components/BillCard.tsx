import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardHeader, CardContent } from "@/app/components/ui/card"
import { DemographicImpact } from "@/app/components/DemographicImpact"
import { Building2, Users, Flag } from "lucide-react"
import { Bill } from "@/app/types"

interface BillCardProps {
  bill: Bill
}

export function BillCard({ bill }: BillCardProps) {
  const pathname = usePathname();
  const stateCode = pathname.split('/').filter(Boolean)[0];

  // TODO: Get these from analysis results
  const impactScores = {
    overall: 80,
    race: 75,
    age: 85,
    income: 80,
    disability: 95
  };

  const getImpactColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getPartyDisplay = (sponsors: any[]) => {
    if (!sponsors?.length) return 'Unknown';
    debugger
    // Get ONLY primary sponsors
    const primarySponsors = sponsors.filter(s => s.type === 'Primary');
    
    // If no primary sponsors found
    if (!primarySponsors.length) return 'Unknown';

    // Count sponsors by party
    const partyCount = primarySponsors.reduce((acc, sponsor) => {
      acc[sponsor.party] = (acc[sponsor.party] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueParties = Object.keys(partyCount);

    // If primary sponsors are from different parties
    if (uniqueParties.length > 1) {
      return `${uniqueParties.length}-Party`;  // e.g., "2-Party" or "3-Party"
    }

    // If all primary sponsors are from the same party
    if (uniqueParties.length === 1) {
      return uniqueParties[0];
    }

    return 'Non-partisan';
  };

  return (
    <Link 
      href={`/${stateCode}/bill/${bill.bill_id}`}
      className="block transition-all hover:scale-[1.02]"
    >
      <Card className="w-full transition-shadow hover:shadow-lg">
        <CardHeader className="p-6">
          {/* Top Row: Bill Number, Status, Impact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{bill.bill_number}</span>
              <span className="text-sm px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                {bill.status_desc}
              </span>
            </div>
            <span className={`${getImpactColor(impactScores.overall)}`}>
              {impactScores.overall}% Impact
            </span>
          </div>

          {/* Title with tooltip */}
          <h2 
            className="text-xl font-semibold mt-4 line-clamp-1" 
            title={bill.title}
          >
            {bill.title}
          </h2>

          {/* Description with truncation */}
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
            {bill.description}
          </p>

          {/* Bill Type & Sponsors */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">{bill.bill_type_name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">{bill.sponsors?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flag className="w-4 h-4" />
                <span className="text-sm">
                  {getPartyDisplay(bill.sponsors)}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div className="flex flex-wrap gap-6">
            <DemographicImpact category="Race" score={impactScores.race} />
            <DemographicImpact category="Age" score={impactScores.age} />
            <DemographicImpact category="Income" score={impactScores.income} />
            <DemographicImpact category="Disability" score={impactScores.disability} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 