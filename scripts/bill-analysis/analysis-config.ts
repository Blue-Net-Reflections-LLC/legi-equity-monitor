export interface AnalysisConfig {
  // Bill selection criteria
  includeAdvancedBills: boolean;
  includeAllHighPotential: boolean;
  includeActiveCommitteeAndBipartisan: boolean;
  includeActiveCommitteeAndSuccessfulSponsor: boolean;
  includeBipartisanAndSuccessfulSponsor: boolean;
  
  // Thresholds
  minimumSponsorSuccessRate: number;
  minimumSponsorBills: number;
  minimumCommitteeActivityScore: number;
  
  // Timing
  recencyWindowDays: number;
}

export const defaultAnalysisConfig: AnalysisConfig = {
  includeAdvancedBills: true,
  includeAllHighPotential: true,
  includeActiveCommitteeAndBipartisan: true,
  includeActiveCommitteeAndSuccessfulSponsor: true,
  includeBipartisanAndSuccessfulSponsor: true,
  
  minimumSponsorSuccessRate: 0.3,
  minimumSponsorBills: 5,
  minimumCommitteeActivityScore: 10,
  
  recencyWindowDays: 30
}; 