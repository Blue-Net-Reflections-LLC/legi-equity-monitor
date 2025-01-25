import { Card } from "@/app/components/ui/card";

interface BillAnalysis {
  overall_analysis: {
    bias_score: number;
    positive_impact_score: number;
    confidence: 'High' | 'Medium' | 'Low';
  };
  demographic_categories: Array<{
    category: 'race' | 'religion' | 'gender' | 'age' | 'disability' | 'socioeconomic';
    bias_score: number;
    positive_impact_score: number;
    subgroups: Array<{
      code: string;
      bias_score: number;
      positive_impact_score: number;
      evidence: string;
    }>;
  }>;
}

const SUBGROUP_NAMES: Record<string, string> = {
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
};

function ScoreBar({ score, label, sentiment }: { score: number; label: string; sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' }) {
  const percentage = Math.round(score * 100);
  const barColor = 
    percentage >= 60 
      ? sentiment === 'POSITIVE'
        ? 'bg-emerald-500'
        : sentiment === 'NEGATIVE'
          ? 'bg-red-500'
          : 'bg-neutral-500'
      : 'bg-neutral-500';

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-zinc-600 dark:text-zinc-400 w-32">{label}</div>
      <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 w-12 text-right">{percentage}%</div>
    </div>
  );
}

function CategorySection({ category }: { category: BillAnalysis['demographic_categories'][0] }) {
  const getSentimentAndScore = (positive: number, bias: number): { score: number; sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' } => {
    const score = Math.max(positive, bias);
    return {
      score,
      sentiment: score >= 0.6 
        ? (positive >= bias ? 'POSITIVE' : 'NEGATIVE')
        : 'NEUTRAL'
    } as const;
  };

  const categoryAnalysis = getSentimentAndScore(category.positive_impact_score, category.bias_score);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold capitalize">{category.category}</h3>
      <div className="space-y-2">
        <ScoreBar 
          score={categoryAnalysis.score} 
          label="Impact Score" 
          sentiment={categoryAnalysis.sentiment}
        />
      </div>
      <div className="space-y-4 mt-4">
        {category.subgroups.map((subgroup) => {
          const subgroupAnalysis = getSentimentAndScore(subgroup.positive_impact_score, subgroup.bias_score);
          
          return (
            <div key={subgroup.code} className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-4">
              <h4 className="text-sm font-medium">{SUBGROUP_NAMES[subgroup.code] || subgroup.code}</h4>
              <div className="space-y-2 mt-2">
                <ScoreBar 
                  score={subgroupAnalysis.score} 
                  label="Impact Score" 
                  sentiment={subgroupAnalysis.sentiment}
                />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{subgroup.evidence}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BillAnalysis({ analysis }: { analysis: BillAnalysis | null }) {
  if (!analysis) {
    return null;
  }

  const overallAnalysis = {
    score: Math.max(analysis.overall_analysis.positive_impact_score, analysis.overall_analysis.bias_score),
    sentiment: analysis.overall_analysis.positive_impact_score >= analysis.overall_analysis.bias_score 
      ? 'POSITIVE' 
      : 'NEGATIVE'
  } as const;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Impact Analysis</h2>
        <div className="space-y-2">
          <ScoreBar 
            score={overallAnalysis.score} 
            label="Overall Impact" 
            sentiment={overallAnalysis.sentiment}
          />
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
          Confidence Level: {analysis.overall_analysis.confidence}
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-6">
        {analysis.demographic_categories.map((category) => (
          <CategorySection key={category.category} category={category} />
        ))}
      </div>
    </Card>
  );
} 