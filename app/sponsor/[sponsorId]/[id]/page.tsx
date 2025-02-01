interface Props {
  params: { sponsorId: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sponsor = await getSponsor(params.sponsorId);
  // ... existing code ...
} 