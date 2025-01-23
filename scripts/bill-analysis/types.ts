// Types for bill analysis worker
export interface Bill {
    bill_id: number;
    description: string;
    bill_type_id: number;
    change_hash: string;
    status: string;
    session_year_start: string;
    session_year_end: string;
    state: string;
    sponsors: Array<{
        people_id: string;
        party: string;
        type: string;
    }>;
    subjects: string[];
    amendments: Array<{
        amendment_id: string;
        title: string;
        description: string;
        adopted: boolean;
    }>;
    full_texts: Array<{
        date: Date;
        name: string;
        content_url: string;
    }>;
}

export interface BillTokenEstimate {
    descriptionTokens: number;
    sponsorsCount: number;
    subjectsCount: number;
    amendmentsCount: number;
}

export interface BatchMetrics {
    processingTime?: number;
    tokenCount?: number;
    error?: string;
}

// Database state enums
export type AnalysisState = 'pending' | 'completed' | 'skipped' | 'error';
export type BatchState = 'running' | 'completed' | 'failed';
export type ProcessingState = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'; 