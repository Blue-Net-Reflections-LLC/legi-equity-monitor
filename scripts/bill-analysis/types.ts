// Enum types matching database
export type BatchState = 'running' | 'completed' | 'failed';
export type ProcessingState = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
export type AnalysisState = 'pending' | 'completed' | 'skipped' | 'error';

// Input types
export interface Bill {
    id: number;
    bill_number: string;
    title: string;
    state_abbr: string;
    
    // Optional legacy fields - these can be populated by more detailed queries
    bill_type_id?: number;
    description?: string;
    change_hash?: string;
    status?: number;
    session_year_start?: number;
    session_year_end?: number;
    state?: string;
    sponsors?: Array<{
        people_id: number;
        party: string;
        type: 'Primary Sponsor' | 'Co-Sponsor';
    }>;
    subjects?: string[];
    amendments?: Array<{
        amendment_id: number;
        title: string;
        description: string;
        adopted: boolean;
    }>;
    full_texts?: Array<{
        date: string;
        name: string;
        content_url: string;
    }>;
}

// Analysis result types matching database schema
export interface BillAnalysis {
    bill_id: string;
    overall_analysis: {
        bias_score: number;
        positive_impact_score: number;
        confidence: 'High' | 'Medium' | 'Low';
    };
    demographic_categories: DemographicCategory[];
}

export interface DemographicCategory {
    category: 'race' | 'religion' | 'gender' | 'age' | 'disability' | 'socioeconomic';
    bias_score: number;
    positive_impact_score: number;
    subgroups: Subgroup[];
}

export interface Subgroup {
    code: string;
    bias_score: number;
    positive_impact_score: number;
    evidence: string;
}

export interface BatchMetrics {
    processingTime?: number;
    tokenCount?: number;
    error?: string;
}

export interface AnalysisResult {
    analyses: BillAnalysis[];
    tokenCount: number;
}

export interface BillTokenEstimate {
    descriptionTokens: number;
    sponsorsCount: number;
    subjectsCount: number;
    amendmentsCount: number;
} 