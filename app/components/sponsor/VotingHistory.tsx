'use client';

import { useEffect, useState } from 'react';
import { BillLink } from '@/app/components/ui/seo-links';

interface Vote {
  bill_id: number;
  bill_number: string;
  title: string;
  state_abbr: string;
  vote_date: string;
  vote_desc: string;
  vote_text: string;
}

function getVoteBadgeStyles(voteType: string) {
  switch (voteType) {
    case 'Yea':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'Nay':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case 'Not Voting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  }
}

export function VotingHistory({ sponsorId }: { sponsorId: string }) {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVotes() {
      try {
        const response = await fetch(`/api/sponsor/${sponsorId}/votes`);
        if (!response.ok) throw new Error('Failed to fetch voting history');
        const data = await response.json();
        setVotes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load voting history');
      } finally {
        setLoading(false);
      }
    }

    fetchVotes();
  }, [sponsorId]);

  if (loading) {
    return <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading voting history...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (votes.length === 0) {
    return <div className="text-sm text-zinc-500 dark:text-zinc-400">No voting history available</div>;
  }

  return (
    <div className="space-y-4">
      {votes.map((vote) => (
        <BillLink
          key={`${vote.bill_id}-${vote.vote_date}`}
          stateCode={vote.state_abbr.toLowerCase()}
          billId={vote.bill_id.toString()}
          billNumber={vote.bill_number}
          title={vote.title}
          className="block"
        >
          <div className="p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors">
            <div className="space-y-1">
              <div className="text-zinc-900 dark:text-white">
                <span className="font-medium">{vote.bill_number}</span>
                <span className="mx-2 text-zinc-400 dark:text-zinc-500">•</span>
                <span className="text-zinc-600 dark:text-zinc-400">{vote.title}</span>
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Voted <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVoteBadgeStyles(vote.vote_text)}`}>
                  {vote.vote_text}
                </span> on {new Date(vote.vote_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </BillLink>
      ))}
    </div>
  );
} 