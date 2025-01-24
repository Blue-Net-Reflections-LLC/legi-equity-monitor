import { config } from 'dotenv';
import path from 'path';

// Load .env.local in development
if (process.env.NODE_ENV !== 'production') {
    config({ path: path.resolve(process.cwd(), '.env.local') });
}

interface EnvConfig {
    legiscanDbUrl: string;
    openaiApiKey: string;
    openaiBaseUrl: string;
    openaiModel: string;
    openaiContextWindow: number;
    openaiMaxBatchSize: number;
    randomOrder: boolean;
}

export function validateConfig(): EnvConfig {
    // Load from either .env.local or system environment variables
    const requiredEnvVars = {
        legiscanDbUrl: process.env.LEGISCAN_DB_URL,
        openaiApiKey: process.env.BILLS_OPENAI_API_KEY,
        openaiBaseUrl: process.env.BILLS_OPENAI_BASE_URL,
        openaiModel: process.env.BILLS_OPENAI_MODEL,
    };

    // Check for missing required variables
    const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Parse and validate context window
    const contextWindow = parseInt(process.env.BILLS_OPENAI_CONTEXT_WINDOW || '128000');
    if (isNaN(contextWindow) || contextWindow <= 0) {
        throw new Error('Invalid BILLS_OPENAI_CONTEXT_WINDOW value');
    }

    // Parse and validate batch size
    const batchSize = parseInt(process.env.BILLS_OPENAI_BATCH_SIZE || '5');
    if (isNaN(batchSize) || batchSize <= 0 || batchSize > 5) {
        throw new Error('BILLS_OPENAI_BATCH_SIZE must be between 1 and 5');
    }

    const randomOrder = process.env.BILLS_RANDOM_ORDER === 'true';

    return {
        legiscanDbUrl: requiredEnvVars.legiscanDbUrl!,
        openaiApiKey: requiredEnvVars.openaiApiKey!,
        openaiBaseUrl: requiredEnvVars.openaiBaseUrl!,
        openaiModel: requiredEnvVars.openaiModel!,
        openaiContextWindow: contextWindow,
        openaiMaxBatchSize: batchSize,
        randomOrder,
    };
} 