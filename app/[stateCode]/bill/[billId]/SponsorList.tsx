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
  sponsor_order: number;
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
                    <div className="p-4 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                      <div className="flex flex-col">
                        <div className="inline-flex items-center px-2 py-1 mb-2 self-start rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                          {sponsor.party_name}
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-white text-lg mb-1">
                          {sponsor.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {sponsor.role_name}
                        </div>
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