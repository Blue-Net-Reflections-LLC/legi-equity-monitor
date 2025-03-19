import { BatchProcessor } from './bill-analysis/batch-processor';
import postgres from 'postgres';
import OpenAI from 'openai';
import { getBillsForAnalysis } from './bill-analysis/db-queries';
import { validateConfig } from './bill-analysis/config';

const envConfig = validateConfig();

// Define the expected error structure to fix TypeScript errors
interface BatchError extends Error {
    bills?: Array<{id: number}>;
}

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
            } catch (error: unknown) {
                // Type guard for the error
                const batchError = error as BatchError;
                
                // Get the bills count from the error if available
                const billCount = batchError.bills?.length || envConfig.openaiMaxBatchSize;
                processed += billCount;
                failed += billCount;
                
                console.error(`Error processing batch: ${batchError.message || 'Unknown error'}`);
                
                // Mark only this batch's bills as failed if we have their IDs
                try {
                    if (batchError.bills && batchError.bills.length > 0) {
                        const billIds = batchError.bills.map(b => Number(b.id));
                        await sql`
                            UPDATE bill_analysis_status
                            SET analysis_state = 'failed'::analysis_state_enum
                            WHERE bill_id = ANY(${sql.array(billIds)})
                        `;
                    }
                } catch (dbError) {
                    console.error('Failed to update bill status in database:', dbError);
                }
                
                // Continue with next batch despite error
                console.log(`Continuing with next batch...`);
            }
        }

        console.log(`Completed processing ${processed} bills (${succeeded} succeeded, ${failed} failed)`);
        
    } catch (error) {
        // Handle any unexpected error without exiting
        console.error('Error in mass bill analysis:', error);
        
        try {
            // Try to update pending bills to failed, but don't exit if this fails
            await sql`
                UPDATE bill_analysis_status
                SET analysis_state = 'failed'::analysis_state_enum
                WHERE analysis_state = 'pending'::analysis_state_enum
            `;
        } catch (dbError) {
            console.error('Failed to update pending bills to failed state:', dbError);
        }
    } finally {
        // Ensure SQL connection is closed even if errors occur
        try {
            await sql.end();
        } catch (closeError) {
            console.error('Error closing database connection:', closeError);
        }
    }
}

// Don't exit on unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
    // Don't throw, just log the error
});

processAllBills().then(() => {
    console.log('Process all bills completed.');
}).catch(err => {
    console.error('Error in processAllBills:', err);
    // Don't exit here either
}); 