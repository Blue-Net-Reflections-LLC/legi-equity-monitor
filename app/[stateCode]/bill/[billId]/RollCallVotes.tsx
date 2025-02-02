'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface RollCall {
  roll_call_id: number;
  roll_call_date: Date;
  roll_call_desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  passed: number;
  roll_call_body_name: string;
  votes?: Array<{
    people_id: number;
    name: string;
    party_name: string;
    vote_desc: string;
  }>;
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

export default function RollCallVotes({ rollCalls }: { rollCalls: RollCall[] }) {
  const [expandedVotes, setExpandedVotes] = useState<number[]>([]);

  const toggleVotes = (rollCallId: number) => {
    setExpandedVotes(prev => 
      prev.includes(rollCallId) 
        ? prev.filter(id => id !== rollCallId)
        : [...prev, rollCallId]
    );
  };

  return (
    <div className="space-y-4">
      {rollCalls.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No roll call votes recorded
        </p>
      ) : (
        <div className="space-y-4">
          {rollCalls.map((vote) => (
            <div 
              key={vote.roll_call_id}
              className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-zinc-900 dark:text-white">
                  {vote.roll_call_desc}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(vote.roll_call_date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {vote.yea}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Yea</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {vote.nay}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Nay</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                    {vote.nv}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Not Voting</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-zinc-600 dark:text-zinc-300">
                    {vote.absent}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">Absent</div>
                </div>
              </div>

              <div className="text-sm font-medium text-center pt-2 border-t border-zinc-200 dark:border-zinc-700">
                Result: <span className={vote.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {vote.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              {vote.votes && (
                <>
                  <button
                    onClick={() => toggleVotes(vote.roll_call_id)}
                    className="flex items-center justify-center w-full gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors mt-2"
                  >
                    {expandedVotes.includes(vote.roll_call_id) ? (
                      <>
                        Hide Individual Votes <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show Individual Votes <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {expandedVotes.includes(vote.roll_call_id) && (
                    <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                      {vote.votes.map((legislator) => (
                        <div 
                          key={legislator.people_id}
                          className="flex items-center justify-between py-2 px-3 bg-white dark:bg-zinc-900 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {legislator.name}
                            </span>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              {legislator.party_name}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVoteBadgeStyles(legislator.vote_desc)}`}>
                            {legislator.vote_desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 