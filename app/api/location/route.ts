import { NextRequest, NextResponse } from 'next/server';

/**
 * Extracts district data from the Census API response
 */
function extractDistrictData(data: any) {
  try {
    // Check if we have a valid response with geographies
    if (!data?.result?.geographies) {
      console.error('No geographies found in Census API response');
      return { error: 'DISTRICT_NOT_FOUND' };
    }
    
    const geographies = data.result.geographies;
    
    // Get state info
    const states = geographies['States']?.[0];
    if (!states) {
      console.error('No state information found');
      return { error: 'DISTRICT_NOT_FOUND' };
    }
    
    const stateCode = states.STUSAB; // GA, NY, etc.
    
    // Find congressional district - check for any "Congressional Districts" key
    let congressionalDistrict = null;
    let congressionalDistrictNumber = null;
    
    for (const key of Object.keys(geographies)) {
      if (key.includes('Congressional Districts') && geographies[key]?.length > 0) {
        congressionalDistrict = geographies[key][0];
        // Look for CD### field (CD119, CD118, etc.)
        for (const field of Object.keys(congressionalDistrict)) {
          if (field.startsWith('CD') && !isNaN(parseInt(congressionalDistrict[field]))) {
            congressionalDistrictNumber = congressionalDistrict[field];
            break;
          }
        }
        break;
      }
    }
    
    if (!congressionalDistrictNumber) {
      console.error('No congressional district found');
      return { error: 'DISTRICT_NOT_FOUND' };
    }
    
    // Parse district number, handling "00" as at-large districts
    const district = congressionalDistrictNumber === "00" ? "1" : 
                     congressionalDistrictNumber.replace(/^0+/, '');
    
    // Find state senate district
    let stateSenateDistrict = null;
    for (const key of Object.keys(geographies)) {
      if (key.includes('State Legislative Districts - Upper') && geographies[key]?.length > 0) {
        const senateData = geographies[key][0];
        stateSenateDistrict = senateData.SLDU?.replace(/^0+/, '');
        break;
      }
    }
    
    // Find state house district
    let stateHouseDistrict = null;
    for (const key of Object.keys(geographies)) {
      if (key.includes('State Legislative Districts - Lower') && geographies[key]?.length > 0) {
        const houseData = geographies[key][0];
        stateHouseDistrict = houseData.SLDL?.replace(/^0+/, '');
        break;
      }
    }
    
    return {
      state: stateCode,
      district,
      stateSenateDistrict,
      stateHouseDistrict
    };
  } catch (error) {
    console.error('Error extracting district data:', error);
    return { error: 'PARSING_ERROR' };
  }
}

/**
 * GET handler for /api/location endpoint
 */
export async function GET(req: NextRequest) {
  // Extract lat and lng from query parameters
  const url = new URL(req.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');
  
  // Validate parameters
  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'MISSING_PARAMETERS' },
      { status: 400 }
    );
  }
  
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  
  // Validate coordinates
  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return NextResponse.json(
      { error: 'INVALID_COORDINATES' },
      { status: 400 }
    );
  }
  
  try {
    // Construct URL for Census API
    const censusUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${parsedLng}&y=${parsedLat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json`;
    
    console.log('Fetching from Census API:', censusUrl);
    
    // Fetch data from Census API
    const response = await fetch(censusUrl);
    
    // Check if the request was successful
    if (!response.ok) {
      console.error(`Census API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'CENSUS_API_ERROR' },
        { status: 500 }
      );
    }
    
    // Parse the response
    const data = await response.json();
    
    // Extract district information
    const districtData = extractDistrictData(data);
    
    // Return the district information
    return NextResponse.json(districtData);
  } catch (error) {
    console.error('Error fetching district information:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}