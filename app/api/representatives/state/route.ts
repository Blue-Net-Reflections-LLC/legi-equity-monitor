import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to get state representatives by district
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Extract parameters from the request
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const senateDistrict = url.searchParams.get('senateDistrict');
  const houseDistrict = url.searchParams.get('houseDistrict');
  
  // Validate required parameters
  if (!state) {
    return NextResponse.json(
      { error: 'State parameter is required' },
      { status: 400 }
    );
  }
  
  // In a production app, you would query your database here
  // For now, we'll return placeholder data
  const representatives = [];
  
  // Add state senate representative if senate district is provided
  if (senateDistrict) {
    representatives.push({
      id: `state-senate-${state}-${senateDistrict}`,
      name: `State Senator for ${state}-${senateDistrict}`,
      party: "Independent",
      state: state,
      district: senateDistrict,
      chamber: "senate",
      role: "State Senator",
      office: "State Capitol Building",
      phone: "(555) 123-4567",
      website: "https://example.state.gov",
      socialMedia: {
        twitter: "statesentwitter",
        facebook: "statesenfacebook"
      },
      bills: [
        { id: 's1', title: 'State Senate Bill 1', number: 'SB123', impactScore: 85, isPrimary: true },
        { id: 's2', title: 'State Senate Bill 2', number: 'SB456', impactScore: 72, isPrimary: false },
      ]
    });
  }
  
  // Add state house representative if house district is provided
  if (houseDistrict) {
    representatives.push({
      id: `state-house-${state}-${houseDistrict}`,
      name: `State Representative for ${state}-${houseDistrict}`,
      party: "Independent",
      state: state,
      district: houseDistrict,
      chamber: "house",
      role: "State Representative",
      office: "State House Building",
      phone: "(555) 987-6543",
      website: "https://example.state.gov/house",
      socialMedia: {
        twitter: "statereptwitter",
        facebook: "staterepfacebook"
      },
      bills: [
        { id: 'h1', title: 'State House Bill 1', number: 'HB123', impactScore: 91, isPrimary: true },
        { id: 'h2', title: 'State House Bill 2', number: 'HB456', impactScore: 68, isPrimary: false },
      ]
    });
  }
  
  return NextResponse.json({ representatives });
}