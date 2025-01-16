import { Sponsor } from '@/types'

export default function SponsorList({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <ul className="space-y-2">
      {sponsors.map((sponsor) => (
        <li key={sponsor.sponsor_id} className="flex items-center space-x-2">
          <span className={`w-4 h-4 rounded-full ${sponsor.party === 'D' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
          <span>{sponsor.name}</span>
          <span className="text-gray-500">({sponsor.party}-{sponsor.district})</span>
        </li>
      ))}
    </ul>
  )
}

