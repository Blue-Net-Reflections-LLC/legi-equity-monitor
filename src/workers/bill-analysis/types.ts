export interface Bill {
    bill_id: number;
    description: string;
    bill_type_id: number;
    change_hash: string;
    amendments?: Array<{
        title: string;
        description: string;
        adopted: boolean;
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

export type AnalysisState = 'pending' | 'completed' | 'skipped' | 'error';
export type BatchState = 'running' | 'completed' | 'failed';
export type ProcessingState = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'; 