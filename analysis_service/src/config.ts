import { config } from 'dotenv';
import path from 'path';

type ResponseFormat = { type: 'json_object' };

// Default values
const DEFAULT_CONTEXT_WINDOW = 128_000;  // 128K tokens default context window

// Load environment variables with priority
// 1. .env.local (for local overrides)
// 2. .env (for defaults)
const envFiles = ['.env.local', '.env'];

for (const file of envFiles) {
    config({
        path: path.resolve(process.cwd(), file),
        override: true  // Later files override earlier ones
    });
}

// Log which env file was loaded
if (process.env.NODE_ENV !== 'production') {
    const loadedFile = envFiles.find(file => {
        try {
            return require('fs').existsSync(path.join(process.cwd(), file));
        } catch {
            return false;
        }
    });
    console.log(`Loaded environment from: ${loadedFile || 'process.env'}`);
}

export const Config = {
    database: {
        url: process.env.LEGISCAN_DB_URL,
        batchSize: parseInt(process.env.BATCH_SIZE || '10')
    },
    llm: {
        apiKey: process.env.CLUSTERS_ANALYSIS_OPENAI_API_KEY,
        baseUrl: process.env.CLUSTERS_ANALYSIS_OPENAI_BASE_URL,
        model: process.env.CLUSTERS_ANALYSIS_OPENAI_MODEL,
        apiVersion: process.env.CLUSTERS_ANALYSIS_OPENAI_API_VERSION || 'v1',
        maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
        maxBillsPerCluster: parseInt(process.env.MAX_BILLS_PER_CLUSTER || '250'),
        settings: {
            temperature: 0.3,
            maxOutputTokens: parseInt(process.env.CLUSTERS_MAX_OUTPUT_TOKENS || '8000'),  // Maximum tokens in the response
            maxInputTokens: parseInt(process.env.CLUSTERS_MAX_INPUT_TOKENS || DEFAULT_CONTEXT_WINDOW.toString()),
            topP: 0.8,
            frequencyPenalty: 0.3,
            presencePenalty: 0.3,
            responseFormat: process.env.CLUSTERS_RESPONSE_FORMAT === 'json' ? { type: 'json_object' } as ResponseFormat : undefined
        }
    },
    validation: {
        requiredListLength: {
            min: 3,
            max: 5
        }
    }
};

// Validate required configuration
export function validateConfig() {
    const required = [
        ['Database URL', Config.database.url],
        ['LLM API Key', Config.llm.apiKey],
        ['LLM Base URL', Config.llm.baseUrl],
        ['LLM Model', Config.llm.model]
    ];

    const missing = required.filter(([_, value]) => !value);
    if (missing.length > 0) {
        throw new Error(
            'Missing required environment variables:\n' +
            missing.map(([name]) => `- ${name}`).join('\n') +
            '\n\nPlease ensure all required variables are set in .env.local'
        );
    }

    // Log configuration in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('Configuration loaded:', {
            database: {
                url: '[MASKED]',  // Hide database credentials
                batchSize: Config.database.batchSize
            },
            llm: {
                apiKey: '[MASKED]',  // Hide API key
                baseUrl: Config.llm.baseUrl,
                model: Config.llm.model,
                maxRetries: Config.llm.maxRetries,
                maxBillsPerCluster: Config.llm.maxBillsPerCluster,
                settings: Config.llm.settings
            }
        });
    }
} 