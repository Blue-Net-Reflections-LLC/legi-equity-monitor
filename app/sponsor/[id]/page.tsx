import db from "@/lib/db";
import { notFound } from "next/navigation";
import { Card } from "@/app/components/ui/card";
import { AuroraBackground } from "@/app/components/ui/aurora-background";
import BackButton from '@/app/[state]/bill/[id]/BackButton';
import Link from 'next/link';
import Image from 'next/image';
import { OverallChart, CategoryChart } from '@/app/components/analytics/SponsorCharts';
import { SubgroupBarChart } from '@/app/components/analytics/SubgroupBarChart';
import { VotingHistory } from '@/app/components/sponsor/VotingHistory';
import { Footer } from "@/app/components/layout/Footer";

interface SubgroupScore {
  subgroup_code: string;
  bias_score: number;
  positive_impact_score: number;
  evidence: string;
}

interface Sponsor {
  people_id: number;
  name: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  nickname: string | null;
  party_name: string;
  role_name: string;
  state_abbr: string;
  state_name: string;
  district: string;
  ballotpedia: string | null;
  votesmart_id: string | null;
  opensecrets_id: string | null;
}

interface CategoryScore {
  category: string;
  bias_score: number;
  positive_impact_score: number;
  subgroups: SubgroupScore[];
}

interface SponsoredBill {
  bill_id: number;
  bill_number: string;
  title: string;
  state_abbr: string;
  status_desc: string;
  sponsor_type_desc: string;
  latest_history_date: Date | null;
  overall_bias_score: number | null;
  overall_positive_impact_score: number | null;
  confidence: string | null;
  categories: CategoryScore[];
}

interface SponsorAnalytics {
  overallCounts: {
    name: string;
    positive: number;
    bias: number;
    neutral: number;
  }[];
  categoryBreakdown: {
    name: string;
    positive: number;
    bias: number;
    neutral: number;
  }[];
}

interface CategoryData {
  category: string;
  bills: {
    bill_id: number;
    bill_number: string;
    subgroups: SubgroupScore[];
  }[];
}

interface VoteCount {
  vote: string;
  count: number;
}

function aggregateAnalytics(bills: SponsoredBill[]): SponsorAnalytics {
  const overallCounts = {
    positive: 0,
    bias: 0,
    neutral: 0
  };

  const categoryMap = new Map<string, { positive: number; bias: number; neutral: number }>();

  for (const bill of bills) {
    // Count overall scores
    if (bill.overall_bias_score !== null || bill.overall_positive_impact_score !== null) {
      const biasScore = Math.abs(bill.overall_bias_score || 0);
      const positiveScore = Math.abs(bill.overall_positive_impact_score || 0);

      // Mark as neutral if scores are equal OR both below 0.6
      if (biasScore === positiveScore || (biasScore < 0.6 && positiveScore < 0.6)) {
        overallCounts.neutral++;
      } else if (biasScore > positiveScore) {
        overallCounts.bias++;
      } else {
        overallCounts.positive++;
      }
    }

    // Count category scores
    for (const cat of bill.categories || []) {
      if (!categoryMap.has(cat.category)) {
        categoryMap.set(cat.category, { positive: 0, bias: 0, neutral: 0 });
      }
      
      const counts = categoryMap.get(cat.category)!;
      const biasScore = Math.abs(cat.bias_score);
      const positiveScore = Math.abs(cat.positive_impact_score);

      // Mark as neutral if scores are equal OR both below 0.6
      if (biasScore === positiveScore || (biasScore < 0.6 && positiveScore < 0.6)) {
        counts.neutral++;
      } else if (biasScore > positiveScore) {
        counts.bias++;
      } else {
        counts.positive++;
      }
    }
  }

  // Convert category map to sorted array
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, counts]) => ({
      name: category.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' '),
      ...counts
    }))
    .sort((a, b) => (b.positive + b.bias) - (a.positive + a.bias));

  return {
    overallCounts: [{
      name: 'Overall',
      ...overallCounts
    }],
    categoryBreakdown
  };
}

async function getSponsor(peopleId: string): Promise<Sponsor | null> {
  const [sponsor] = await db`
    SELECT DISTINCT
      p.people_id,
      p.name,
      p.first_name,
      p.middle_name,
      p.last_name,
      p.suffix,
      p.nickname,
      pa.party_name,
      r.role_name,
      st.state_abbr,
      st.state_name,
      p.district,
      p.ballotpedia,
      p.votesmart_id,
      p.opensecrets_id
    FROM ls_people p
    INNER JOIN ls_party pa ON p.party_id = pa.party_id
    INNER JOIN ls_role r ON p.role_id = r.role_id
    INNER JOIN ls_state st ON p.state_id = st.state_id
    WHERE p.people_id = ${peopleId}
  ` as unknown as [Sponsor];

  return sponsor || null;
}

async function getSponsoredBills(peopleId: string): Promise<SponsoredBill[]> {
  const bills = await db`
    WITH latest_history AS (
      SELECT 
        bill_id,
        MAX(history_date) as latest_history_date
      FROM ls_bill_history
      GROUP BY bill_id
    )
    SELECT DISTINCT
      b.bill_id,
      b.bill_number,
      b.title,
      st.state_abbr,
      p.progress_desc as status_desc,
      spt.sponsor_type_desc,
      h.latest_history_date,
      bar.overall_bias_score,
      bar.overall_positive_impact_score,
      bar.confidence,
      bacs.category,
      bacs.bias_score,
      bacs.positive_impact_score,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'subgroup_code', bass.subgroup_code,
              'bias_score', bass.bias_score,
              'positive_impact_score', bass.positive_impact_score,
              'evidence', bass.evidence
            )
          )
          FROM bill_analysis_subgroup_scores bass
          WHERE bass.category_score_id = bacs.category_score_id
        ),
        '[]'::jsonb
      ) as subgroups
    FROM ls_bill b
    INNER JOIN ls_bill_sponsor bs ON b.bill_id = bs.bill_id
    INNER JOIN ls_sponsor_type spt ON bs.sponsor_type_id = spt.sponsor_type_id
    INNER JOIN ls_state st ON b.state_id = st.state_id
    LEFT JOIN latest_history h ON b.bill_id = h.bill_id
    LEFT JOIN ls_progress p ON b.status_id = p.progress_event_id
    LEFT JOIN bill_analysis_results bar ON b.bill_id = bar.bill_id
    LEFT JOIN bill_analysis_category_scores bacs ON bar.analysis_id = bacs.analysis_id
    WHERE bs.people_id = ${peopleId}
    AND b.bill_type_id = 1
    ORDER BY h.latest_history_date DESC NULLS LAST, b.bill_id DESC
    LIMIT 50
  ` as unknown as (SponsoredBill & CategoryScore & { subgroups: SubgroupScore[] })[];

  // Group the categories by bill
  const billMap = new Map<number, SponsoredBill>();
  
  for (const row of bills) {
    const { 
      category, 
      bias_score, 
      positive_impact_score,
      subgroups,
      ...billData 
    } = row;

    if (!billMap.has(billData.bill_id)) {
      billMap.set(billData.bill_id, {
        ...billData,
        categories: []
      });
    }

    if (category) {
      billMap.get(billData.bill_id)!.categories.push({
        category,
        bias_score,
        positive_impact_score,
        subgroups: subgroups || []
      });
    }
  }

  return Array.from(billMap.values());
}

function transformBillsToCategories(bills: SponsoredBill[]): CategoryData[] {
  const categoryMap = new Map<string, CategoryData>();
  
  bills.forEach(bill => {
    bill.categories.forEach(cat => {
      if (!categoryMap.has(cat.category)) {
        categoryMap.set(cat.category, {
          category: cat.category,
          bills: []
        });
      }
      
      if (cat.subgroups && cat.subgroups.length > 0) {
        categoryMap.get(cat.category)!.bills.push({
          bill_id: bill.bill_id,
          bill_number: bill.bill_number,
          subgroups: cat.subgroups
        });
      }
    });
  });
  
  return Array.from(categoryMap.values());
}

async function getVoteCounts(peopleId: string): Promise<VoteCount[]> {
  const counts = await db`
    SELECT
      CASE 
        WHEN bvd.vote_id = 1 THEN 'Yea'
        WHEN bvd.vote_id = 2 THEN 'Nay'
        WHEN bvd.vote_id = 3 THEN 'Not Voting'
        ELSE 'Other'
      END as vote,
      COUNT(*)::int as count
    FROM ls_bill b
    INNER JOIN ls_bill_vote bv ON b.bill_id = bv.bill_id
    INNER JOIN ls_bill_vote_detail bvd ON bv.roll_call_id = bvd.roll_call_id
    WHERE bvd.people_id = ${peopleId}
    AND b.bill_type_id = 1
    GROUP BY bvd.vote_id
    ORDER BY vote
  ` as unknown as VoteCount[];
  return counts;
}

export default async function SponsorPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const sponsor = await getSponsor(params.id);
  
  if (!sponsor) {
    notFound();
  }

  const [sponsoredBills, voteCounts] = await Promise.all([
    getSponsoredBills(params.id),
    getVoteCounts(params.id)
  ]);

  const sponsoredAnalytics = aggregateAnalytics(sponsoredBills);

  return (
    <div className="py-8 min-h-screen bg-white dark:bg-zinc-900">
      <AuroraBackground className="h-[12vh] min-h-[96px] flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {sponsor.role_name} • {sponsor.party_name}
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                {sponsor.name}
              </h1>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {sponsor.state_name}{sponsor.district ? ` • District ${sponsor.district}` : ''}
              </div>
            </div>
            <BackButton />
          </div>
        </div>
      </AuroraBackground>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {sponsor.votesmart_id && (
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
                <Image
                  src={`https://static.votesmart.org/static/canphoto/${sponsor.votesmart_id}.jpg`}
                  alt={sponsor.name}
                  fill
                  className="object-contain"
                  sizes="(min-width: 1024px) 480px, 100vw"
                  quality={100}
                  priority
                />
              </div>
            )}

            {/* External Links */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">External Links</h3>
              <div className="space-y-3">
                {sponsor.ballotpedia && (
                  <a 
                    href={sponsor.ballotpedia}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Ballotpedia
                  </a>
                )}
                {sponsor.votesmart_id && (
                  <a 
                    href={`https://votesmart.org/candidate/${sponsor.votesmart_id}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Vote Smart
                  </a>
                )}
                {sponsor.opensecrets_id && (
                  <a 
                    href={`https://www.opensecrets.org/members-of-congress/${sponsor.opensecrets_id}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on OpenSecrets
                  </a>
                )}
              </div>
            </Card>

            {/* Statistics Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Bills Sponsored
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {sponsoredBills.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Voting Pattern
                  </div>
                  <div className="mt-2">
                    {voteCounts.length > 0 ? (
                      <div className="flex gap-2">
                        {voteCounts.map(({ vote, count }) => (
                          <div 
                            key={vote}
                            className={`text-sm px-2 py-1 rounded ${
                              vote === 'Yea' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                                : vote === 'Nay'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100'
                            }`}
                          >
                            {vote}: {count}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        No voting data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analytics Section */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-3">Sponsored Bills Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Overall Impact</h3>
                    <OverallChart data={sponsoredAnalytics.overallCounts} />
                  </div>
                  <div className="h-full">
                    <h3 className="text-lg font-medium mb-2">Category Breakdown</h3>
                    <div className="h-[calc(100%-2rem)]">
                      <CategoryChart data={sponsoredAnalytics.categoryBreakdown} />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Demographic Breakdown</h3>
                  <SubgroupBarChart data={transformBillsToCategories(sponsoredBills)} />
                </div>
              </Card>

              {/* Sponsored Bills */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Sponsored Bills</h2>
                <div className="space-y-4">
                  {sponsoredBills.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No bills sponsored
                    </p>
                  ) : (
                    sponsoredBills.map((bill) => (
                      <Link
                        key={bill.bill_id}
                        href={`/${bill.state_abbr}/bill/${bill.bill_id}`}
                        className="block p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
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
                    ))
                  )}
                </div>
              </Card>

              {/* Voting History */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Votes</h2>
                <VotingHistory sponsorId={params.id} />
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}