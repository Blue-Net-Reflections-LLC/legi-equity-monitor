import { Bill, Sponsor, RollCall } from '@/types'

export const bills: Bill[] = [
  {
    bill_id: 1,
    bill_number: 'HB 1234',
    bill_type: 'H',
    title: 'Education Equity Act',
    description: 'A bill to ensure equal access to quality education for all communities.',
    committee_name: 'Education Committee',
    last_action: 'Passed House',
    last_action_date: '2023-06-15',
    impact_level: 'high',
    sentiment: 'positive',
    pdf_url: 'https://example.com/HB1234.pdf',
  },
  // Add more mock bills here...
]

export const sponsors: Record<number, Sponsor[]> = {
  1: [
    {
      sponsor_id: 1,
      name: 'Jane Doe',
      party: 'D',
      district: 'District 1',
      role: 'Primary Sponsor',
    },
    // Add more sponsors for bill 1...
  ],
  // Add sponsors for other bills...
}

export const rollCalls: Record<number, RollCall[]> = {
  1: [
    {
      roll_call_id: 1,
      bill_id: 1,
      date: '2023-06-14',
      yea: 60,
      nay: 40,
      nv: 0,
      absent: 0,
      passed: true,
      chamber: 'House',
      chamber_id: 1,
    },
    // Add more roll calls for bill 1...
  ],
  // Add roll calls for other bills...
}

export async function getBills(page = 1, pageSize = 10): Promise<{ bills: Bill[], totalCount: number }> {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    bills: bills.slice(start, end),
    totalCount: bills.length,
  }
}

export async function searchBills(query: string): Promise<Bill[]> {
  return bills.filter(bill => 
    bill.title.toLowerCase().includes(query.toLowerCase()) ||
    bill.description.toLowerCase().includes(query.toLowerCase())
  )
}

export async function getBill(id: number): Promise<Bill | undefined> {
  return bills.find(bill => bill.bill_id === id)
}

export async function getSponsors(id: number): Promise<Sponsor[]> {
  return sponsors[id] || []
}

export async function getRollCalls(id: number): Promise<RollCall[]> {
  return rollCalls[id] || []
}

