import { Metadata } from 'next';
import LocationAutocomplete from '@/app/components/address/LocationAutocomplete';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Your Representatives Impact | Bills Impact',
  description: 'Find your representatives and see the bills that impact you the most.',
};

// Ensure page is always server-rendered
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RepresentativesImpactPageProps {
  params: {};
  searchParams: { [key: string]: string | string[] | undefined };
}

interface DistrictData {
  state: string;
  district: string;
  stateSenateDistrict?: string;
  stateHouseDistrict?: string;
  error?: string;
}

interface Representative {
  id: string;
  name: string;
  party: string;
  state: string;
  district: string;
  chamber: string;
  role: string;
  office: string;
  phone: string;
  website: string;
  socialMedia: {
    twitter: string;
    facebook: string;
  };
  bills: Array<{
    id: string;
    title: string;
    number: string;
    impactScore: number;
    isPrimary: boolean;
  }>;
}

interface RepresentativesResponse {
  representatives: Representative[];
  error?: string;
}

/**
 * Fetches district information from coordinates
 */
async function getDistrictFromCoordinates(lat: number, lng: number): Promise<DistrictData> {
  try {
    // Construct URL that works whether the env variable is set or not
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const apiUrl = `${baseUrl}/api/location?lat=${lat}&lng=${lng}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { state: '', district: '', error: 'DISTRICT_NOT_FOUND' };
      }
      throw new Error(`Failed to fetch district: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching district:', error);
    return { state: '', district: '', error: 'FETCH_ERROR' };
  }
}

/**
 * Fetches federal representatives data for a district
 */
async function getRepresentatives(state: string, district: string): Promise<RepresentativesResponse> {
  try {
    // This is a placeholder - implement your actual API call here
    // In a real implementation, this would query your database using the SQL described in the spec
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const apiUrl = `${baseUrl}/api/representatives/district?state=${state}&district=${district}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch representatives: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching representatives:', error);
    return { error: 'FETCH_ERROR', representatives: [] };
  }
}

/**
 * Fetches state representatives data for a district
 */
async function getStateRepresentatives(state: string, senateDistrict?: string, houseDistrict?: string): Promise<RepresentativesResponse> {
  try {
    // Skip if no state districts are provided
    if (!senateDistrict && !houseDistrict) {
      return { representatives: [] };
    }
    
    // Construct URL that works whether the env variable is set or not
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('state', state);
    if (senateDistrict) params.append('senateDistrict', senateDistrict);
    if (houseDistrict) params.append('houseDistrict', houseDistrict);
    
    const apiUrl = `${baseUrl}/api/representatives/state?${params.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      next: { revalidate: 0 },
    });

    // Handle 404 gracefully - just return empty array instead of throwing
    if (response.status === 404) {
      console.log(`State representatives endpoint not found: ${apiUrl}`);
      return { representatives: [] };
    }

    if (!response.ok) {
      console.error(`Error fetching state representatives: ${response.status}`);
      return { representatives: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching state representatives:', error);
    // Return empty array instead of error to prevent page from breaking
    return { representatives: [] };
  }
}

export default async function RepresentativesImpactPage(props: RepresentativesImpactPageProps) {
  const searchParams = props.searchParams || {};
  let formData = null;
  
  // Check if we have a form submission
  if (Object.keys(searchParams).length > 0) {
    // Extract data from query parameters
    const address = searchParams.address as string;
    const lat = parseFloat(searchParams.lat as string || '0');
    const lng = parseFloat(searchParams.lng as string || '0');
    
    if (address && !isNaN(lat) && !isNaN(lng)) {
      formData = { address, lat, lng };
    }
  }
  
  // If no form data, show the form
  if (!formData) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Find Your Representatives</h1>
        <p className="mb-6">Enter your zip code to find your representatives and see their impact on legislation.</p>
        <LocationAutocomplete formAction="/api/representatives/submit" />
      </div>
    );
  }
  
  // Process the form data
  try {
    const { address, lat, lng } = formData;
    
    // Fetch district information
    const districtData = await getDistrictFromCoordinates(lat, lng);
    
    if (districtData.error) {
      return (
        <div className="container mx-auto py-8">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {districtData.error === 'DISTRICT_NOT_FOUND' 
                ? "We couldn't determine your district from this zip code. Please try another zip code."
                : "An error occurred while retrieving district information. Please try again later."}
            </AlertDescription>
          </Alert>
          <LocationAutocomplete formAction="/api/representatives/submit" />
        </div>
      );
    }

    // Fetch representatives
    const { state, district, stateSenateDistrict, stateHouseDistrict } = districtData;
    
    // Federal representatives
    let representativesData: RepresentativesResponse = { representatives: [] };
    if (state && district) {
      representativesData = await getRepresentatives(state, district);
    }
    
    // State representatives
    let stateRepresentativesData: RepresentativesResponse = { representatives: [] };
    if (state && (stateSenateDistrict || stateHouseDistrict)) {
      stateRepresentativesData = await getStateRepresentatives(state, stateSenateDistrict, stateHouseDistrict);
    }

    // Show results
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">Your Representatives</h1>
        <p className="text-lg mb-6">Based on your address: {address}</p>
        
        <div className="mb-6 space-y-2">
          {state && district && (
            <Alert>
              <AlertDescription>
                Congressional District: {state}-{district}
              </AlertDescription>
            </Alert>
          )}
          
          {state && stateSenateDistrict && (
            <Alert>
              <AlertDescription>
                State Senate District: {state}-{stateSenateDistrict}
              </AlertDescription>
            </Alert>
          )}
          
          {state && stateHouseDistrict && (
            <Alert>
              <AlertDescription>
                State House District: {state}-{stateHouseDistrict}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Tabs defaultValue="federal" className="mb-6">
          <TabsList>
            <TabsTrigger value="federal">Federal</TabsTrigger>
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="local">Local</TabsTrigger>
          </TabsList>
          
          <TabsContent value="federal">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {representativesData.representatives && representativesData.representatives.length > 0 ? (
                representativesData.representatives.map(rep => (
                  <RepresentativeCard 
                    key={rep.id}
                    type="Federal"
                    name={rep.name}
                    party={rep.party}
                    role={rep.role}
                    district={`${rep.state}-${rep.district}`}
                    bills={rep.bills}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <p>No federal representatives found for your district.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="state">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stateRepresentativesData.representatives && stateRepresentativesData.representatives.length > 0 ? (
                stateRepresentativesData.representatives.map(rep => (
                  <RepresentativeCard 
                    key={rep.id}
                    type="State"
                    name={rep.name}
                    party={rep.party}
                    role={rep.role}
                    district={`${rep.state}-${rep.district}`}
                    bills={rep.bills}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <p>No state representatives found for your district.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="local">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <p>Local representatives will be shown here.</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Not your district?</h2>
          <LocationAutocomplete formAction="/api/representatives/submit" />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error processing form data:', error);
    
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>An unexpected error occurred. Please try again.</AlertDescription>
        </Alert>
        <LocationAutocomplete formAction="/api/representatives/submit" />
      </div>
    );
  }
}

// Sample representative card component
function RepresentativeCard({ 
  type, 
  name, 
  party, 
  role, 
  district, 
  bills 
}: { 
  type: string;
  name: string;
  party: string;
  role: string;
  district: string;
  bills: Array<{
    id: string;
    title: string;
    number: string;
    impactScore: number;
    isPrimary: boolean;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          {party} • {role} • {district}
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="font-medium mb-2">Top Impact Bills:</h4>
        <ul className="space-y-2">
          {bills.map(bill => (
            <li key={bill.id} className="text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{bill.title}</div>
                  <div className="text-xs text-muted-foreground">{bill.number}</div>
                </div>
                <div className="ml-2 text-xs px-2 py-1 rounded bg-muted">
                  Impact: {bill.impactScore}
                </div>
              </div>
              <div className="mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${bill.isPrimary ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  {bill.isPrimary ? 'Primary Sponsor' : 'Co-Sponsor'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 