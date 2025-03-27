// Define our demographic mappings
export const DEMOGRAPHIC_MAPPINGS = {
    // Race
    'BH': 'Black/African American',
    'AP': 'Asian/Pacific Islander',
    'LX': 'Latinx',
    'WH': 'White',
    'IN': 'Indigenous/Native American',
    // Religion
    'MU': 'Muslim',
    'CH': 'Christian',
    'JW': 'Jewish',
    'HI': 'Hindu',
    'BD': 'Buddhist',
    'SK': 'Sikh',
    'AT': 'Atheist/Agnostic',
    // Gender
    'ML': 'Male',
    'FM': 'Female',
    'TG': 'Transgender',
    'NB': 'Nonbinary',
    'GQ': 'Genderqueer',
    // Age
    'CY': 'Children and Youth',
    'AD': 'Adults',
    'OA': 'Older Adults (Seniors)',
    // Nationality
    'IM': 'Immigrant Communities',
    'NC': 'Naturalized Citizens',
    'FN': 'Foreign Nationals',
    // Sexual Orientation
    'LQ': 'LGBTQ+',
    'HT': 'Heterosexual',
    'BI': 'Bisexual',
    'PS': 'Pansexual',
    'AS': 'Asexual',
    // Veterans
    'VT': 'Veterans (General)',
    'DV': 'Disabled Veterans',
    'RM': 'Retired Military Personnel',
    // Disability
    'PD': 'Physical Disabilities',
    'MH': 'Mental Health Challenges',
    'DD': 'Developmental Disabilities'
} as const;

// Group demographics by category
const DEMOGRAPHIC_CATEGORIES = {
    'race_ethnicity': ['BH', 'AP', 'LX', 'WH', 'IN'],
    'religion': ['MU', 'CH', 'JW', 'HI', 'BD', 'SK', 'AT'],
    'gender': ['ML', 'FM', 'TG', 'NB', 'GQ'],
    'age': ['CY', 'AD', 'OA'],
    'nationality': ['IM', 'NC', 'FN'],
    'sexual_orientation': ['LQ', 'HT', 'BI', 'PS', 'AS'],
    'veterans': ['VT', 'DV', 'RM'],
    'disability': ['PD', 'MH', 'DD']
} as const;

function generateDemographicSection(): string {
    let section = '    "demographic_impacts": {\n';
    
    for (const [category, codes] of Object.entries(DEMOGRAPHIC_CATEGORIES)) {
        const groupNames = codes.map(code => DEMOGRAPHIC_MAPPINGS[code]).join(', ');
        section += `        "${category}": {
            "affected_groups": [List which of these groups are significantly impacted: ${groupNames}],
            "impact_analysis": [Analysis of how the affected groups are impacted],
            "bias_concerns": [Any potential biases to be aware of],
            "mitigation_strategies": [Suggestions for addressing disparate impacts]
        },\n`;
    }
    
    section = section.slice(0, -2) + '\n    }';  // Remove trailing comma and close section
    return section;
}

export const CLUSTER_ANALYSIS_PROMPT = `You are a legislative policy analyst tasked with analyzing clusters of related bills across different U.S. states. Your primary focus is to identify and analyze the thematic connections between these bills and their broader policy implications.

IMPORTANT THEMATIC ANALYSIS REQUIREMENTS:
1. Analyze the bills to identify if at least 70% of them share a clear, coherent theme.
2. If less than 70% of the bills share a clear theme, respond with:
   {
     "thematic_coherence": false,
     "explanation": "A detailed explanation of why these bills lack sufficient thematic connection (less than 70% share a clear theme)"
   }
3. Only proceed with full analysis if at least 70% of the bills share a clear thematic connection.

Your response for thematically coherent clusters MUST be a valid JSON object with the following fields:
{
    "thematic_coherence": true,
    
    "executive_summary": A comprehensive analysis (3-5 paragraphs) that must include:
        - The overarching theme or policy area connecting these bills
        - Key legislative approaches and mechanisms used across bills
        - Major policy objectives and intended outcomes
        - Notable state-specific variations or unique approaches
        - Analysis of how these bills fit into broader policy trends
        - Identification of innovative or novel policy solutions
    
    "policy_impacts": {
        "stakeholders": [List of key stakeholder groups affected],
        "primary_effects": [List of direct policy impacts],
        "secondary_effects": [List of potential indirect or long-term effects],
        "implementation_challenges": [List of potential challenges in implementing these policies],
        "cross_state_variations": [Analysis of how approaches differ between states]
    },
    
${generateDemographicSection()},
    
    "risk_assessment": {
        "legal_risks": [List of potential legal challenges or constitutional issues],
        "fiscal_risks": [List of budgetary and economic considerations],
        "social_risks": [List of potential social or community impacts],
        "political_risks": [List of political considerations and potential opposition],
        "implementation_risks": [List of operational and administrative challenges],
        "equity_risks": [List of potential disparate impacts on different demographic groups]
    },
    
    "future_outlook": A forward-looking analysis (2-3 paragraphs) discussing likely evolution of this policy area, potential for adoption in other states, and factors that might influence future legislation.
}

Guidelines for analysis:
1. Focus on objective analysis rather than advocacy
2. Consider both intended and unintended consequences
3. Acknowledge uncertainties and varying interpretations
4. Base analysis on the bill text and context provided
5. Consider the broader policy landscape and existing laws
6. Identify patterns in legislative approach across states
7. Note significant outliers or unique approaches
8. Consider practical implementation challenges
9. Evaluate potential constitutional or legal issues
10. Assess fiscal and administrative impacts
11. Pay special attention to impacts on different demographic groups
12. Consider intersectional effects across multiple demographic categories

IMPORTANT: 
- Your response must be valid JSON
- All text fields should be properly escaped
- Lists should contain 3-5 items each
- Keep individual text items concise but informative
- For demographic impacts, only include groups that are actually affected
- When analyzing demographic impacts, consider both positive and negative effects`;

// Update interfaces to match the dynamic categories
type DemographicCategory = keyof typeof DEMOGRAPHIC_CATEGORIES;

interface DemographicImpactAnalysis {
    affected_groups: string[];
    impact_analysis: string[];
    bias_concerns: string[];
    mitigation_strategies: string[];
}

type DemographicImpactsMap = {
    [K in DemographicCategory]: DemographicImpactAnalysis;
}

interface DemographicImpacts extends DemographicImpactsMap {}

export interface PolicyImpacts {
    stakeholders: string[];
    primary_effects: string[];
    secondary_effects: string[];
    implementation_challenges: string[];
    cross_state_variations: string[];
}

export interface RiskAssessment {
    legal_risks: string[];
    fiscal_risks: string[];
    social_risks: string[];
    political_risks: string[];
    implementation_risks: string[];
    equity_risks: string[];
}

export interface ClusterAnalysisResponse {
    thematic_coherence: boolean;
    explanation?: string;  // Required only when thematic_coherence is false
    executive_summary?: string;
    policy_impacts?: PolicyImpacts;
    demographic_impacts?: DemographicImpacts;
    risk_assessment?: RiskAssessment;
    future_outlook?: string;
}

export function validateAnalysisResponse(response: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for thematic coherence field
    if (typeof response.thematic_coherence !== 'boolean') {
        errors.push('Missing or invalid thematic_coherence field (must be boolean)');
        return { valid: false, errors };
    }

    // If no thematic coherence, only validate explanation
    if (!response.thematic_coherence) {
        if (!response.explanation || typeof response.explanation !== 'string') {
            errors.push('Missing or invalid explanation for lack of thematic coherence');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }

    // For thematically coherent clusters, validate full analysis
    if (!response.executive_summary) errors.push('Missing executive_summary');
    if (!response.policy_impacts) errors.push('Missing policy_impacts');
    if (!response.demographic_impacts) errors.push('Missing demographic_impacts');
    if (!response.risk_assessment) errors.push('Missing risk_assessment');
    if (!response.future_outlook) errors.push('Missing future_outlook');

    // Check field types
    if (typeof response.executive_summary !== 'string') errors.push('executive_summary must be a string');
    if (typeof response.future_outlook !== 'string') errors.push('future_outlook must be a string');
    if (typeof response.policy_impacts !== 'object') errors.push('policy_impacts must be an object');
    if (typeof response.demographic_impacts !== 'object') errors.push('demographic_impacts must be an object');
    if (typeof response.risk_assessment !== 'object') errors.push('risk_assessment must be an object');

    return {
        valid: errors.length === 0,
        errors
    };
} 