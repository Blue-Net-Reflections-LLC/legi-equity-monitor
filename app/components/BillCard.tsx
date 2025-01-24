import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardHeader, CardContent } from "@/app/components/ui/card"
import { DemographicImpact } from "@/app/components/DemographicImpact"
import { Building2, Users, Flag, AlertTriangle, CheckCircle, MinusCircle } from "lucide-react"
import { Bill } from "@/app/types"

interface BillCardProps {
  bill: Bill
}

const CATEGORY_ORDER = [
  'race',
  'religion',
  'age',
  'disability',
  'gender',
  'income',
  'education',
  'language',
  'nationality'
];

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

  const getPartyDisplay = (sponsors: Array<{ people_id: number; party: string; type: string }> | undefined) => {
    if (!sponsors?.length) return 'Not Available';
    
    // Get ONLY primary sponsors
    const primarySponsors = sponsors.filter(s => s.type === 'Primary');
    
    // If no primary sponsors found
    if (!primarySponsors.length) return 'Not Available';

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

  const getImpactDisplay = (analysis: { overall_score: number, overall_sentiment: string, bias_detected: boolean }) => {
    if (!analysis) return { 
      color: "text-neutral-500", 
      label: "Pending Analysis",
      Icon: MinusCircle
    };
    
    // Get the higher score between positive impact and bias
    const positiveScore = analysis.overall_sentiment === 'POSITIVE' ? analysis.overall_score : 0;
    const biasScore = analysis.bias_detected ? analysis.overall_score : 0;
    
    // High positive impact (green)
    if (positiveScore >= 60) {
      return { 
        color: "text-emerald-500", 
        label: "Positive Impact",
        Icon: CheckCircle,
        score: positiveScore
      };
    }
    
    // High bias (red)
    if (biasScore >= 60) {
      return { 
        color: "text-red-500", 
        label: "High Bias",
        Icon: AlertTriangle,
        score: biasScore
      };
    }
    
    // Neutral - show the higher of the two scores
    return { 
      color: "text-neutral-500", 
      label: "Neutral Impact",
      Icon: MinusCircle,
      score: Math.max(positiveScore, biasScore)
    };
  };

  return (
    <Link 
      href={`/${stateCode}/bill/${bill.bill_id}`}
      className="block transition-all hover:scale-[1.02]"
    >
      <Card className="w-full h-full transition-shadow hover:shadow-lg flex flex-col">
        <CardHeader className="p-6 flex-1">
          {/* Top Row: Bill Number, Status, Impact */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{bill.bill_number}</span>
              <span className="text-sm px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                {bill.status_desc}
              </span>
            </div>
            {bill.analysis_results ? (
              <span className={`flex items-center gap-1 ${getImpactDisplay(bill.analysis_results).color}`}>
                {(() => {
                  const { Icon } = getImpactDisplay(bill.analysis_results);
                  return <Icon className="w-4 h-4" />;
                })()}
                {getImpactDisplay(bill.analysis_results).score >= 60 
                  ? `${bill.analysis_results.overall_score}% ${getImpactDisplay(bill.analysis_results).label}`
                  : 'Neutral'}
              </span>
            ) : null}
          </div>

          {/* Title with tooltip */}
          <h2 
            className="text-xl font-semibold mt-4 line-clamp-1 min-h-[2rem]"
            title={bill.title}
          >
            {bill.title}
          </h2>

          {/* Description with truncation */}
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
            {bill.description}
          </p>

          {/* Committee info */}
          {bill.pending_committee_name && (
            <div className="flex items-center gap-2 mt-4 text-neutral-600 dark:text-neutral-400">
              <Building2 className="w-4 h-4" />
              <span className="text-sm line-clamp-1" title={bill.pending_committee_name}>
                {bill.pending_committee_name}
              </span>
            </div>
          )}

          {/* Sponsors Info and Date */}
          <div className="flex items-center justify-between mt-4">
            {/* Date with label */}
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {bill.updated && (
                <>
                  {new Date(bill.created).getTime() === new Date(bill.updated).getTime() ? 'Created' : 'Updated'}: {' '}
                  {new Date(bill.updated).toLocaleDateString()}
                </>
              )}
            </div>
            
            {/* Sponsors and Party */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  {!bill.sponsors ? 'No Sponsors' : 
                   bill.sponsors.length === 0 ? 'No Sponsors' : 
                   `${bill.sponsors.length} ${bill.sponsors.length === 1 ? 'Sponsor' : 'Sponsors'}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Flag className="w-4 h-4" />
                <span className="text-sm">{getPartyDisplay(bill.sponsors)}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          {/* Impact bars in a single row with fixed spacing */}
          <div className="flex items-start space-x-4">
            {bill.analysis_results?.categories && 
              Object.entries(bill.analysis_results.categories)
                .sort(([a], [b]) => {
                  const aIndex = CATEGORY_ORDER.indexOf(a);
                  const bIndex = CATEGORY_ORDER.indexOf(b);
                  return aIndex - bIndex;
                })
                .map(([category, data]) => (
                  <div key={category} className="flex-1">
                    <DemographicImpact 
                      category={category}
                      score={data.score}
                      sentiment={data.sentiment}
                    />
                  </div>
                ))
            }
          </div>
        </CardContent>
      </Card>
    </Link>
  )
} 