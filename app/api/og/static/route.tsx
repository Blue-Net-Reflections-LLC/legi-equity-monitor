import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const TITLES = {
  about: 'About LegiEquity',
  terms: 'Terms & Agreements',
  blog: 'LegiEquity Blog',
  contact: 'Contact Us'
} as const;

const DESCRIPTIONS = {
  about: 'Learn about our mission to analyze legislative impact on demographic equity using AI',
  terms: 'Terms of service, privacy policy, and user agreements',
  blog: 'Insights and updates on legislative analysis and demographic equity',
  contact: 'Get in touch with the LegiEquity team'
} as const;

type PageType = keyof typeof TITLES;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page')?.toLowerCase() as PageType

    if (!page || !TITLES[page]) {
      return new Response('Invalid page parameter', { status: 400 })
    }

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <span style={{ fontSize: 40, color: 'white', fontWeight: 600, textAlign: 'center' }}>
              {TITLES[page]}
            </span>
            <span style={{ fontSize: 24, color: '#94a3b8', textAlign: 'center' }}>
              {DESCRIPTIONS[page]}
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