'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Sponsor {
  people_id: number;
  name: string;
  party_name: string;
  role_name: string;
  sponsor_type_desc: string;
  votesmart_id: string | null;
}

export default function SponsorList({ sponsors }: { sponsors: Sponsor[] }) {
  const primarySponsor = sponsors.find(s => s.sponsor_type_desc === 'Primary Sponsor');
  const coSponsors = sponsors.filter(s => s.sponsor_type_desc !== 'Primary Sponsor');

  return (
    <div className="space-y-6">
      {sponsors.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No sponsors listed
        </p>
      ) : (
        <>
          {/* Primary Sponsor Section */}
          {primarySponsor && (
            <div className="border-b border-zinc-200 dark:border-zinc-700 pb-6">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                Primary Sponsor
              </h3>
              <Link 
                href={`/sponsor/${primarySponsor.people_id}`}
                className="block"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={primarySponsor.votesmart_id 
                        ? `https://static.votesmart.org/static/canphoto/${primarySponsor.votesmart_id}.jpg`
                        : '/images/placeholder-headshot.png'
                      }
                      alt={primarySponsor.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-headshot.png';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium text-zinc-900 dark:text-white text-lg">
                      {primarySponsor.name}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {primarySponsor.role_name}
                    </div>
                    <div className="inline-flex items-center px-2 py-1 mt-2 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                      {primarySponsor.party_name}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Co-Sponsors Section */}
          {coSponsors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                Co-Sponsors ({coSponsors.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coSponsors.map((sponsor) => (
                  <Link 
                    key={sponsor.people_id}
                    href={`/sponsor/${sponsor.people_id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-white">
                          {sponsor.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {sponsor.role_name}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {sponsor.party_name}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 