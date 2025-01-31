import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { STATE_NAMES } from '@/app/constants/states';

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stateCode = searchParams.get('state')?.toUpperCase()

    // Handle missing state parameter
    if (!stateCode) {
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L20 7V17L12 21L4 17V7L12 3Z" stroke="white" strokeWidth="2" />
              </svg>
              <span style={{ fontSize: 48, color: 'white', fontWeight: 700 }}>
                LegiEquity
              </span>
            </div>
            <span style={{ fontSize: 32, color: '#94a3b8', textAlign: 'center' }}>
              AI-powered analysis of legislation&apos;s impact on demographic equity
            </span>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      )
    }

    // Get state name
    const stateName = STATE_NAMES[stateCode] || stateCode

    // Special handling for US Congress
    if (stateCode === 'US') {
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
              }}
            >
              <img
                src="https://legiequity.us/images/Seal_of_the_United_States_Congress.svg"
                alt="US Congress"
                width={80}
                height={80}
                style={{ borderRadius: '50%' }}
              />
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
                <span style={{ fontSize: 48, color: 'white', fontWeight: 700 }}>
                  LegiEquity
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <span style={{ fontSize: 40, color: 'white', fontWeight: 600 }}>
                Congressional Legislative Analysis
              </span>
              <span style={{ fontSize: 24, color: '#94a3b8', textAlign: 'center' }}>
                Analyzing demographic impact of federal legislation across age, disability, gender, race, and religion
              </span>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      )
    }

    // State-specific image
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
            }}
          >
            <img
              src={`https://legiequity.us/images/states/${stateCode.toLowerCase()}.svg`}
              alt={stateName}
              width={80}
              height={80}
            />
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
              <span style={{ fontSize: 48, color: 'white', fontWeight: 700 }}>
                LegiEquity
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <span style={{ fontSize: 40, color: 'white', fontWeight: 600 }}>
              {stateName} Legislative Analysis
            </span>
            <span style={{ fontSize: 24, color: '#94a3b8', textAlign: 'center' }}>
              Analyzing demographic impact of legislation across age, disability, gender, race, and religion
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