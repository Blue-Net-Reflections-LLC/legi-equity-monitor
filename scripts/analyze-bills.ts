import analyzeDb from './db.js';
import { OpenAI } from 'openai';

// Validate OpenAI environment variables
if (!process.env.BILLS_OPENAI_API_KEY) {
  throw new Error('BILLS_OPENAI_API_KEY environment variable is not set');
}
if (!process.env.BILLS_OPENAI_BASE_URL) {
  throw new Error('BILLS_OPENAI_BASE_URL environment variable is not set');
}
if (!process.env.BILLS_OPENAI_MODEL) {
  throw new Error('BILLS_OPENAI_MODEL environment variable is not set');
}

const BATCH_SIZE = parseInt(process.env.BILLS_BATCH_SIZE || '5', 10);

const openai = new OpenAI({
  apiKey: process.env.BILLS_OPENAI_API_KEY,
  baseURL: process.env.BILLS_OPENAI_BASE_URL
});

function expandParty(partyCode: string | null): string {
  if (!partyCode) return 'Unknown';
  
  const partyMap: Record<string, string> = {
    'D': 'Democrat',
    'R': 'Republican',
    'I': 'Independent'
  };
  
  return partyMap[partyCode] || partyCode;
}

// Define valid impact types and severities as constants
const VALID_IMPACT_TYPES = ['POSITIVE', 'NEGATIVE'] as const;
const VALID_SEVERITIES = ['mild', 'medium', 'high', 'urgent'] as const;

type ImpactType = typeof VALID_IMPACT_TYPES[number];
type Severity = typeof VALID_SEVERITIES[number];

interface RacialImpact {
  impact_type: ImpactType;
  severity: Severity;
  analysis: string;
}

interface AnalysisResult {
  AI: RacialImpact;
  AP: RacialImpact;
  BH: RacialImpact;
  WH: RacialImpact;
}

async function analyzeBill(billId: number, billData: any) {
  console.log(`\nAnalyzing bill ${billId}: ${billData.title}`);
  try {
    console.log('Setting status to in_progress...');
    await analyzeDb`
      INSERT INTO bill_analysis_status (bill_id, status)
      VALUES (${billId}, 'in_progress')
      ON CONFLICT (bill_id) DO UPDATE SET status = 'in_progress'
    `;

    const billContext = `
      Title: ${billData.title}
      Description: ${billData.description}
      Committee: ${billData.committee}
      Categories: ${billData.categories}
      Primary Sponsor: ${billData.sponsor_name} (${expandParty(billData.sponsor_party)})
    `.trim();

    console.log('Requesting analysis from OpenAI...');
    const response = await openai.chat.completions.create({
      model: process.env.BILLS_OPENAI_MODEL!,
      messages: [
        {
          role: 'system',
          content: `You are an expert in analyzing legislative bills for their potential impact on different racial groups.

Your task is to analyze each bill's impact on these FOUR racial groups (all must be included):
- American Indian/Alaska Native (AI)
- Asian/Pacific Islander (AP)
- Black/African American (BH)
- White (WH)

Consider these factors in your analysis:
1. Direct effects on each group
2. Indirect or long-term implications
3. Historical context and existing disparities
4. The committee and sponsor's background

You MUST return a JSON object with EXACTLY this structure and these keys:
{
  "AI": {
    "impact_type": "POSITIVE" | "NEGATIVE",  // Use EXACTLY these strings
    "severity": "mild" | "medium" | "high" | "urgent",
    "analysis": "string explaining the reasoning"
  },
  "AP": {
    "impact_type": "POSITIVE" | "NEGATIVE",
    "severity": "mild" | "medium" | "high" | "urgent",
    "analysis": "string explaining the reasoning"
  },
  "BH": {
    "impact_type": "POSITIVE" | "NEGATIVE",
    "severity": "mild" | "medium" | "high" | "urgent",
    "analysis": "string explaining the reasoning"
  },
  "WH": {
    "impact_type": "POSITIVE" | "NEGATIVE",
    "severity": "mild" | "medium" | "high" | "urgent",
    "analysis": "string explaining the reasoning"
  }
}

Example response for a hypothetical education bill:
{
  "AI": {
    "impact_type": "POSITIVE",
    "severity": "medium",
    "analysis": "The bill's focus on cultural education programs will positively impact Native American students."
  },
  "AP": {
    "impact_type": "NEGATIVE",
    "severity": "mild",
    "analysis": "The bill's requirements may slightly reduce resources for existing ESL programs."
  },
  "BH": {
    "impact_type": "POSITIVE",
    "severity": "high",
    "analysis": "Significant positive impact through increased funding for underserved districts."
  },
  "WH": {
    "impact_type": "POSITIVE",
    "severity": "mild",
    "analysis": "Minor positive impact through general education improvements."
  }
}

CRITICAL REQUIREMENTS:
1. ALL four groups (AI, AP, BH, WH) must be included
2. impact_type MUST be exactly "POSITIVE" or "NEGATIVE" (uppercase)
3. severity MUST be one of: "mild", "medium", "high", "urgent"
4. Use EXACTLY these keys: "AI", "AP", "BH", "WH"
5. All property names and values must use double quotes
6. Each group must have all three fields: impact_type, severity, and analysis`
        },
        {
          role: 'user',
          content: billContext
        }
      ],
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in response');
    
    console.log('Parsing analysis results...');
    console.log('Raw response:', content);
    
    let results;
    try {
      results = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Invalid JSON content:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate the response structure
    const requiredGroups = ['AI', 'AP', 'BH', 'WH'] as const;
    const missingGroups = requiredGroups.filter(group => !results[group]);
    if (missingGroups.length > 0) {
      throw new Error(`Response missing required groups: ${missingGroups.join(', ')}`);
    }

    console.log('Storing analysis results in database...');
    // Insert all analyses in parallel
    await Promise.all(
      Object.entries(results).map(([code, result]: [string, any]) => {
        if (!VALID_IMPACT_TYPES.includes(result.impact_type)) {
          throw new Error(`Invalid impact_type for ${code}: ${result.impact_type}. Must be one of: ${VALID_IMPACT_TYPES.join(', ')}`);
        }
        if (!VALID_SEVERITIES.includes(result.severity)) {
          throw new Error(`Invalid severity for ${code}: ${result.severity}. Must be one of: ${VALID_SEVERITIES.join(', ')}`);
        }
        return analyzeDb`
          INSERT INTO racial_impact_analysis 
            (bill_id, race_code, impact_type, severity, analysis_text)
          VALUES 
            (${billId}, ${code}, ${result.impact_type}::impact_type_enum, ${result.severity}, ${result.analysis})
          ON CONFLICT (bill_id, race_code) 
          DO UPDATE SET 
            impact_type = ${result.impact_type}::impact_type_enum,
            severity = ${result.severity},
            analysis_text = ${result.analysis}
        `;
      })
    );

    console.log('Analysis completed successfully');
    await analyzeDb`
      UPDATE bill_analysis_status 
      SET status = 'completed'
      WHERE bill_id = ${billId}
    `;

  } catch (error) {
    console.error(`Error analyzing bill ${billId}:`, error);
    console.log('Setting status to failed...');
    await analyzeDb`
      UPDATE bill_analysis_status 
      SET status = 'failed'
      WHERE bill_id = ${billId}
    `;
    throw error;
  }
}

async function main() {
  try {
    let totalProcessed = 0;
    let batchNumber = 1;
    
    while (true) {
      console.log(`\nStarting batch ${batchNumber}...`);
      console.log('Fetching unprocessed bills...');
      const unprocessedBills = await analyzeDb`
        SELECT 
          b.bill_id,
          b.title,
          b.description,
          b.committee_name as committee,
          b.inferred_categories as categories,
          s.name as sponsor_name,
          s.party as sponsor_party
        FROM bills b
        LEFT JOIN bill_analysis_status bas ON b.bill_id = bas.bill_id
        LEFT JOIN bill_sponsors bs ON b.bill_id = bs.bill_id
        LEFT JOIN sponsors s ON bs.sponsor_id = s.sponsor_id
        WHERE bas.bill_id IS NULL
          AND b.bill_type = 'B'
        ORDER BY b.last_action_date DESC
        LIMIT ${BATCH_SIZE}
      `;

      if (unprocessedBills.length === 0) {
        console.log('\nNo more bills to process!');
        break;
      }

      console.log(`Found ${unprocessedBills.length} bills in batch ${batchNumber}`);
      
      for (const bill of unprocessedBills) {
        await analyzeBill(bill.bill_id, bill);
      }

      totalProcessed += unprocessedBills.length;
      console.log(`\nBatch ${batchNumber} complete!`);
      console.log(`Total bills processed so far: ${totalProcessed}`);
      batchNumber++;
    }

    console.log('\nAnalysis complete!');
    console.log(`Successfully processed ${totalProcessed} bills total`);
    await analyzeDb.end();
    process.exit(0);
  } catch (error) {
    console.error('\nAnalysis job failed:', error);
    await analyzeDb.end();
    process.exit(1);
  }
}

main(); 