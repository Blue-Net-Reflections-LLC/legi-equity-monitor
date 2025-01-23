import { config } from 'dotenv';
import { BatchSizeCalculator } from './bill-analysis/batch-calculator';
import { BatchProcessor } from './bill-analysis/batch-processor';
import postgres from 'postgres';
import OpenAI from 'openai';
import { getBillsForAnalysis } from './bill-analysis/db-queries';
import { validateConfig } from './bill-analysis/config';

// Load environment variables
config();

// Validate configuration
const envConfig = validateConfig();

// Initialize services
const sql = postgres(envConfig.legiscanDbUrl);
const openai = new OpenAI({
    apiKey: envConfig.openaiApiKey,
    baseURL: envConfig.openaiBaseUrl
});

async function main() {
    try {
        const calculator = new BatchSizeCalculator(envConfig.openaiContextWindow);
        const batchSize = calculator.getQueryLimit();
        
        console.log(`Starting bill analysis with batch size: ${batchSize}`);
        console.log(`Using model: ${envConfig.openaiModel}`);
        
        const bills = await getBillsForAnalysis(sql, batchSize);
        console.log(`Found ${bills.length} bills to analyze`);

        if (bills.length > 0) {
            const processor = new BatchProcessor(
                sql, 
                openai, 
                batchSize,
                envConfig.openaiModel
            );
            await processor.processBatch(bills);
            console.log('Batch processing completed');
        }
        
    } catch (error) {
        console.error('Error in bill analysis:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main(); 