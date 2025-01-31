import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { STATE_NAMES } from '@/app/constants/states';

export const runtime = 'edge'

interface BillData {
  bill_number: string;
  title: string;
  description: string;
  state_abbr: string;
  state_name: string;
  status_desc: string;
  current_body_name: string;
}

async function getBill(billId: string): Promise<BillData> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/bills/${billId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch bill data')
  }
  return response.json()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stateCode = searchParams.get('state')?.toUpperCase()
    const billId = searchParams.get('id')

    // Handle missing parameters
    if (!stateCode || !billId) {
      return new Response('Missing required parameters', { status: 400 })
    }

    // Get bill data
    const bill = await getBill(billId)
    if (!bill) {
      return new Response('Bill not found', { status: 404 })
    }

    // Get state name
    const stateName = STATE_NAMES[stateCode] || stateCode

    // Format title
    const title = bill.title !== bill.description 
      ? `${bill.bill_number}: ${bill.title}`
      : bill.bill_number

    // Truncate description if needed
    const description = bill.description.length > 120
      ? bill.description.substring(0, 117) + '...'
      : bill.description

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
          <div style={{ fontSize: 32, color: 'white', marginBottom: 20, fontWeight: 600, textAlign: 'center' }}>
            {title}
          </div>
          <div style={{ fontSize: 20, color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>
            {description}
          </div>
          <div style={{ fontSize: 16, color: '#64748b', textAlign: 'center' }}>
            {stateName} Legislature • {bill.current_body_name} • {bill.status_desc}
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