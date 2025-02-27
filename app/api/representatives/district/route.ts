import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to get representatives for a district
 * This is currently a placeholder that returns mock data - it should be replaced with actual database queries
 * as per lookup-sponsor-zipcode.md specifications
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Extract parameters from query 
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const district = url.searchParams.get("district");
  
  // Validate parameters
  if (!state || !district) {
    return NextResponse.json(
      { error: "MISSING_PARAMETERS" },
      { status: 400 }
    );
  }
  
  try {
    // Return placeholder data for now
    // In a production implementation, this would query the database using the schemas described in lookup-sponsor-zipcode.md
    const mockRepresentatives = [
      {
        id: "1",
        name: `${state} Representative`,
        party: "Independent",
        state: state,
        district: district,
        chamber: "house",
        role: "Representative",
        office: "123 Capitol Hill",
        phone: "(555) 123-4567",
        website: "https://example.gov",
        socialMedia: {
          twitter: "reptwitter",
          facebook: "repfacebook"
        },
        bills: [
          { id: '1', title: 'Sample Bill 1', number: 'HR123', impactScore: 85, isPrimary: true },
          { id: '2', title: 'Sample Bill 2', number: 'HR456', impactScore: 72, isPrimary: false },
        ]
      },
      {
        id: "2",
        name: `${state} Senator`,
        party: "Independent",
        state: state,
        district: "N/A",
        chamber: "senate",
        role: "Senator",
        office: "456 Senate Building",
        phone: "(555) 987-6543",
        website: "https://example.gov/senate",
        socialMedia: {
          twitter: "sentwitter",
          facebook: "senfacebook"
        },
        bills: [
          { id: '3', title: 'Sample Senate Bill', number: 'S123', impactScore: 91, isPrimary: true },
          { id: '4', title: 'Sample Senate Bill 2', number: 'S456', impactScore: 68, isPrimary: false },
        ]
      }
    ];
    
    return NextResponse.json({
      representatives: mockRepresentatives
    });
  } catch (error) {
    console.error("Error processing district representatives request:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
} 