import { NextRequest, NextResponse } from 'next/server';

/**
 * Type definition for Census API response
 */
interface CensusApiResponse {
  result?: {
    geographies?: {
      [key: string]: Array<{
        STUSAB?: string;
        BASENAME?: string;
        NAME?: string;
        [key: string]: string | number | boolean | null | undefined;
      }>;
    };
  };
}

/**
 * Extracts district data from the Census API response
 */
function extractDistrictData(data: CensusApiResponse) {
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
    
    // Find congressional district - check for "Congressional Districts" or specific numbered congress
    let congressionalDistrict = null;
    
    // Try all possible congressional district keys
    const possibleKeys = Object.keys(geographies).filter(
      key => key.includes('Congressional') || /\d+th Congressional Districts/.test(key)
    );
    
    console.log('Possible congressional district keys:', possibleKeys);
    
    if (possibleKeys.length > 0) {
      for (const key of possibleKeys) {
        if (geographies[key]?.length > 0) {
          congressionalDistrict = geographies[key][0];
          console.log('Found congressional district data:', congressionalDistrict);
          break;
        }
      }
    }
    
    if (!congressionalDistrict) {
      console.error('No congressional district found');
      return { error: 'DISTRICT_NOT_FOUND' };
    }
    
    // Use BASENAME directly - it contains the district number without session info
    const congressionalDistrictNumber = congressionalDistrict.BASENAME;
    console.log(`Using district number from BASENAME: ${congressionalDistrictNumber}`);
    
    if (!congressionalDistrictNumber) {
      console.error('No BASENAME found in congressional district data');
      return { error: 'DISTRICT_NOT_FOUND' };
    }
    
    // Parse district number, handling "00" as at-large districts
    const district = congressionalDistrictNumber === "00" ? "1" : 
                     congressionalDistrictNumber.replace(/^0+/, '');
    
    console.log(`Final district number: ${district}`);
    
    // Find state senate district
    let stateSenateDistrict = null;
    for (const key of Object.keys(geographies)) {
      if (key.includes('State Legislative Districts - Upper') && geographies[key]?.length > 0) {
        const senateData = geographies[key][0];
        stateSenateDistrict = senateData.BASENAME?.replace(/^0+/, '');
        break;
      }
    }
    
    // Find state house district
    let stateHouseDistrict = null;
    for (const key of Object.keys(geographies)) {
      if (key.includes('State Legislative Districts - Lower') && geographies[key]?.length > 0) {
        const houseData = geographies[key][0];
        stateHouseDistrict = houseData.BASENAME?.replace(/^0+/, '');
        break;
      }
    }
    
    // Get county information
    let county = null;
    if (geographies['Counties']?.length > 0) {
      county = geographies['Counties'][0].NAME;
    }
    
    // Get metropolitan division information
    let metroDivision = null;
    if (geographies['Metropolitan Divisions']?.length > 0) {
      metroDivision = geographies['Metropolitan Divisions'][0].NAME;
    }
    
    return {
      state: stateCode,
      district,
      stateSenateDistrict,
      stateHouseDistrict,
      county,
      metroDivision
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