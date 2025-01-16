import { RollCall } from '@/types'

export default function RollCallVotes({ rollCalls }: { rollCalls: RollCall[] }) {
  return (
    <div className="space-y-4">
      {rollCalls.map((rollCall) => (
        <div key={rollCall.roll_call_id} className="bg-white shadow rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">
            {rollCall.chamber} Vote on {new Date(rollCall.date).toLocaleDateString()}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Result: {rollCall.passed ? 'Passed' : 'Failed'}</p>
              <p>Yea: {rollCall.yea}</p>
              <p>Nay: {rollCall.nay}</p>
            </div>
            <div>
              <p>Not Voting: {rollCall.nv}</p>
              <p>Absent: {rollCall.absent}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

