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
}

export default function RollCallVotes({ rollCalls }: { rollCalls: RollCall[] }) {
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 