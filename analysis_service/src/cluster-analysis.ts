import postgres from 'postgres';
import { OpenAI } from 'openai';
import { Logger } from './utils/logger';
import { Config, validateConfig } from './config';
import { 
    CLUSTER_ANALYSIS_PROMPT, 
    validateAnalysisResponse
} from './prompts/cluster-analysis';

const logger = new Logger('cluster-analysis');

const DRY_RUN_ROLLBACK_MESSAGE = 'DRY RUN - Rolling back all changes';

// Database configuration
const sql = postgres(Config.database.url!, {
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idle_timeout: 20
});

// OpenAI configuration
const openai = new OpenAI({
    apiKey: Config.llm.apiKey,
    baseURL: Config.llm.baseUrl,
    defaultHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

interface ClusterAnalysis {
    analysis_id: string;
    cluster_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme';
    input_token_count?: number;
    output_token_count?: number;
    analysis_parameters?: any;
    executive_summary?: string;
    policy_impacts?: any;
    risk_assessment?: any;
    future_outlook?: string;
    raw_llm_response?: any;
    error_message?: string;
}

interface BillInfo {
    bill_id: number;
    bill_number: string;
    status_desc: string;
    status_date: Date;
    title: string;
    description?: string;
    body_name: string;
    pending_committee_name?: string;
    created: Date;
    updated: Date;
    state_name: string;
    session_name: string;
    // Sponsor information
    sponsor_type_desc: string;
    party_abbr?: string;
    party_name?: string;
    sponsor_name: string;
    // Last action
    last_action_date?: Date;
    last_action_body?: string;
    last_action?: string;
}

interface ClusterStats {
    total_bills: number;
    bills_per_state: Record<string, number>;
    single_state_percentage: number;
    largest_state_count: number;
    state_count: number;
}

function analyzeClusterComposition(bills: BillInfo[]): ClusterStats {
    const billsByState = bills.reduce((acc, bill) => {
        acc[bill.state_name] = (acc[bill.state_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const total_bills = bills.length;
    const state_count = Object.keys(billsByState).length;
    const largest_state_count = Math.max(...Object.values(billsByState));
    const single_state_percentage = (largest_state_count / total_bills) * 100;

    return {
        total_bills,
        bills_per_state: billsByState,
        single_state_percentage,
        largest_state_count,
        state_count
    };
}

async function fetchPendingAnalysis(dryRun: boolean = false): Promise<ClusterAnalysis[]> {
    // Use a CTE to atomically select and update in one transaction
    if (dryRun) {
        return await sql<ClusterAnalysis[]>`
            SELECT *
            FROM cluster_analysis
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT ${Config.database.batchSize};
        `;
    }
    
    return await sql<ClusterAnalysis[]>`
        WITH pending_analyses AS (
            SELECT *
            FROM cluster_analysis
            WHERE status = 'pending'
            AND analysis_id NOT IN (
                -- Exclude analyses that have been processed in the last hour
                SELECT analysis_id 
                FROM cluster_analysis 
                WHERE status != 'pending' 
                AND updated_at > NOW() - INTERVAL '1 hour'
            )
            ORDER BY created_at ASC
            LIMIT ${Config.database.batchSize}
            FOR UPDATE SKIP LOCKED
        )
        UPDATE cluster_analysis ca
        SET 
            status = 'processing',
            started_at = NOW(),
            updated_at = NOW()
        FROM pending_analyses pa
        WHERE ca.analysis_id = pa.analysis_id
        RETURNING ca.*;
    `;
}

async function fetchClusterBills(clusterId: string): Promise<BillInfo[]> {
    const bills = await sql<BillInfo[]>`
        WITH cluster_bill_ids AS (
            SELECT bill_id 
            FROM cluster_bills 
            WHERE cluster_id = ${clusterId}
        ),
        last_actions AS (
            SELECT 
                bill_id,
                history_date as last_action_date,
                history_body_short as last_action_body,
                history_action as last_action
            FROM lsv_bill_history
            WHERE (bill_id, history_step) IN (
                SELECT bill_id, MAX(history_step)
                FROM lsv_bill_history
                GROUP BY bill_id
            )
        )
        SELECT DISTINCT ON (b.bill_id)
            b.bill_id,
            b.bill_number,
            b.status_desc,
            b.status_date,
            b.title,
            NULLIF(b.description, b.title) as description,
            b.body_name,
            b.pending_committee_name,
            b.created,
            b.updated,
            b.state_name,
            b.session_name,
            s.sponsor_type_desc,
            s.party_abbr,
            s.party_name,
            s.name as sponsor_name,
            la.last_action_date,
            la.last_action_body,
            la.last_action
        FROM cluster_bill_ids cbi
        JOIN lsv_bill b ON b.bill_id = cbi.bill_id
        LEFT JOIN lsv_bill_sponsor s ON s.bill_id = b.bill_id 
            AND s.sponsor_type_desc = 'Primary'
        LEFT JOIN last_actions la ON la.bill_id = b.bill_id
        ORDER BY b.bill_id, s.sponsor_order NULLS LAST
    `;

    // If we have more bills than the configured maximum, randomly sample them
    if (bills.length > Config.llm.maxBillsPerCluster) {
        logger.info(`Cluster has ${bills.length} bills, randomly sampling ${Config.llm.maxBillsPerCluster}`);
        const sampledBills: BillInfo[] = [];
        const billsCopy = [...bills];
        
        while (sampledBills.length < Config.llm.maxBillsPerCluster && billsCopy.length > 0) {
            const randomIndex = Math.floor(Math.random() * billsCopy.length);
            sampledBills.push(billsCopy.splice(randomIndex, 1)[0]);
        }
        
        return sampledBills;
    }

    return bills;
}

async function constructAnalysisPrompt(bills: BillInfo[]): Promise<string> {
    // Group bills by state for better organization
    const billsByState = bills.reduce((acc, bill) => {
        if (!acc[bill.state_name]) {
            acc[bill.state_name] = [];
        }
        acc[bill.state_name].push(bill);
        return acc;
    }, {} as Record<string, BillInfo[]>);

    let prompt = `Analyze the following cluster of related bills:\n\n`;

    for (const [state, stateBills] of Object.entries(billsByState)) {
        prompt += `${state}:\n`;
        for (const bill of stateBills) {
            prompt += `- ${bill.bill_number}: "${bill.title}"\n`;
            if (bill.description) {
                prompt += `  Description: ${bill.description}\n`;
            }
            prompt += `  Status: ${bill.status_desc}\n`;
            if (bill.sponsor_name) {
                prompt += `  Primary Sponsor: ${bill.sponsor_name} (${bill.party_name || bill.party_abbr || 'Unknown Party'})\n`;
            }
            if (bill.last_action && bill.last_action_date) {
                prompt += `  Last Action: ${bill.last_action} (${new Date(bill.last_action_date).toLocaleDateString()})\n`;
            }
            prompt += '\n';
        }
    }

    return prompt;
}

async function analyzeCluster(analysis: ClusterAnalysis, sql: postgres.Sql, dryRun: boolean = false): Promise<boolean> {
    try {
        // Fetch bills in this cluster
        const bills = await fetchClusterBills(analysis.cluster_id);
        if (bills.length === 0) {
            throw new Error('No bills found in cluster');
        }

        // Log detailed bill information
        logger.info(`Processing cluster ${analysis.cluster_id}:`, {
            total_bills_in_cluster: bills.length,
            bills_details: bills.map(b => ({
                bill_id: b.bill_id,
                state: b.state_name,
                has_description: !!b.description
            }))
        });

        // Analyze cluster composition
        const stats = analyzeClusterComposition(bills);
        logger.info(`Cluster ${analysis.cluster_id} composition:`, {
            total_bills: stats.total_bills,
            state_count: stats.state_count,
            single_state_percentage: stats.single_state_percentage.toFixed(1) + '%',
            bills_per_state: stats.bills_per_state
        });

        // Construct the prompt
        const userMessage = await constructAnalysisPrompt(bills);
        
        // Log prompt details
        logger.info(`Prompt details for cluster ${analysis.cluster_id}:`, {
            prompt_length: userMessage.length,
            bill_count_in_prompt: (userMessage.match(/bill_number/g) || []).length,
            description_count: (userMessage.match(/Description:/g) || []).length
        });

        logger.info(`Analyzing cluster ${analysis.cluster_id} with ${bills.length} bills${dryRun ? ' (DRY RUN)' : ''}`);
        
        // Call OpenAI
        const completion = await openai.chat.completions.create({
            model: Config.llm.model as string,
            messages: [
                { role: 'system', content: CLUSTER_ANALYSIS_PROMPT },
                { role: 'user', content: userMessage }
            ],
            ...(Config.llm.apiVersion === 'v1' 
                ? { 
                    max_tokens: Config.llm.settings.maxOutputTokens,
                    temperature: Config.llm.settings.temperature,
                    top_p: Config.llm.settings.topP,
                    ...(Config.llm.settings.responseFormat && { response_format: Config.llm.settings.responseFormat })
                }
                : { 
                    max_tokens: Config.llm.settings.maxOutputTokens,
                    temperature: Config.llm.settings.temperature,
                    top_p: Config.llm.settings.topP,
                    frequency_penalty: Config.llm.settings.frequencyPenalty,
                    presence_penalty: Config.llm.settings.presencePenalty,
                    ...(Config.llm.settings.responseFormat && { response_format: Config.llm.settings.responseFormat })
                }
            )
        });

        const response = completion.choices[0].message.content;
        if (!response) {
            throw new Error('Empty response from LLM');
        }

        // Parse and validate the response
        let analysis_result;
        try {
            analysis_result = JSON.parse(response);
            logger.info('Received LLM response:', JSON.stringify(analysis_result, null, 2));
        } catch (e) {
            logger.error('Failed to parse LLM response as JSON:', response);
            throw new Error('Invalid JSON response from LLM');
        }

        const validationResult = validateAnalysisResponse(analysis_result);
        if (!validationResult.valid) {
            logger.error('Invalid response format:', {
                errors: validationResult.errors,
                response: analysis_result
            });
            throw new Error(`Invalid response format from LLM: ${validationResult.errors.join(', ')}`);
        }

        if (dryRun) {
            logger.info('DRY RUN - Would update database with:');
            logger.info('Analysis Result:', analysis_result);
            logger.info('Token Usage:', {
                prompt_tokens: completion.usage?.prompt_tokens,
                completion_tokens: completion.usage?.completion_tokens,
                total_tokens: completion.usage?.total_tokens
            });
            return true;
        }

        // Update the analysis record
        if (!analysis_result.thematic_coherence) {
            await sql`
                UPDATE cluster_analysis SET
                    status = 'no_theme',
                    error_message = ${analysis_result.explanation},
                    raw_llm_response = ${response},
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE analysis_id = ${analysis.analysis_id}
            `;
            logger.info(`Cluster ${analysis.cluster_id} marked as lacking thematic coherence`);
            return true;
        }

        // Log the analysis result before saving
        logger.info('Saving analysis result to database:', {
            cluster_id: analysis.cluster_id,
            analysis_id: analysis.analysis_id,
            has_executive_summary: !!analysis_result.executive_summary,
            has_policy_impacts: !!analysis_result.policy_impacts,
            has_demographic_impacts: !!analysis_result.demographic_impacts,
            has_risk_assessment: !!analysis_result.risk_assessment,
            has_future_outlook: !!analysis_result.future_outlook
        });

        try {
            const result = await sql`
                UPDATE cluster_analysis SET
                    status = 'completed',
                    input_token_count = ${completion.usage?.prompt_tokens ?? null},
                    output_token_count = ${completion.usage?.completion_tokens ?? null},
                    executive_summary = ${analysis_result.executive_summary},
                    policy_impacts = ${JSON.stringify(analysis_result.policy_impacts)},
                    demographic_impacts = ${JSON.stringify(analysis_result.demographic_impacts)},
                    risk_assessment = ${JSON.stringify(analysis_result.risk_assessment)},
                    future_outlook = ${analysis_result.future_outlook},
                    raw_llm_response = ${response},
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE analysis_id = ${analysis.analysis_id}
                RETURNING analysis_id, status, demographic_impacts
            `;

            if (result.length === 0) {
                throw new Error(`No rows updated for analysis_id ${analysis.analysis_id}`);
            }

            logger.info(`Successfully saved analysis result:`, {
                analysis_id: result[0].analysis_id,
                status: result[0].status,
                has_demographic_impacts: !!result[0].demographic_impacts
            });

        } catch (error) {
            logger.error('Error saving analysis result:', {
                error: error instanceof Error ? error.message : error,
                analysis_id: analysis.analysis_id,
                cluster_id: analysis.cluster_id
            });
            throw error;  // Re-throw to be handled by outer error handler
        }

        return true;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error(`Error analyzing cluster ${analysis.cluster_id}:`, errorMessage);
        
        if (!dryRun) {
            const retryCount = parseInt(analysis.analysis_parameters?.retry_count || '0');
            
            if (retryCount < Config.llm.maxRetries) {
                await sql`
                    UPDATE cluster_analysis SET
                        analysis_parameters = jsonb_set(
                            COALESCE(analysis_parameters, '{}'::jsonb),
                            '{retry_count}',
                            ${(retryCount + 1).toString()}::jsonb
                        ),
                        error_message = ${errorMessage},
                        updated_at = NOW()
                    WHERE analysis_id = ${analysis.analysis_id}
                `;
            } else {
                await sql`
                    UPDATE cluster_analysis SET
                        status = 'failed',
                        error_message = ${errorMessage},
                        updated_at = NOW()
                    WHERE analysis_id = ${analysis.analysis_id}
                `;
            }
        }
        return false;
    }
}

async function processAnalyses(sql: postgres.Sql, dryRun: boolean = false): Promise<void> {
    // Track processed clusters in this session
    const processedClusters = new Set<string>();
    
    try {
        // Start transaction for dry run
        if (dryRun) {
            await sql.begin(async (transaction) => {
                logger.info('Started dry-run transaction');
                
                while (true) {
                    const pendingAnalyses = await fetchPendingAnalysis(dryRun);
                    if (pendingAnalyses.length === 0) {
                        logger.info('No pending analyses found');
                        break;
                    }

                    logger.info(`Processing ${pendingAnalyses.length} pending analyses${dryRun ? ' (DRY RUN)' : ''}`);
                    
                    for (const analysis of pendingAnalyses) {
                        // Skip if we've already processed this cluster in this session
                        if (processedClusters.has(analysis.cluster_id)) {
                            logger.warn(`Skipping duplicate cluster ${analysis.cluster_id} in this session`);
                            continue;
                        }
                        
                        await analyzeCluster(analysis, transaction, dryRun);
                        processedClusters.add(analysis.cluster_id);
                    }
                    
                    // If in dry run, only process one batch
                    if (dryRun) break;
                }
                
                // Transaction will automatically roll back in dry run mode
                if (dryRun) {
                    logger.info('Rolling back dry-run transaction');
                    throw new Error(DRY_RUN_ROLLBACK_MESSAGE);
                }
            });
        } else {
            // Normal processing - process each analysis in its own transaction
            while (true) {
                const pendingAnalyses = await fetchPendingAnalysis(dryRun);
                if (pendingAnalyses.length === 0) {
                    logger.info('No pending analyses found');
                    break;
                }

                logger.info(`Processing ${pendingAnalyses.length} pending analyses`);
                
                for (const analysis of pendingAnalyses) {
                    if (processedClusters.has(analysis.cluster_id)) {
                        logger.warn(`Skipping duplicate cluster ${analysis.cluster_id} in this session`);
                        continue;
                    }
                    
                    // Process each analysis in its own transaction
                    try {
                        await sql.begin(async (sqlTx) => {
                            await analyzeCluster(analysis, sqlTx, dryRun);
                        });
                        logger.info(`Successfully committed analysis for cluster ${analysis.cluster_id}`);
                    } catch (error) {
                        logger.error(`Failed to process cluster ${analysis.cluster_id}:`, error);
                        // Continue with next analysis even if this one failed
                        continue;
                    }
                    
                    processedClusters.add(analysis.cluster_id);
                }
            }
        }
        
        if (processedClusters.size > 0) {
            logger.info(`Session summary: Processed ${processedClusters.size} unique clusters`);
        }
    } catch (error) {
        if (error instanceof Error && error.message === DRY_RUN_ROLLBACK_MESSAGE) {
            logger.info('Dry run completed successfully');
        } else {
            throw error;
        }
    }
}

async function analyzeClusterDistribution(sql: postgres.Sql): Promise<void> {
    try {
        logger.info('Analyzing cluster distribution...');
        
        const stats = await sql`
            WITH cluster_stats AS (
                SELECT 
                    cb.cluster_id,
                    b.state_name,
                    COUNT(*) as bill_count
                FROM cluster_bills cb
                JOIN lsv_bill b ON b.bill_id = cb.bill_id
                GROUP BY cb.cluster_id, b.state_name
            ),
            state_percentages AS (
                SELECT 
                    cluster_id,
                    state_name,
                    bill_count,
                    ROUND(bill_count * 100.0 / SUM(bill_count) OVER (PARTITION BY cluster_id), 1) as state_percentage
                FROM cluster_stats
            )
            SELECT 
                cluster_id,
                COUNT(DISTINCT state_name) as state_count,
                SUM(bill_count) as total_bills,
                MAX(state_percentage) as max_state_percentage,
                STRING_AGG(
                    state_name || ': ' || bill_count::text || ' (' || ROUND(state_percentage, 1)::text || '%)',
                    ', ' ORDER BY bill_count DESC
                ) as state_distribution
            FROM state_percentages
            GROUP BY cluster_id
            HAVING SUM(bill_count) > 5
            ORDER BY max_state_percentage DESC, SUM(bill_count) DESC
            LIMIT 10;
        `;

        if (stats.length === 0) {
            logger.warn('No clusters found with more than 5 bills');
            return;
        }

        // Calculate overall statistics
        const totalClusters = await sql`
            SELECT COUNT(DISTINCT cluster_id) as count 
            FROM cluster_bills
        `;

        const stateDistribution = await sql`
            SELECT 
                b.state_name,
                COUNT(DISTINCT cb.cluster_id) as cluster_count,
                COUNT(*) as bill_count
            FROM cluster_bills cb
            JOIN lsv_bill b ON b.bill_id = cb.bill_id
            GROUP BY b.state_name
            ORDER BY bill_count DESC;
        `;

        logger.info('Overall Cluster Statistics:', {
            total_clusters: totalClusters[0].count,
            state_distribution: stateDistribution.map(row => ({
                state: row.state_name,
                clusters: row.cluster_count,
                bills: row.bill_count
            }))
        });

        logger.info('Most State-Concentrated Clusters:', {
            message: 'Top 10 clusters by state concentration',
            clusters: stats.map(row => ({
                cluster_id: row.cluster_id,
                state_count: row.state_count,
                total_bills: row.total_bills,
                max_state_percentage: `${row.max_state_percentage}%`,
                state_distribution: row.state_distribution
            }))
        });

    } catch (error) {
        logger.error('Error analyzing cluster distribution:', error instanceof Error ? {
            message: error.message,
            stack: error.stack
        } : error);
        throw error; // Re-throw to be handled by the main error handler
    }
}

async function cleanupProcessingStatus(): Promise<void> {
    try {
        // Reset any analyses stuck in 'processing' state
        const result = await sql`
            UPDATE cluster_analysis 
            SET 
                status = 'pending',
                error_message = 'Analysis reset due to process termination',
                updated_at = NOW()
            WHERE status = 'processing'
            RETURNING analysis_id;
        `;
        if (result.length > 0) {
            logger.info(`Reset ${result.length} analyses from 'processing' back to 'pending' status`);
        }
    } catch (error) {
        logger.error('Error cleaning up processing status:', error);
    }
}

async function main() {
    try {
        validateConfig();
        
        const dryRun = process.argv.includes('--dry-run');
        logger.info(`Starting cluster analysis${dryRun ? ' (DRY RUN)' : ''}`);

        // Log configuration for debugging
        logger.info('Using configuration:', {
            database: {
                batchSize: Config.database.batchSize
            },
            llm: {
                model: Config.llm.model,
                maxRetries: Config.llm.maxRetries,
                maxBillsPerCluster: Config.llm.maxBillsPerCluster,
                settings: {
                    ...Config.llm.settings,
                    // Don't log sensitive values
                    apiKey: undefined,
                    baseUrl: undefined
                }
            }
        });

        // Test database connection
        try {
            await sql`SELECT 1`;
            logger.info('Database connection successful');
        } catch (dbError) {
            logger.error('Database connection failed:', dbError instanceof Error ? {
                message: dbError.message,
                stack: dbError.stack
            } : dbError);
            throw new Error('Failed to connect to database');
        }

        // Analyze overall cluster distribution first
        await analyzeClusterDistribution(sql);

        if (dryRun) {
            // In dry run, use a single batch without transaction
            const pendingAnalyses = await fetchPendingAnalysis();
            if (pendingAnalyses.length > 0) {
                logger.info(`Processing ${pendingAnalyses.length} pending analyses (DRY RUN)`);
                for (const analysis of pendingAnalyses) {
                    await analyzeCluster(analysis, sql, true);
                }
            } else {
                logger.info('No pending analyses found');
            }
            logger.info('Successfully completed dry run');
        } else {
            // Normal processing - no outer transaction needed
            await processAnalyses(sql, false);
        }
    } catch (error) {
        logger.error('Fatal error:', error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : error);
        await cleanupProcessingStatus();
        throw error;
    } finally {
        await cleanupProcessingStatus();
        await sql.end().catch(err => 
            logger.error('Error closing database connection:', err)
        );
    }
}

// Run main function
main().catch(async error => {
    logger.error('Process terminating due to fatal error:', error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
    } : error);
    await cleanupProcessingStatus();
    process.exit(1);
}); 