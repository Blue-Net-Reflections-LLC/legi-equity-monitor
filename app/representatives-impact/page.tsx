import { Metadata } from 'next';
import LocationAutocomplete from '@/app/components/address/LocationAutocomplete';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { getStateName } from '@/app/utils/stateUtils';

export const metadata: Metadata = {
  title: 'Your Elected Representatives | Bills Impact',
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

// Calculate impact score (same logic as bill detail page)
function calculateImpact(score: number, isPrimary: boolean) {
  // Get impact type based on score
  const type = score >= 0.6 ? 'positive' : score <= -0.6 ? 'bias' : 'neutral';
  const percentage = Math.round(Math.abs(score) * 100);

  let colorClass = '';
  if (type === 'positive') {
    colorClass = 'text-emerald-500 dark:text-emerald-400';
  } else if (type === 'bias') {
    colorClass = 'text-red-500 dark:text-red-400';
  } else {
    colorClass = 'text-zinc-500 dark:text-zinc-400';
  }

  const Icon = type === 'positive' ? CheckCircle : 
               type === 'bias' ? AlertTriangle : 
               MinusCircle;

  return {
    score: percentage,
    type,
    colorClass,
    Icon,
    sponsorType: isPrimary ? 'Primary Sponsor' : 'Co-Sponsor',
    sponsorClass: isPrimary ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                   'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  };
}

// Calculate overall impact for a representative based on their bills
function calculateOverallImpact(bills: Representative['bills']) {
  if (!bills || bills.length === 0) return { score: 0, type: 'neutral', colorClass: 'text-zinc-500' };
  
  // Calculate average impact score, giving more weight to primary sponsored bills
  const totalImpact = bills.reduce((sum, bill) => {
    const weight = bill.isPrimary ? 2 : 1;
    return sum + (bill.impactScore * weight);
  }, 0);
  
  const totalWeight = bills.reduce((sum, bill) => sum + (bill.isPrimary ? 2 : 1), 0);
  const averageImpact = totalWeight > 0 ? totalImpact / totalWeight : 0;
  
  // Determine impact type
  const type = averageImpact >= 0.6 ? 'positive' : 
               averageImpact <= -0.6 ? 'bias' : 
               'neutral';
               
  const percentage = Math.round(Math.abs(averageImpact) * 100);
  
  let colorClass = '';
  if (type === 'positive') {
    colorClass = 'text-emerald-500 dark:text-emerald-400';
  } else if (type === 'bias') {
    colorClass = 'text-red-500 dark:text-red-400';
  } else {
    colorClass = 'text-zinc-500 dark:text-zinc-400';
  }
  
  const Icon = type === 'positive' ? CheckCircle : 
               type === 'bias' ? AlertTriangle : 
               MinusCircle;
               
  return {
    score: percentage,
    type,
    colorClass,
    Icon
  };
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

    // Get proper state name from state code
    const stateName = getStateName(state);

    // Show results
    return (
      <div className="relative min-h-screen">
        {/* Aurora Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-950 dark:via-indigo-950 dark:to-purple-950 opacity-50 -z-10"></div>
        <div className="absolute inset-0 bg-[url('/images/aurora-grid.svg')] bg-center bg-no-repeat bg-cover opacity-10 dark:opacity-5 -z-10"></div>
        
        <div className="container mx-auto py-12 px-4">
          <h1 className="text-4xl font-bold mb-2 text-center">Your Representatives</h1>
          <p className="text-lg mb-8 text-center text-gray-600 dark:text-gray-300">Democracy in action for {address}</p>
          
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {state && district && (
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">Congressional District</h3>
                <p className="text-lg font-semibold">{stateName}-{district}</p>
              </div>
            )}
            
            {state && stateSenateDistrict && (
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">State Senate District</h3>
                <p className="text-lg font-semibold">{stateName}-{stateSenateDistrict}</p>
              </div>
            )}
            
            {state && stateHouseDistrict && (
              <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">State House District</h3>
                <p className="text-lg font-semibold">{stateName}-{stateHouseDistrict}</p>
              </div>
            )}
          </div>

          {/* Federal Representatives Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">Congress</h2>
            
            {representativesData.representatives && representativesData.representatives.length > 0 ? (
              <div className="space-y-6">
                {representativesData.representatives.map(rep => (
                  <RepresentativeListItem 
                    key={rep.id}
                    representative={rep}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-sm text-center">
                <p>No federal representatives found for your district.</p>
              </div>
            )}
          </section>
          
          {/* State Representatives Section */}
          {stateRepresentativesData.representatives && stateRepresentativesData.representatives.length > 0 && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">{stateName} Representatives</h2>
              
              <div className="space-y-6">
                {stateRepresentativesData.representatives.map(rep => (
                  <RepresentativeListItem 
                    key={rep.id}
                    representative={rep}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Not your district?</h2>
            <LocationAutocomplete formAction="/api/representatives/submit" />
          </div>
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

// Representative List Item Component
function RepresentativeListItem({ representative }: { representative: Representative }) {
  const { 
    id, name, party, state, district, role, office, bills 
  } = representative;
  
  // Calculate overall impact
  const overallImpact = calculateOverallImpact(bills);
  
  // Get party color
  const partyColor = party === 'D' ? 'text-blue-600 dark:text-blue-400' : 
                     party === 'R' ? 'text-red-600 dark:text-red-400' : 
                     'text-gray-600 dark:text-gray-400';
                     
  // Get party name
  const partyName = party === 'D' ? 'Democrat' : 
                    party === 'R' ? 'Republican' : 
                    party;
  
  const OverallImpactIcon = overallImpact.Icon;
  
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Column 1: Bio */}
        <div className="p-6 md:w-1/3 flex flex-col md:border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            {/* Bio image - using a placeholder */}
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex items-center justify-center text-gray-500 dark:text-gray-400">
              <span className="text-2xl font-bold">{name.charAt(0)}</span>
            </div>
            
            {/* Overall impact score */}
            <div className="flex flex-col">
              <div className={`flex items-center ${overallImpact.colorClass}`}>
                {overallImpact.Icon && <overallImpact.Icon className="h-5 w-5 mr-1" />}
                <span className="font-semibold">{overallImpact.score}% {overallImpact.type.charAt(0).toUpperCase() + overallImpact.type.slice(1)}</span>
              </div>
              <span className={`text-sm ${partyColor}`}>{partyName}</span>
            </div>
          </div>
          
          {/* Name and district */}
          <Link href={`/representative/${id}`} className="text-xl font-bold hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {name}
          </Link>
          
          <div className="mt-2 text-gray-600 dark:text-gray-400">
            <div>{role}</div>
            <div>{office}</div>
            <div className="font-medium">
              District: {district === "Senate" ? "Statewide" : district}
            </div>
          </div>
        </div>
        
        {/* Column 2: Bills */}
        <div className="p-6 md:w-2/3 bg-gray-50 dark:bg-zinc-900/50">
          <h3 className="text-lg font-semibold mb-3">Top Impact Bills</h3>
          
          {bills && bills.length > 0 ? (
            <div className="space-y-4">
              {bills.map(bill => {
                const impact = calculateImpact(bill.impactScore, bill.isPrimary);
                const ImpactIcon = impact.Icon;
                
                return (
                  <div key={bill.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                    <Link href={`/bill/${bill.id}`} className="font-medium line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {bill.title}
                    </Link>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${impact.sponsorClass}`}>
                        {impact.sponsorType}
                      </span>
                      
                      <div className={`flex items-center text-sm ${impact.colorClass}`}>
                        <ImpactIcon className="h-4 w-4 mr-1" />
                        <span>{impact.score}% {impact.type.charAt(0).toUpperCase() + impact.type.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No bills available</p>
          )}
        </div>
      </div>
    </div>
  );
} 