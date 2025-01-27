"use client";

import Link from 'next/link';
import Image from 'next/image';

interface State {
  name: string;
  code: string;
}

const STATES: State[] = [
  { name: 'Alabama', code: 'AL' },
  { name: 'Alaska', code: 'AK' },
  { name: 'Arizona', code: 'AZ' },
  { name: 'Arkansas', code: 'AR' },
  { name: 'California', code: 'CA' },
  { name: 'Colorado', code: 'CO' },
  { name: 'Connecticut', code: 'CT' },
  { name: 'Delaware', code: 'DE' },
  { name: 'District of Columbia', code: 'DC' },
  { name: 'Florida', code: 'FL' },
  { name: 'Georgia', code: 'GA' },
  { name: 'Hawaii', code: 'HI' },
  { name: 'Idaho', code: 'ID' },
  { name: 'Illinois', code: 'IL' },
  { name: 'Indiana', code: 'IN' },
  { name: 'Iowa', code: 'IA' },
  { name: 'Kansas', code: 'KS' },
  { name: 'Kentucky', code: 'KY' },
  { name: 'Louisiana', code: 'LA' },
  { name: 'Maine', code: 'ME' },
  { name: 'Maryland', code: 'MD' },
  { name: 'Massachusetts', code: 'MA' },
  { name: 'Michigan', code: 'MI' },
  { name: 'Minnesota', code: 'MN' },
  { name: 'Mississippi', code: 'MS' },
  { name: 'Missouri', code: 'MO' },
  { name: 'Montana', code: 'MT' },
  { name: 'Nebraska', code: 'NE' },
  { name: 'Nevada', code: 'NV' },
  { name: 'New Hampshire', code: 'NH' },
  { name: 'New Jersey', code: 'NJ' },
  { name: 'New Mexico', code: 'NM' },
  { name: 'New York', code: 'NY' },
  { name: 'North Carolina', code: 'NC' },
  { name: 'North Dakota', code: 'ND' },
  { name: 'Ohio', code: 'OH' },
  { name: 'Oklahoma', code: 'OK' },
  { name: 'Oregon', code: 'OR' },
  { name: 'Pennsylvania', code: 'PA' },
  { name: 'Rhode Island', code: 'RI' },
  { name: 'South Carolina', code: 'SC' },
  { name: 'South Dakota', code: 'SD' },
  { name: 'Tennessee', code: 'TN' },
  { name: 'Texas', code: 'TX' },
  { name: 'US Congress', code: 'US' },
  { name: 'Utah', code: 'UT' },
  { name: 'Vermont', code: 'VT' },
  { name: 'Virginia', code: 'VA' },
  { name: 'Washington', code: 'WA' },
  { name: 'West Virginia', code: 'WV' },
  { name: 'Wisconsin', code: 'WI' },
  { name: 'Wyoming', code: 'WY' }
];

export default function StateTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATES.map(({ name, code }) => (
        <div key={code} className="relative p-1">
          <Link
            href={`/${code.toLowerCase()}`}
            className="relative flex flex-col items-center justify-center h-40 bg-zinc-50/10 dark:bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden group hover:bg-zinc-100/20 dark:hover:bg-white/20 transition-all duration-300 border border-zinc-200 dark:border-zinc-700 p-4 hover:border-zinc-300 dark:hover:border-zinc-600"
          >
            <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
              {code === 'US' ? (
                <Image
                  src="/images/Seal_of_the_United_States_Congress.svg"
                  alt={name}
                  fill
                  className="object-contain"
                />
              ) : code === 'DC' ? (
                <div className="text-4xl font-bold text-zinc-600 dark:text-zinc-400">
                  DC
                </div>
              ) : (
                <Image
                  src={`/images/states/${code.toLowerCase()}.svg`}
                  alt={name}
                  fill
                  className="object-contain"
                />
              )}
            </div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:scale-110 transition-transform duration-300">
              {name}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 