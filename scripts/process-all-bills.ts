import { BatchSizeCalculator } from './bill-analysis/batch-calculator';
import { BatchProcessor } from './bill-analysis/batch-processor';
import postgres from 'postgres';
import OpenAI from 'openai';
import { getBillsForAnalysis } from './bill-analysis/db-queries';
import { validateConfig } from './bill-analysis/config';

const envConfig = validateConfig();

async function processAllBills() {
    const sql = postgres(envConfig.legiscanDbUrl);
    const openai = new OpenAI({
        apiKey: envConfig.openaiApiKey,
        baseURL: envConfig.openaiBaseUrl
    });

    try {
        const calculator = new BatchSizeCalculator(envConfig.openaiContextWindow);
        const batchSize = calculator.getQueryLimit();
        
        console.log(`Starting mass bill analysis with batch size: ${batchSize}`);
        console.log(`Using model: ${envConfig.openaiModel}`);

        let processed = 0;
        let hasMore = true;

        while (hasMore) {
            const bills = await getBillsForAnalysis(sql, batchSize);
            if (bills.length === 0) {
                hasMore = false;
                continue;
            }

            console.log(`Processing batch of ${bills.length} bills (Total processed: ${processed})`);
            
            const processor = new BatchProcessor(
                sql, 
                openai, 
                envConfig.openaiModel
            );

            await processor.processBatch(bills);
            processed += bills.length;

            // Add delay between batches to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`Completed processing ${processed} bills`);
        
    } catch (error) {
        console.error('Error in mass bill analysis:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

processAllBills(); 