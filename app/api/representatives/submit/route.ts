import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to handle address form submissions
 * POST /api/representatives/submit
 * 
 * Takes form data with zipCode, lat, and lng fields
 * Redirects to the representatives-impact page with query parameters
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    
    // Extract and validate address/zip code (supporting both for backward compatibility)
    let address = formData.get('zipCode');
    if (!address || typeof address !== 'string' || address.trim() === '') {
      // Fallback to address field if zipCode is not provided
      address = formData.get('address');
      if (!address || typeof address !== 'string' || address.trim() === '') {
        return NextResponse.json({ error: 'Zip code is required' }, { status: 400 });
      }
    }
    
    // Extract and validate coordinates
    const latValue = formData.get('lat');
    const lngValue = formData.get('lng');
    
    if (!latValue || !lngValue) {
      return NextResponse.json({ error: 'Coordinates are required' }, { status: 400 });
    }
    
    const lat = parseFloat(latValue.toString());
    const lng = parseFloat(lngValue.toString());
    
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates format' }, { status: 400 });
    }
    
    // Build the redirect URL with query parameters
    const params = new URLSearchParams({
      address: address.toString(),
      lat: lat.toString(),
      lng: lng.toString()
    });
    
    const redirectUrl = `/representatives-impact?${params.toString()}`;
    
    // Redirect to the results page (303 See Other is correct for form submissions)
    // return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${redirectUrl}`, 303);
  } catch (error) {
    console.error('Error processing form submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 