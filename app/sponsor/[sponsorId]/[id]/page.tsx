import { Metadata } from 'next';

interface Props {
  params: { sponsorId: string; id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Vote ${params.id} - Sponsor ${params.sponsorId} - LegiEquity`,
    description: `View details about this sponsor's vote.`,
  }
}

export default async function SponsorVotePage({ params }: Props) {
  return (
    <div>
      <h1>Sponsor Vote Page</h1>
      <p>Sponsor ID: {params.sponsorId}</p>
      <p>Vote ID: {params.id}</p>
    </div>
  );
} 