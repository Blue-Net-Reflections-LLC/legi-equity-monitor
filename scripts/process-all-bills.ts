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
        let succeeded = 0;
        let failed = 0;
        let hasMore = true;

        while (hasMore) {
            try {
                const bills = await getBillsForAnalysis(sql, envConfig.openaiMaxBatchSize);
                if (bills.length === 0) {
                    hasMore = false;
                    continue;
                }

                console.log(`Processing batch of ${bills.length} bills (Total processed: ${processed})`);
                
                const processor = new BatchProcessor(sql, openai, envConfig.openaiModel);
                await processor.processBatch(bills);
                processed += bills.length;
                succeeded += bills.length;

                // Add delay between batches to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (batchError) {
                const billCount = batchError.bills?.length || envConfig.openaiMaxBatchSize;
                processed += billCount;
                failed += billCount;
                
                console.error(`Error processing batch: ${batchError.message}`);
                
                // Mark only this batch's bills as failed if we have their IDs
                if (batchError.bills && batchError.bills.length > 0) {
                    const billIds = batchError.bills.map(b => b.id);
                    await sql`
                        UPDATE bill_analysis_status
                        SET analysis_state = 'failed'::analysis_state_enum
                        WHERE bill_id IN ${sql(billIds)}
                    `;
                }
                
                // Continue with next batch despite error
                console.log(`Continuing with next batch...`);
            }
        }

        console.log(`Completed processing ${processed} bills (${succeeded} succeeded, ${failed} failed)`);
        
    } catch (error) {
        console.error('Fatal error in mass bill analysis:', error);
        // Don't exit, but do update any remaining pending bills to failed
        await sql`
            UPDATE bill_analysis_status
            SET analysis_state = 'failed'::analysis_state_enum
            WHERE analysis_state = 'pending'::analysis_state_enum
        `;
    } finally {
        await sql.end();
    }
}

processAllBills(); 