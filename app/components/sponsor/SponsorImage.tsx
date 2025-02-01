'use client';

import Image from 'next/image';
import { useState } from 'react';

function AvatarPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
      <svg 
        className="w-16 h-16 text-zinc-400" 
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

interface SponsorImageProps {
  votesmartId: string | null;
  name: string;
  peopleId: number;
}

export default function SponsorImage({ votesmartId, name, peopleId }: SponsorImageProps) {
  const [error, setError] = useState(false);

  if (!votesmartId || error) {
    return <AvatarPlaceholder />;
  }

  return (
    <Image
      src={`https://static.votesmart.org/static/canphoto/${votesmartId}.jpg`}
      alt={name}
      fill
      className="object-contain"
      sizes="(min-width: 1024px) 480px, 100vw"
      quality={100}
      priority
      onError={() => setError(true)}
    />
  );
} 