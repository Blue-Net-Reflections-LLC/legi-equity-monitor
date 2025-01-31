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
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 40,
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L20 7V17L12 21L4 17V7L12 3Z" stroke="white" strokeWidth="2" />
              </svg>
              <span style={{ marginLeft: 16, fontSize: 48, color: 'white', fontWeight: 700 }}>
                LegiEquity
              </span>
            </div>
            <div style={{ fontSize: 32, color: '#94a3b8', textAlign: 'center' }}>
              AI-powered analysis of legislation&apos;s impact on demographic equity
            </div>
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
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 40,
                gap: 24,
              }}
            >
              {/* US Congress Seal */}
              <img
                src="https://legiequity.us/images/Seal_of_the_United_States_Congress.svg"
                alt="US Congress"
                width={80}
                height={80}
                style={{ borderRadius: '50%' }}
              />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L20 7V17L12 21L4 17V7L12 3Z" stroke="white" strokeWidth="2" />
                </svg>
                <span style={{ marginLeft: 16, fontSize: 48, color: 'white', fontWeight: 700 }}>
                  LegiEquity
                </span>
              </div>
            </div>
            <div style={{ fontSize: 40, color: 'white', marginBottom: 20, fontWeight: 600 }}>
              Congressional Legislative Analysis
            </div>
            <div style={{ fontSize: 24, color: '#94a3b8', textAlign: 'center' }}>
              Analyzing demographic impact of federal legislation across age, disability, gender, race, and religion
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        },
      )
    }

    // State-specific image with SVG
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
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              gap: 24,
            }}
          >
            {/* State SVG */}
            <img
              src={`https://legiequity.us/images/states/${stateCode.toLowerCase()}.svg`}
              alt={stateName}
              width={80}
              height={80}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L20 7V17L12 21L4 17V7L12 3Z" stroke="white" strokeWidth="2" />
              </svg>
              <span style={{ marginLeft: 16, fontSize: 48, color: 'white', fontWeight: 700 }}>
                LegiEquity
              </span>
            </div>
          </div>
          <div style={{ fontSize: 40, color: 'white', marginBottom: 20, fontWeight: 600 }}>
            {stateName} Legislative Analysis
          </div>
          <div style={{ fontSize: 24, color: '#94a3b8', textAlign: 'center' }}>
            Analyzing demographic impact of legislation across age, disability, gender, race, and religion
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
} 