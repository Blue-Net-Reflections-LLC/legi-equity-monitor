import { Metadata } from 'next';
import LocationAutocomplete from '@/app/components/address/LocationAutocomplete';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import Link from 'next/link';
import { AuroraBackground } from '@/app/components/ui/aurora-background';
import { Footer } from '@/app/components/layout/Footer';
import SponsorImage from '@/app/components/sponsor/SponsorImage';
import { STATE_NAMES } from '@/app/constants/states';
import { ImpactScore } from "@/app/components/analysis/ImpactScore";
import { ConfidenceBadge } from "@/app/components/analysis/ConfidenceBadge";

const getStateName = (stateCode: string) => STATE_NAMES[stateCode] || stateCode;

// Map party IDs to party names based on the ls_party table
const PARTY_NAMES: {[key: string]: string} = {
  "1": "Democrat",
  "2": "Republican",
  "3": "Independent",
  "4": "Green",
  "5": "Libertarian",
  "6": "Nonpartisan",
  "7": "Unaffiliated",
  "8": "Reform"
};

// Get party name from party ID
const getPartyName = (partyId: string): string => {
  return PARTY_NAMES[partyId] || partyId;
};

export const metadata: Metadata = {
  title: 'Your Elected Representatives | Bills Impact',
  description: 'Find your representatives and see the bills that impact you the most.',
};

// Ensure page is always server-rendered
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RepresentativesImpactPageProps {
  params: Record<string, unknown>;
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
  votesmart_id?: string;
  bills: Array<{
    id: string;
    title: string;
    number: string;
    positiveScore: number;
    biasScore: number;
    isPrimary: boolean;
    bill_type_id?: number;
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

// Calculate impact score for a bill based on its positive and bias scores
function calculateImpact(positiveScore: number, biasScore: number, isPrimary: boolean) {
  // Check if both scores are below the threshold (0.6)
  if (positiveScore < 0.6 && biasScore < 0.6) {
    return {
      score: Math.round(Math.max(positiveScore, biasScore) * 100),
      type: 'neutral',
      colorClass: 'text-zinc-500 dark:text-zinc-400',
      Icon: MinusCircle,
      sponsorType: isPrimary ? 'Primary Sponsor' : 'Co-Sponsor',
      sponsorClass: isPrimary ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : 
                   'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
  }

  // Determine which score is higher
  const isPositive = positiveScore >= biasScore;
  const score = isPositive ? positiveScore : biasScore;
  const type = isPositive ? 'positive' : 'bias';
  const percentage = Math.round(score * 100);

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
    sponsorClass: isPrimary ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : 
                   'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };
}

// Calculate overall impact for a representative based on their bills
function calculateOverallImpact(bills: Representative['bills']) {
  if (!bills || bills.length === 0) return { score: 0, type: 'neutral', colorClass: 'text-zinc-500', Icon: MinusCircle };
  
  // Calculate average impact scores, giving more weight to primary sponsored bills
  let totalPositive = 0;
  let totalBias = 0;
  let totalWeight = 0;
  
  bills.forEach(bill => {
    const weight = bill.isPrimary ? 2 : 1;
    totalPositive += bill.positiveScore * weight;
    totalBias += bill.biasScore * weight;
    totalWeight += weight;
  });
  
  const avgPositiveScore = totalWeight > 0 ? totalPositive / totalWeight : 0;
  const avgBiasScore = totalWeight > 0 ? totalBias / totalWeight : 0;
  
  // If both scores are below threshold, return neutral
  if (avgPositiveScore < 0.6 && avgBiasScore < 0.6) {
    return {
      score: Math.round(Math.max(avgPositiveScore, avgBiasScore) * 100),
      type: 'neutral',
      colorClass: 'text-zinc-500 dark:text-zinc-400',
      Icon: MinusCircle
    };
  }
  
  // Determine which score is higher
  const isPositive = avgPositiveScore >= avgBiasScore;
  const score = isPositive ? avgPositiveScore : avgBiasScore;
  const type = isPositive ? 'positive' : 'bias';
  
  const percentage = Math.round(score * 100);
  
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
      <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
        {/* Hero Section */}
        <section className="h-[30vh] relative">
          <AuroraBackground>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white text-center">
                Find Your Representatives
              </h1>
              <p className="text-lg mt-4 text-zinc-700 dark:text-zinc-300 text-center">
                Enter your zip code to find your representatives and see their impact on legislation.
              </p>
            </div>
          </AuroraBackground>
        </section>
        
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Enter your zip code</h2>
            <p className="mb-6 text-zinc-700 dark:text-zinc-300">
              We&apos;ll use your location to find your federal and state representatives and show you the bills they&apos;ve sponsored.
            </p>
            <LocationAutocomplete formAction="/api/representatives/submit" />
          </div>
        </div>
        <Footer />
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
        <div className="container mx-auto py-8 text-zinc-900 dark:text-white">
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
      <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
        {/* Hero Section */}
        <section className="h-[30vh] relative">
          <AuroraBackground>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white text-center">
                Your Representatives
              </h1>
              <p className="text-lg mt-4 text-zinc-700 dark:text-zinc-300 text-center">
                Democracy in action for {address}
              </p>
            </div>
          </AuroraBackground>
        </section>
        
        <div className="max-w-7xl mx-auto px-4 ">

          {/* Federal Representatives Section */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-zinc-900 dark:text-white">Congress</h2>
            
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
              <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-zinc-900 dark:text-white">{stateName} Representatives</h2>
              
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
            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">Not your district?</h2>
            <LocationAutocomplete formAction="/api/representatives/submit" />
          </div>
        </div>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error processing form data:', error);
    
    return (
      <div className="container mx-auto py-8 text-zinc-900 dark:text-white">
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
    id, name, party, state, district, role, office, bills, votesmart_id, 
  } = representative;
  
  // Filter bills to only show type 1
  const filteredBills = bills.filter(bill => bill.bill_type_id === undefined || bill.bill_type_id === 1);
  
  // Calculate overall impact based on filtered bills
  const overallImpact = calculateOverallImpact(filteredBills);
  
  // Get party name and color
  const partyName = getPartyName(party);
  
  // Determine if this is a federal representative (for bill links)
  const isFederal = office === "U.S. House of Representatives" || office === "U.S. Senate";
  
  // Convert legacy score format to ImpactScore format
  const positiveScore = overallImpact.type === 'positive' ? overallImpact.score / 100 : 0;
  const biasScore = overallImpact.type === 'bias' ? overallImpact.score / 100 : 0;
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm overflow-hidden text-zinc-900 dark:text-white">
      <div className="flex flex-col md:flex-row">
        {/* Column 1: Bio */}
        <div className="p-6 md:w-1/3 flex flex-col md:border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            {/* Bio image - using SponsorImage component with votesmart_id */}
            <div className="relative w-24 h-32 rounded-md overflow-hidden mb-3 md:mb-0">
              <SponsorImage 
                votesmartId={votesmart_id || null} 
                name={name} 
              />
            </div>
            
            {/* Overall impact score */}
            <div className="flex flex-col">
              <ImpactScore
                positiveScore={positiveScore}
                biasScore={biasScore}
              />
            </div>
          </div>
          
          {/* Name and district */}
          <Link href={`/sponsor/${id}`} className="text-xl font-bold hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            {name}
          </Link>
          
          {/* Party badge - moved here */}
          <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full w-fit ${
            Number(party) === 1 
              ? "bg-blue-500 text-white dark:bg-blue-600 dark:text-white" 
              : Number(party) === 2 
                ? "bg-red-500 text-white dark:bg-red-600 dark:text-white" 
                : "bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
          }`}>
            {partyName}
          </span>
          
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
          
          {filteredBills && filteredBills.length > 0 ? (
            <div className="space-y-4">
              {filteredBills.map(bill => {
                const impact = calculateImpact(bill.positiveScore, bill.biasScore, bill.isPrimary);
                const ImpactIcon = impact.Icon;
                
                // Use "us" for federal representatives, state code for state representatives
                const stateCode = isFederal ? "us" : state.toLowerCase();
                
                return (
                  <div key={bill.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0 last:pb-0">
                    <Link href={`/${stateCode}/bill/${bill.id}`} className="font-medium line-clamp-2 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                      {bill.title}
                    </Link>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full ${impact.sponsorClass}`}>
                        {impact.sponsorType}
                      </span>
                      
                      <div className={`flex items-center text-sm ${impact.colorClass}`}>
                        <ImpactIcon className="h-4 w-4 mr-1" />
                        <span>
                          {impact.type === 'neutral' ? 'Neutral' : `${impact.score}% ${impact.type.charAt(0).toUpperCase() + impact.type.slice(1)}`}
                        </span>
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