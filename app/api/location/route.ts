import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts congressional district information from Census API response
 */
function extractDistrictData(censusData: any): { 
  state: string;
  district: string;
  stateSenateDistrict?: string;
  stateHouseDistrict?: string;
  error?: string;
} {
  try {
    // Debug log the actual response
    console.log("Census API response:", JSON.stringify(censusData, null, 2));
    
    // Check if we have valid geographies data
    if (!censusData?.result?.geographies) {
      console.log("No geographies found in Census response");
      return { state: "", district: "", error: "NO_MATCH" };
    }
    
    // Log keys to see what's available
    console.log("Geography keys:", Object.keys(censusData.result.geographies));
    
    // Extract all relevant district data
    const geos = censusData.result.geographies;
    const result: any = { 
      state: "",
      district: ""
    };
    
    // Get state information first
    if (geos["States"] && geos["States"][0]) {
      result.state = geos["States"][0].STATE;
    }
    
    // Extract federal congressional district data
    // Note: The key might be "119th Congressional Districts" or similar depending on the current Congress
    const congressionalKey = Object.keys(geos).find(key => key.includes("Congressional Districts"));
    if (congressionalKey && geos[congressionalKey] && geos[congressionalKey][0]) {
      const congressionalData = geos[congressionalKey][0];
      result.state = congressionalData.STATE;
      result.district = congressionalData.BASENAME;
    } else {
      console.warn("Congressional district data not found");
    }
    
    // Extract state senate district data (upper chamber)
    const stateUpperKey = Object.keys(geos).find(key => key.includes("State Legislative Districts - Upper"));
    if (stateUpperKey && geos[stateUpperKey] && geos[stateUpperKey][0]) {
      result.stateSenateDistrict = geos[stateUpperKey][0].BASENAME;
    }
    
    // Extract state house district data (lower chamber)
    const stateLowerKey = Object.keys(geos).find(key => key.includes("State Legislative Districts - Lower"));
    if (stateLowerKey && geos[stateLowerKey] && geos[stateLowerKey][0]) {
      result.stateHouseDistrict = geos[stateLowerKey][0].BASENAME;
    }
    
    // Check if we found any district information
    if (!result.district && !result.stateSenateDistrict && !result.stateHouseDistrict) {
      return { state: result.state || "", district: "", error: "NO_DISTRICT" };
    }
    
    return result;
  } catch (error) {
    console.error("Error extracting district data:", error);
    return { state: "", district: "", error: "PARSE_ERROR" };
  }
}

/**
 * API endpoint to get district information from coordinates
 * @param req - The request object
 * @returns - JSON response with district information
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Extract coordinates from query parameters
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  
  // Validate coordinates
  if (!lat || !lng || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
    return NextResponse.json(
      { error: "INVALID_COORDINATES" },
      { status: 400 }
    );
  }
  
  try {
    // Construct Census API URL for reverse geocoding
    const censusUrl = new URL("https://geocoding.geo.census.gov/geocoder/geographies/coordinates");
    censusUrl.searchParams.append("x", lng);
    censusUrl.searchParams.append("y", lat);
    censusUrl.searchParams.append("benchmark", "2020");
    censusUrl.searchParams.append("vintage", "2020");
    censusUrl.searchParams.append("layers", "all");
    censusUrl.searchParams.append("format", "json");
    
    // Fetch district data from Census API
    const response = await fetch(censusUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    // Check for successful response
    if (!response.ok) {
      console.error(`Census API error: ${response.status}`);
      return NextResponse.json(
        { error: "CENSUS_API_ERROR" },
        { status: 502 }
      );
    }
    
    // Parse and extract district data
    const censusData = await response.json();
    const districtData = extractDistrictData(censusData);
    
    // If we couldn't find district information, return 404
    if (districtData.error === "NO_MATCH" || districtData.error === "NO_DISTRICT") {
      return NextResponse.json(
        { error: "DISTRICT_NOT_FOUND" },
        { status: 404 }
      );
    }
    
    // Return district information
    return NextResponse.json(districtData);
  } catch (error) {
    console.error("Error fetching district data:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}