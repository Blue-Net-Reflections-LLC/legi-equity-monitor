import postgres from 'postgres';
import { v4 as uuid } from 'uuid';
import { Bill, BatchMetrics, ProcessingState } from './types';
import OpenAI from 'openai';

export class BatchProcessor {
    private currentBatchSize: number;
    private readonly minBatchSize = 1;
    private successfulBatches = 0;

    constructor(
        private readonly sql: postgres.Sql,
        private readonly openai: OpenAI,
        initialBatchSize: number,
        private readonly model: string
    ) {
        this.currentBatchSize = initialBatchSize;
    }

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
                // Mark all bills as failed
                for (const bill of bills) {
                    await this.updateBillProgress(batchId, bill.bill_id, 'failed', {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            await this.completeBatch(batchId);

        } catch (error) {
            console.error('Batch processing error:', error);
            await this.handleBatchError(batchId, bills, error);
        }
    }

    private async initializeBatch(batchId: string, bills: Bill[]): Promise<void> {
        await this.sql.begin(async (sql) => {
            // Create or update analysis status records
            for (const bill of bills) {
                await sql`
                    INSERT INTO bill_analysis_status (
                        bill_id, 
                        current_change_hash,
                        analysis_state
                    ) 
                    VALUES (
                        ${bill.bill_id}, 
                        ${bill.change_hash},
                        'pending'
                    )
                    ON CONFLICT (bill_id) DO UPDATE 
                    SET current_change_hash = ${bill.change_hash},
                        analysis_state = 'pending'
                `;
            }

            // Rest of initialization...
            await sql`
                INSERT INTO bill_analysis_progress (
                    batch_id, start_time, total_bills, batch_state
                ) VALUES (
                    ${batchId}, NOW(), ${bills.length}, 'running'
                )
            `;

            await sql`
                INSERT INTO bill_analysis_batch_items (
                    batch_id, bill_id, processing_state
                ) 
                SELECT ${batchId}, bill_id, 'pending'
                FROM unnest(${bills.map(b => b.bill_id)}) AS t(bill_id)
            `;
        });
    }

    private async updateBillProgress(
        batchId: string,
        billId: number,
        state: ProcessingState,
        metrics?: BatchMetrics
    ): Promise<void> {
        const updates = [];
        updates.push(`processing_state = ${state}`);
        updates.push(`attempt_count = attempt_count + 1`);
        updates.push(`updated_at = NOW()`);
        
        if (metrics?.processingTime !== undefined) updates.push(`processing_time = ${metrics.processingTime}`);
        if (metrics?.tokenCount !== undefined) updates.push(`token_count = ${metrics.tokenCount}`);
        if (metrics?.error !== undefined) updates.push(`last_error = ${metrics.error}`);

        await this.sql`
            UPDATE bill_analysis_batch_items
            SET ${this.sql(updates.join(', '))}
            WHERE batch_id = ${batchId} AND bill_id = ${billId}
        `;
    }

    private async analyzeBills(bills: Bill[]) {
        // Format bills data according to established structure
        const inputs = bills.map(bill => ({
            bill_id: bill.bill_id.toString(),
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
Focus on identifying both direct and indirect effects on various populations, particularly historically marginalized groups.
Provide specific evidence from the bill text to support your analysis.
Be thorough, objective, and evidence-based in your assessment.

CRITICAL: You must respond with valid JSON exactly matching this structure. Any deviation will cause process failure:
{
    "analyses": [
        {
            "bill_id": string,
            "overall_analysis": {
                "bias_score": number (0-1),
                "positive_impact_score": number (0-1),
                "confidence": "High" | "Medium" | "Low"
            },
            "demographic_categories": [
                {
                    "category": "race" | "religion" | "gender" | "age" | "disability" | "socioeconomic",
                    "bias_score": number (0-1),
                    "positive_impact_score": number (0-1),
                    "subgroups": [
                        {
                            "code": string,
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
- All number values must be between 0 and 1
- All fields are required
- Response must be pure JSON with no additional text or explanation
- Maintain exact 1:1 correspondence between input bills and output analyses
- Each bill_id in the output must match an input bill_id`;

        const userMessage = `Analyze these bills' potential impact on different demographic groups:

${JSON.stringify(inputs, null, 2)}`;

        const completion = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: systemMessage
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        try {
            const response = JSON.parse(completion.choices[0].message.content || '');
            return {
                analyses: response.analyses,
                tokenCount: completion.usage?.total_tokens || 0
            };
        } catch (error) {
            throw new Error('Failed to parse LLM response as JSON');
        }
    }

    private async storeBillAnalysis(billId: number, result: { analyses: any[], tokenCount: number }) {
        const analyses = result.analyses;

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
                    ${analyses[0].overall_analysis.bias_score as number},
                    ${analyses[0].overall_analysis.positive_impact_score as number},
                    ${analyses[0].overall_analysis.confidence as string},
                    ${JSON.stringify(analyses)}
                )
                RETURNING analysis_id
            `;

            // Store category scores
            for (const analysis of analyses) {
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

        if (bills.length > this.minBatchSize) {
            // Split batch and retry
            const halfSize = Math.floor(bills.length / 2);
            await this.processBatch(bills.slice(0, halfSize));
            await this.processBatch(bills.slice(halfSize));
        } else {
            // Mark single bill as failed
            await this.updateBillProgress(batchId, bills[0].bill_id, 'failed', {
                error: errorMessage
            });
        }
    }
} 