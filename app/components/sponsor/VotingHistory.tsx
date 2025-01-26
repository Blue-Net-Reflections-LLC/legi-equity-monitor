'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Vote {
  bill_id: number;
  bill_number: string;
  title: string;
  state_abbr: string;
  vote_date: string;
  vote_desc: string;
  vote: string;
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
        <Link
          key={`${vote.bill_id}-${vote.vote_date}`}
          href={`/${vote.state_abbr}/bill/${vote.bill_id}`}
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
      ))}
    </div>
  );
} 