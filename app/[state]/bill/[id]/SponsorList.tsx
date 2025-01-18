interface Sponsor {
  people_id: number;
  name: string;
  party_name: string;
  role_name: string;
  sponsor_type_desc: string;
}

export default function SponsorList({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <div className="space-y-4">
      {sponsors.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No sponsors listed
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sponsors.map((sponsor) => (
            <div 
              key={sponsor.people_id}
              className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
            >
              <div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  {sponsor.name}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {sponsor.role_name} • {sponsor.sponsor_type_desc}
                </div>
              </div>
              <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {sponsor.party_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 