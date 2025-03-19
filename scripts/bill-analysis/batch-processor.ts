import postgres from 'postgres';
import { v4 as uuid } from 'uuid';
import { Bill, BatchMetrics, ProcessingState, AnalysisResult } from './types';
import OpenAI from 'openai';

export class BatchProcessor {
    private readonly minBatchSize = 1;

    constructor(
        private readonly sql: postgres.Sql,
        private readonly openai: OpenAI,
        private readonly model: string
    ) {}

    async processBatch(bills: Bill[]): Promise<void> {
        const batchId = uuid();

        try {
            // Initialize batch progress
            await this.initializeBatch(batchId, bills);

            // Process all bills in one call
            try {
                const result = await this.analyzeBills(bills);
                const processingTime = Date.now();

                // Store results for each bill
                for (const analysis of result.analyses) {
                    const billId = analysis.bill_id;
                    await this.storeBillAnalysis(billId, {
                        analyses: [analysis],
                        tokenCount: Math.floor(result.tokenCount / bills.length)
                    });
                    await this.updateBillProgress(batchId, billId, 'completed', {
                        processingTime: Date.now() - processingTime,
                        tokenCount: Math.floor(result.tokenCount / bills.length)
                    });
                }
            } catch (error) {
                console.error('Batch analysis error:', error);
                // Batch update all bills as failed
                await this.sql`
                    UPDATE bill_analysis_batch_items
                    SET processing_state = 'failed',
                        attempt_count = attempt_count + 1,
                        updated_at = NOW(),
                        last_error = ${error instanceof Error ? error.message : 'Unknown error'}
                    WHERE batch_id = ${batchId}
                `;
                throw error;
            }

            await this.completeBatch(batchId);
            return; // Continue with next batch

        } catch (error) {
            console.error('Batch processing error:', error);
            await this.handleBatchError(batchId, bills, error);
        }
    }

    private async initializeBatch(batchId: string, bills: Bill[]): Promise<void> {
        // Prepare arrays with non-null values for SQL
        console.log('Initializing batch with bills:', bills.length);
        const billIds = bills.map(b => Number(b.id));
        const changeHashes = bills.map(b => b.change_hash || ''); // Provide empty string as default
        console.log('billIds2', billIds);
        await this.sql.begin(async (sql) => {
            // Batch insert/update analysis status records
            await sql`
                WITH bill_data AS (
                    SELECT 
                        unnest(${sql.array(billIds)}::int[]) as bill_id,
                        unnest(${sql.array(changeHashes)}::text[]) as change_hash
                )
                INSERT INTO bill_analysis_status (
                    bill_id, 
                    current_change_hash,
                    analysis_state
                ) 
                SELECT 
                    bill_id,
                    change_hash,
                    'pending'::analysis_state_enum
                FROM bill_data
                ON CONFLICT (bill_id) DO UPDATE 
                SET current_change_hash = EXCLUDED.current_change_hash,
                    analysis_state = EXCLUDED.analysis_state
            `;
            console.log('billIds3', billIds);
            // Create batch progress record
            await sql`
                INSERT INTO bill_analysis_progress (
                    batch_id, start_time, total_bills, batch_state
                ) VALUES (
                    ${batchId}, NOW(), ${bills.length}, 'running'
                )
            `;
            console.log('billIds4', billIds);

            // Batch insert batch items
            await sql`
                INSERT INTO bill_analysis_batch_items (
                    batch_id, bill_id, processing_state
                ) 
                SELECT 
                    ${batchId},
                    bill_id,
                    'pending'
                FROM unnest(${sql.array(billIds)}::int[]) AS t(bill_id)
            `;
        });
    }

    private async updateBillProgress(
        batchId: string,
        billId: number,
        state: ProcessingState,
        metrics?: BatchMetrics
    ): Promise<void> {
        const processingTime = metrics?.processingTime ?? null;
        const tokenCount = metrics?.tokenCount ?? null;
        const error = metrics?.error ?? null;

        await this.sql`
            UPDATE bill_analysis_batch_items
            SET 
                processing_state = ${state}::processing_state_enum,
                attempt_count = attempt_count + 1,
                updated_at = NOW(),
                processing_time = ${processingTime},
                token_count = ${tokenCount},
                last_error = ${error}
            WHERE batch_id = ${batchId} 
            AND bill_id = ${billId}
        `;
    }

    private async analyzeBills(bills: Bill[]) {
        // Format bills data according to established structure
        const inputs = bills.map(bill => ({
            bill_id: bill.id.toString(),
            title: bill.title,
            status: bill.status,
            session_year_start: bill.session_year_start,
            session_year_end: bill.session_year_end,
            state: bill.state,
            description: bill.description,
            sponsors: bill.sponsors,
            subjects: bill.subjects,
            amendments: bill.amendments,
            full_texts: bill.full_texts
        }));

        const systemMessage = `You are an expert policy analyst. Your task is to analyze legislative bills for their potential impacts on different demographic groups.
Focus on the semantic content and logical implications of the bill's language and provisions.
Analyze how the bill's specific mechanisms, requirements, and implementations might affect different populations.
Base your analysis on the actual text and provisions, not historical patterns or assumptions.
Be thorough, objective, and evidence-based, citing specific sections and language from the bill.

CRITICAL: You must respond with ONLY the JSON data. Do not include any markdown, explanation, or additional text.
The response must exactly match this structure, using these specific categories and their corresponding subgroup codes:

IMPORTANT: Each bill should be analyzed for ALL relevant categories and their subgroups. A bill may impact multiple categories and multiple subgroups within each category. Do not omit categories that are impacted.

Categories and Their Subgroups:

1. race:
   - BH: Black/African American
   - AP: Asian/Pacific Islander
   - LX: Latinx
   - WH: White
   - IN: Indigenous/Native American

2. religion:
   - MU: Muslim
   - CH: Christian
   - JW: Jewish
   - HI: Hindu
   - BD: Buddhist
   - SK: Sikh
   - AT: Atheist/Agnostic

3. gender:
   - ML: Male
   - FM: Female
   - TG: Transgender
   - NB: Nonbinary
   - GQ: Genderqueer

4. age:
   - CY: Children and Youth
   - AD: Adults
   - OA: Older Adults

5. disability:
   - PD: Physical Disabilities
   - MH: Mental Health Challenges
   - DD: Developmental Disabilities

6. veterans:
   - VT: Veterans
   - DV: Disabled Veterans
   - RM: Retired Military Personnel

Example of multiple category/subgroup analysis:
- An education bill might affect both "age" (CY: Children and Youth) and "disability" (MH: Mental Health, DD: Developmental Disabilities)
- A healthcare bill might affect "veterans" (DV: Disabled Veterans) and "age" (OA: Older Adults)
- A civil rights bill might affect multiple subgroups across "race", "religion", and "gender" categories

Response Structure:
{
    "analyses": [
        {
            "bill_id": string,
            "overall_analysis": {
                "bias_score": number (0-1),
                "positive_impact_score": number (0-1),
                "confidence": "High" | "Medium" | "Low"
            },
            "demographic_categories": [  // Include ALL impacted categories
                {
                    "category": "race" | "religion" | "gender" | "age" | "disability" | "veterans",
                    "bias_score": number (0-1),
                    "positive_impact_score": number (0-1),
                    "subgroups": [  // Include ALL impacted subgroups
                        {
                            "code": string,  // Use codes from the category lists above
                            "bias_score": number (0-1),
                            "positive_impact_score": number (0-1),
                            "evidence": string
                        }
                    ]
                }
            ]
        }
    ]
}

IMPORTANT:
- Analyze and include ALL relevant categories and subgroups that are impacted
- All number values must be between 0 and 1
- All fields are required
- Response must be pure JSON with no additional text or explanation
- Maintain exact 1:1 correspondence between input bills and output analyses
- Each bill_id in the output must match an input bill_id
- Use only the specified categories and their corresponding subgroup codes
- Each category must use only its defined subgroup codes`;

        const userMessage = `Analyze these bills' potential impact on different demographic groups:

${JSON.stringify(inputs, null, 2)}`;

        const completion = await this.retryOpenAICall([
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
        ]);

        try {
            let content = completion.choices[0].message.content || '';
            
            // Remove any markdown or code block wrapping
            content = content.replace(/^```json\n|\n```$/g, '');  // Remove JSON code blocks
            content = content.replace(/^```\n|\n```$/g, '');      // Remove generic code blocks
            
            const response = JSON.parse(content);
            
            // Validate 1:1 correspondence
            if (!response.analyses || response.analyses.length !== bills.length) {
                throw new Error(`Expected ${bills.length} analyses but got ${response.analyses?.length || 0}`);
            }

            // Validate each bill_id matches
            const mismatches = bills.filter(bill => 
                !response.analyses.find((a: { bill_id: string }) => a.bill_id === bill.id.toString())
            );
            if (mismatches.length > 0) {
                throw new Error(`Missing analyses for bills: ${mismatches.map(b => b.id).join(', ')}`);
            }

            return {
                analyses: response.analyses,
                tokenCount: completion.usage?.total_tokens || 0
            };
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            throw new Error(`Failed to parse or validate LLM response: ${errorMessage}`);
        }
    }

    private async storeBillAnalysis(billId: number, result: AnalysisResult) {
        const analysis = result.analyses[0];

        await this.sql.begin(async (sql) => {
            // Delete old analysis if it exists (in correct order)
            await sql`
                DELETE FROM bill_analysis_subgroup_scores 
                WHERE category_score_id IN (
                    SELECT category_score_id 
                    FROM bill_analysis_category_scores 
                    WHERE analysis_id IN (
                        SELECT analysis_id 
                        FROM bill_analysis_results 
                        WHERE bill_id = ${billId}
                    )
                )
            `;
            await sql`
                DELETE FROM bill_analysis_category_scores 
                WHERE analysis_id IN (
                    SELECT analysis_id 
                    FROM bill_analysis_results 
                    WHERE bill_id = ${billId}
                )
            `;
            await sql`
                DELETE FROM bill_analysis_results 
                WHERE bill_id = ${billId}
            `;

            const [analysisResult] = await sql`
                INSERT INTO bill_analysis_results (
                    bill_id,
                    overall_bias_score,
                    overall_positive_impact_score,
                    confidence,
                    notes
                ) VALUES (
                    ${billId},
                    ${analysis.overall_analysis.bias_score},
                    ${analysis.overall_analysis.positive_impact_score},
                    ${analysis.overall_analysis.confidence},
                    ${JSON.stringify(analysis)}
                )
                RETURNING analysis_id
            `;

            // Store category scores
            for (const category of analysis.demographic_categories) {
                const [categoryResult] = await sql`
                    INSERT INTO bill_analysis_category_scores (
                        analysis_id,
                        category,
                        bias_score,
                        positive_impact_score
                    ) VALUES (
                        ${analysisResult.analysis_id},
                        ${category.category},
                        ${category.bias_score},
                        ${category.positive_impact_score}
                    )
                    RETURNING category_score_id
                `;

                // Store subgroup scores
                for (const subgroup of category.subgroups) {
                    await sql`
                        INSERT INTO bill_analysis_subgroup_scores (
                            category_score_id,
                            subgroup_code,
                            bias_score,
                            positive_impact_score,
                            evidence
                        ) VALUES (
                            ${categoryResult.category_score_id},
                            ${subgroup.code},
                            ${subgroup.bias_score},
                            ${subgroup.positive_impact_score},
                            ${subgroup.evidence}
                        )
                    `;
                }
            }

            // Update analysis status
            await sql`
                UPDATE bill_analysis_status
                SET analysis_state = 'completed',
                    last_analyzed = NOW(),
                    last_change_hash = current_change_hash
                WHERE bill_id = ${billId}
            `;
        });
    }

    private async completeBatch(batchId: string): Promise<void> {
        await this.sql`
            UPDATE bill_analysis_progress
            SET batch_state = 'completed',
                end_time = NOW(),
                processed_bills = (
                    SELECT COUNT(*) 
                    FROM bill_analysis_batch_items 
                    WHERE batch_id = ${batchId} AND processing_state = 'completed'
                ),
                failed_bills = (
                    SELECT COUNT(*) 
                    FROM bill_analysis_batch_items 
                    WHERE batch_id = ${batchId} AND processing_state = 'failed'
                ),
                updated_at = NOW()
            WHERE batch_id = ${batchId}
        `;
    }

    private async handleBatchError(batchId: string, bills: Bill[], error: unknown): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const fullError = error instanceof Error ? error : new Error(errorMessage);

        // Log full error details
        console.error('Fatal batch processing error:');
        console.error('Error message:', errorMessage);
        console.error('Stack trace:', fullError.stack);
        console.error('Batch ID:', batchId);
        console.error('Number of bills affected:', bills.length);

        // Mark all bills as failed
        await this.sql`
            UPDATE bill_analysis_batch_items
            SET processing_state = 'failed',
                attempt_count = attempt_count + 1,
                updated_at = NOW(),
                last_error = ${errorMessage}
            WHERE batch_id = ${batchId}
        `;

        // Update batch status
        await this.sql`
            UPDATE bill_analysis_progress
            SET batch_state = 'failed',
                end_time = NOW(),
                error_message = ${errorMessage}
            WHERE batch_id = ${batchId}
        `;

        // Exit with error
        process.exit(1);
    }

    private async retryOpenAICall(messages: any[], maxRetries = 3) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: this.model,
                    messages,
                    temperature: 0.0,
                    max_tokens: 8192
                });

                // Try parsing the response
                const content = (completion.choices[0].message.content || '')
                    .replace(/^```json\n|\n```$/g, '')
                    .replace(/^```\n|\n```$/g, '');

                JSON.parse(content); // Will throw if invalid JSON
                
                return completion;
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                if (attempt === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
        throw new Error('All retry attempts failed');
    }
} 