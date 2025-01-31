import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { STATE_NAMES } from '@/app/constants/states';

export const runtime = 'edge'

interface SponsorData {
  name: string;
  title: string;
  state_abbr: string;
  party: string;
  district?: string;
  bills_sponsored: number;
  bills_cosponsored: number;
  votesmart_id?: string | null;
}

async function getSponsor(sponsorId: string): Promise<SponsorData> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/sponsors/${sponsorId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch sponsor data')
  }
  return response.json()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stateCode = searchParams.get('state')?.toUpperCase()
    const sponsorId = searchParams.get('id')

    // Handle missing parameters
    if (!stateCode || !sponsorId) {
      return new Response('Missing required parameters', { status: 400 })
    }

    // Get sponsor data
    const sponsor = await getSponsor(sponsorId)
    if (!sponsor) {
      return new Response('Sponsor not found', { status: 404 })
    }

    // Get state name
    const stateName = STATE_NAMES[stateCode] || stateCode

    // Format district/title
    const roleText = sponsor.district 
      ? `${sponsor.party}-${sponsor.district}`
      : sponsor.title

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#030712',
            padding: '40px 80px',
            gap: '40px',
          }}
        >
          {/* Header with photo and logo */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            {sponsor.votesmart_id ? (
              <img
                src={`https://static.votesmart.org/static/canphoto/${sponsor.votesmart_id}.jpg`}
                alt={sponsor.name}
                width={120}
                height={160}
                style={{
                  borderRadius: '8px',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <img
                src={`https://legiequity.us/images/states/${stateCode.toLowerCase()}.svg`}
                alt={stateName}
                width={80}
                height={80}
              />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L20 7V17L12 21L4 17V7L12 3Z" stroke="white" strokeWidth="2" />
              </svg>
              <span
                style={{
                  fontSize: 48,
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                LegiEquity
              </span>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 40, color: 'white', fontWeight: 600, textAlign: 'center' }}>
              {sponsor.name}
            </span>
            <span style={{ fontSize: 24, color: '#94a3b8', textAlign: 'center' }}>
              {stateName} • {roleText}
            </span>
            <span style={{ fontSize: 20, color: '#64748b', textAlign: 'center' }}>
              {sponsor.bills_sponsored} Bills Sponsored • {sponsor.bills_cosponsored} Bills Co-sponsored
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: unknown) {
    console.log(`${e instanceof Error ? e.message : 'Unknown error'}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
} 