export type ImpactType = 'POSITIVE' | 'BIAS' | 'NEUTRAL';
export type PartyType = 'ALL' | 'D' | 'R' | 'I';
export type SupportType = 'ALL' | 'HAS_SUPPORT' | 'NO_SUPPORT';

export interface CategoryImpact {
  type: ImpactType;
  selected: boolean;
}

export interface CategoryFilter {
  id: string;
  name: string;
  selected: boolean;
  impactTypes: CategoryImpact[];
}

export interface BillFilters {
  impacts: CategoryImpact[];
  categories: CategoryFilter[];
  demographics: string[];
  party: PartyType;
  committees: Array<{ id: number; name: string; selected: boolean }>;
  support: SupportType;
} 