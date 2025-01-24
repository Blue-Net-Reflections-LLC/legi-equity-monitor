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
        console.log(`Starting mass bill analysis with batch size: ${envConfig.openaiMaxBatchSize}`);
        console.log(`Using model: ${envConfig.openaiModel}`);

        let processed = 0;
        let hasMore = true;

        while (hasMore) {
            const bills = await getBillsForAnalysis(sql, envConfig.openaiMaxBatchSize);
            if (bills.length === 0) {
                hasMore = false;
                continue;
            }

            console.log(`Processing batch of ${bills.length} bills (Total processed: ${processed})`);
            
            const processor = new BatchProcessor(sql, openai, envConfig.openaiModel);
            await processor.processBatch(bills);
            processed += bills.length;

            // Add delay between batches to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`Completed processing ${processed} bills`);
        
    } catch (error) {
        console.error('Error in mass bill analysis:', error);
        
        // Update status of all pending bills to failed
        await sql`
            UPDATE bill_analysis_status
            SET analysis_state = 'failed'::analysis_state_enum
            WHERE analysis_state = 'pending'::analysis_state_enum
        `;
        
        process.exit(1);
    } finally {
        await sql.end();
    }
}

processAllBills(); 