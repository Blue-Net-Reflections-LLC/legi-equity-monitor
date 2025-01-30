// @ts-nocheck
import { SearchResult } from '@/app/components/search/SearchDialog'
import { Bill, Sponsor } from '@/app/types'

const generateBills = (): Bill[] => {
  const bills: Bill[] = []
  const states = [
    ['CA', 'California'],
    ['NY', 'New York'],
    ['TX', 'Texas'],
    ['FL', 'Florida'],
    ['IL', 'Illinois']
  ]
  const committees = ['Education', 'Healthcare', 'Environment', 'Finance', 'Transportation']
  const billTypes = ['House Bill', 'Senate Bill', 'Assembly Bill', 'Joint Resolution']
  const bodies = ['House', 'Senate', 'Assembly']

  for (let i = 1; i <= 40; i++) {
    const [stateAbbr, stateName] = states[i % states.length]
    const committee = committees[i % committees.length]
    const billType = billTypes[i % billTypes.length]
    const body = bodies[i % bodies.length]
    const year = 2024
    const billNumber = `${stateAbbr}B ${1000 + i}`

    bills.push({
      bill_id: i,
      bill_number: billNumber,
      title: `${committee} Reform Act of ${year}`,
      description: `A comprehensive bill to improve ${committee.toLowerCase()} standards and accessibility in ${stateName}.`,
      state_abbr: stateAbbr,
      state_name: stateName,
      status_id: (i % 3) + 1,
      status_desc: ['Introduced', 'In Committee', 'Passed'][i % 3],
      status_date: new Date(2024, 0, i % 28 + 1),
      latest_action_date: new Date(2024, 0, i % 28 + 1),
      bill_type_id: (i % billTypes.length) + 1,
      bill_type_name: billType,
      body_id: (i % bodies.length) + 1,
      body_name: body,
      current_body_id: (i % bodies.length) + 1,
      current_body_name: body,
      pending_committee_id: (i % committees.length) + 1,
      pending_committee_name: committee,
      legiscan_url: `https://legiscan.com/bill/${i}`,
      state_url: `https://${stateAbbr.toLowerCase()}.gov/bill/${i}`,
      session_id: 2024,
      session_name: `${year} Regular Session`,
      session_title: `${year} Regular Session`,
      session_year_start: year,
      session_year_end: year,
      created: new Date(2024, 0, 1),
      updated: new Date(2024, 0, i % 28 + 1)
    })
  }
  return bills
}

const generateSponsors = (): Sponsor[] => {
  const sponsors: Sponsor[] = []
  const states = [
    ['CA', 'California'],
    ['NY', 'New York'],
    ['TX', 'Texas'],
    ['FL', 'Florida'],
    ['IL', 'Illinois']
  ]
  const parties = ['Democratic', 'Republican', 'Independent']
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']

  for (let i = 1; i <= 40; i++) {
    const [stateAbbr, stateName] = states[i % states.length]
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    const party = parties[i % parties.length]

    sponsors.push({
      people_id: i,
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      middle_name: '',
      suffix: '',
      nickname: '',
      state_abbr: stateAbbr,
      state_name: stateName,
      party_name: party,
      party_id: (i % parties.length) + 1,
      role_id: (i % 2) + 1,
      photo_url: `https://static.votesmart.org/canphoto/${10000 + i}.jpg`,
      district: `District ${i % 30 + 1}`,
      committee_sponsor_id: 0,
      person_hash: `person${i}hash`,
      created: new Date(2024, 0, 1),
      updated: new Date(2024, 0, i % 28 + 1)
    })
  }
  return sponsors
}

const bills = generateBills()
const sponsors = generateSponsors()

export const MOCK_RESULTS: SearchResult[] = [
  ...bills.map((bill): SearchResult => ({
    type: 'bill',
    similarity: Math.random() * 0.5 + 0.5, // Random similarity between 0.5 and 1.0
    item: bill
  })),
  ...sponsors.map((sponsor): SearchResult => ({
    type: 'sponsor',
    similarity: Math.random() * 0.5 + 0.5, // Random similarity between 0.5 and 1.0
    item: sponsor
  }))
] 