'use client';

import Image from 'next/image';
import { SponsorLink } from '@/app/components/ui/seo-links';

interface Sponsor {
  people_id: number;
  name: string;
  party_name: string;
  role_name: string;
  sponsor_type_desc: string;
  votesmart_id: string | null;
  sponsor_order: number;
}

function getPartyColors(party: string) {
  switch (party) {
    case 'Democrat':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'Republican':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'Independent':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    default:
      return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200';
  }
}

function AvatarPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
      <svg 
        className="w-12 h-12 text-zinc-400" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

export default function SponsorList({ sponsors }: { sponsors: Sponsor[] }) {
  // Use the first sponsor (by order) as primary, rest are co-sponsors
  const primarySponsor = sponsors[0];
  const coSponsors = sponsors.slice(1);

  // Calculate party counts
  const partyCounts = sponsors.reduce((acc, sponsor) => {
    acc[sponsor.party_name] = (acc[sponsor.party_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {sponsors.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No sponsors listed
        </p>
      ) : (
        <>
          {/* Party Count Summary */}
          <div className="flex gap-3 flex-wrap">
            {Object.entries(partyCounts).map(([party, count]) => (
              <div 
                key={party}
                className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-sm ${getPartyColors(party)}`}
              >
                {party}: {count}
              </div>
            ))}
          </div>

          {/* Primary Sponsor Section */}
          {primarySponsor && (
            <div className="border-b border-zinc-200 dark:border-zinc-700 pb-6">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                Primary Sponsor
              </h3>
              <SponsorLink 
                sponsorId={primarySponsor.people_id.toString()}
                name={primarySponsor.name}
                className="block"
              >
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0" data-sponsor-id={primarySponsor.people_id}>
                    {primarySponsor.votesmart_id ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={`https://static.votesmart.org/static/canphoto/${primarySponsor.votesmart_id}.jpg`}
                          alt={primarySponsor.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                          onError={() => {
                            const imgContainer = document.querySelector(`[data-sponsor-id="${primarySponsor.people_id}"]`);
                            if (imgContainer) {
                              imgContainer.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                                  <svg 
                                    class="w-8 h-8 text-zinc-400"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      stroke-linecap="round"
                                      stroke-linejoin="round"
                                      stroke-width="1"
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <AvatarPlaceholder />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium text-zinc-900 dark:text-white text-lg">
                      {primarySponsor.name}
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 mt-2 rounded-full text-xs font-medium ${getPartyColors(primarySponsor.party_name)}`}>
                      {primarySponsor.party_name}
                    </div>
                  </div>
                </div>
              </SponsorLink>
            </div>
          )}

          {/* Co-Sponsors Section */}
          {coSponsors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                Co-Sponsors ({coSponsors.length})
              </h3>
              <div className="space-y-2">
                {coSponsors.map((sponsor) => (
                  <SponsorLink 
                    key={sponsor.people_id}
                    sponsorId={sponsor.people_id.toString()}
                    name={sponsor.name}
                    className="block"
                  >
                    <div className="px-4 py-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-zinc-900 dark:text-white truncate">
                              {sponsor.name}
                            </div>
                        </div>
                        <div className={`text-sm px-2 py-1 rounded-full flex-shrink-0 ${getPartyColors(sponsor.party_name)}`}>
                          {sponsor.party_name}
                        </div>
                    </div>
                    </div>
                  </SponsorLink>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 