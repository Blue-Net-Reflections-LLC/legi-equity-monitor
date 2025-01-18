import db from "@/lib/db";
import { notFound } from "next/navigation";
import { Card } from "@/app/components/ui/card";
import { AuroraBackground } from "@/app/components/ui/aurora-background";
import BackButton from '@/app/[state]/bill/[id]/BackButton';
import Link from 'next/link';
import Image from 'next/image';

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

interface SponsoredBill {
  bill_id: number;
  bill_number: string;
  title: string;
  state_abbr: string;
  status_desc: string;
  sponsor_type_desc: string;
}

interface VotedBill {
  bill_id: number;
  bill_number: string;
  title: string;
  state_abbr: string;
  vote_date: Date;
  vote_desc: string;
  vote: string;
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
    SELECT DISTINCT
      b.bill_id,
      b.bill_number,
      b.title,
      st.state_abbr,
      b.status_date,
      spt.sponsor_type_desc
    FROM ls_bill b
    INNER JOIN ls_bill_sponsor bs ON b.bill_id = bs.bill_id
    INNER JOIN ls_sponsor_type spt ON bs.sponsor_type_id = spt.sponsor_type_id
    INNER JOIN ls_state st ON b.state_id = st.state_id
    WHERE bs.people_id = ${peopleId}
    ORDER BY b.status_date DESC
    LIMIT 50
  ` as unknown as SponsoredBill[];

  return bills;
}

async function getVotingHistory(peopleId: string): Promise<VotedBill[]> {
  const votes = await db`
    SELECT DISTINCT
      b.bill_id,
      b.bill_number,
      b.title,
      st.state_abbr,
      bv.roll_call_date as vote_date,
      bv.roll_call_desc as vote_desc,
      CASE 
        WHEN bvd.vote_id = 1 THEN 'Yea'
        WHEN bvd.vote_id = 2 THEN 'Nay'
        WHEN bvd.vote_id = 3 THEN 'Not Voting'
        ELSE 'Other'
      END as vote
    FROM ls_bill b
    INNER JOIN ls_bill_vote bv ON b.bill_id = bv.bill_id
    INNER JOIN ls_bill_vote_detail bvd ON bv.roll_call_id = bvd.roll_call_id
    INNER JOIN ls_state st ON b.state_id = st.state_id
    WHERE bvd.people_id = ${peopleId}
    ORDER BY bv.roll_call_date DESC
    LIMIT 50
  ` as unknown as VotedBill[];

  return votes;
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

  const [sponsoredBills, votingHistory] = await Promise.all([
    getSponsoredBills(params.id),
    getVotingHistory(params.id)
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
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

      <div className="max-w-7xl mx-auto px-4 py-8 mt-8">
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
                    Votes Cast
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {votingHistory.length}
                  </div>
                </div>
                {votingHistory.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      Voting Pattern
                    </div>
                    <div className="mt-2 flex gap-2">
                      {Object.entries(
                        votingHistory.reduce((acc, vote) => {
                          acc[vote.vote] = (acc[vote.vote] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([vote, count]) => (
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
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Full Name
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {[
                      sponsor.first_name,
                      sponsor.middle_name,
                      sponsor.last_name,
                      sponsor.suffix
                    ].filter(Boolean).join(" ")}
                    {sponsor.nickname && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                        ("{sponsor.nickname}")
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Role
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {sponsor.role_name}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Party
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {sponsor.party_name}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    State
                  </div>
                  <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                    {sponsor.state_name}
                  </div>
                </div>

                {sponsor.district && (
                  <div>
                    <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      District
                    </div>
                    <div className="mt-1 text-zinc-900 dark:text-zinc-100">
                      {sponsor.district}
                    </div>
                  </div>
                )}
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
                      href={`/${bill.state_abbr.toLowerCase()}/bill/${bill.bill_id}`}
                      className="block"
                    >
                      <div className="p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors">
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
                            {bill.sponsor_type_desc}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                          {bill.status_desc}
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
              <div className="space-y-4">
                {votingHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No voting history available
                  </p>
                ) : (
                  votingHistory.map((vote) => (
                    <Link 
                      key={`${vote.bill_id}-${vote.vote_date}`}
                      href={`/${vote.state_abbr.toLowerCase()}/bill/${vote.bill_id}`}
                      className="block"
                    >
                      <div className="p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-white">
                              {vote.bill_number}
                            </div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                              {vote.title}
                            </div>
                          </div>
                          <div className={`text-sm font-medium px-2 py-1 rounded ${
                            vote.vote === 'Yea' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : vote.vote === 'Nay'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100'
                          }`}>
                            {vote.vote}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                          {new Date(vote.vote_date).toLocaleDateString()} • {vote.vote_desc}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 