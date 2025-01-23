interface EnvConfig {
    legiscanDbUrl: string;
    openaiApiKey: string;
    openaiBaseUrl: string;
    openaiModel: string;
    openaiContextWindow: number;
}

export function validateConfig(): EnvConfig {
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

    return {
        legiscanDbUrl: requiredEnvVars.legiscanDbUrl!,
        openaiApiKey: requiredEnvVars.openaiApiKey!,
        openaiBaseUrl: requiredEnvVars.openaiBaseUrl!,
        openaiModel: requiredEnvVars.openaiModel!,
        openaiContextWindow: contextWindow,
    };
} 