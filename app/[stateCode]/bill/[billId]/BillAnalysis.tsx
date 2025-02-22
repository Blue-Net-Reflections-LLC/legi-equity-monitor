import { Card } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';

interface BillAnalysisProps {
  analysis: {
    overall_analysis: {
      bias_score: number;
      positive_impact_score: number;
      confidence: 'High' | 'Medium' | 'Low';
    };
    demographic_categories: Array<{
      category: string;
      bias_score: number;
      positive_impact_score: number;
      subgroups: Array<{
        code: string;
        bias_score: number;
        positive_impact_score: number;
        evidence: string;
      }>;
    }>;
  } | null;
}

const toTitleCase = (str: string) => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

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
  // Disability
  'PD': 'Physical Disabilities',
  'MH': 'Mental Health Challenges',
  'DD': 'Developmental Disabilities',
  // Veterans
  'VT': 'Veterans (General)',
  'DV': 'Disabled Veterans',
  'RM': 'Retired Military Personnel'
};

function getImpactType(positiveScore: number, biasScore: number): 'POSITIVE' | 'BIAS' | 'NEUTRAL' {
  if (positiveScore >= 0.6) return 'POSITIVE';
  if (biasScore >= 0.6) return 'BIAS';
  return 'NEUTRAL';
}

function CategoryScore({ positiveScore, biasScore }: { positiveScore: number; biasScore: number }) {
  const type = getImpactType(positiveScore, biasScore);
  const score = type === 'POSITIVE' ? positiveScore : type === 'BIAS' ? biasScore : Math.max(positiveScore, biasScore);
  const percentage = Math.round(score * 100);

  const styles = {
    POSITIVE: 'text-emerald-500 dark:text-emerald-400',
    BIAS: 'text-red-500 dark:text-red-400',
    NEUTRAL: 'text-zinc-500 dark:text-zinc-400'
  };

  const icons = {
    POSITIVE: CheckCircle2,
    BIAS: AlertTriangle,
    NEUTRAL: MinusCircle
  };

  const Icon = icons[type];

  return (
    <div className={cn("flex items-center gap-2", styles[type])}>
      <Icon className="w-5 h-5" />
      <span className="font-semibold">
        {type === 'NEUTRAL' ? (
          'Neutral'
        ) : (
          `${percentage}% ${type === 'BIAS' ? 'Bias' : 'Positive'}`
        )}
      </span>
    </div>
  );
}

function ImpactBadge({ type }: { type: 'POSITIVE' | 'BIAS' | 'NEUTRAL' }) {
  const styles = {
    POSITIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    BIAS: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    NEUTRAL: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
  };

  const labels = {
    POSITIVE: 'Positive',
    BIAS: 'Bias',
    NEUTRAL: 'Neutral'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      styles[type]
    )}>
      {labels[type]}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const styles = {
    High: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
      styles[level]
    )}>
      {level} Confidence
    </span>
  );
}

function ScoreDisplay({ score, biasScore, type }: { score: number; biasScore: number; type: 'POSITIVE' | 'BIAS' | 'NEUTRAL' }) {
  if (type === 'NEUTRAL') {
    return null;
  }
  
  const displayScore = type === 'POSITIVE' ? score : biasScore;
                      
  return (
    <span className="font-medium">
      {(displayScore * 100).toFixed(0)}%
    </span>
  );
}

export default function BillAnalysis({ analysis }: BillAnalysisProps) {
  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Overall Analysis Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Impact Analysis</h2>
          <ConfidenceBadge level={analysis.overall_analysis.confidence} />
        </div>
        <CategoryScore 
          positiveScore={analysis.overall_analysis.positive_impact_score}
          biasScore={analysis.overall_analysis.bias_score}
        />
      </Card>

      {/* Category Cards */}
      <div className="space-y-6">
        {analysis.demographic_categories.map((category) => (
          <Card key={category.category} className="p-6">
            {/* Category Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {toTitleCase(category.category)}
              </h3>
              <CategoryScore 
                positiveScore={category.positive_impact_score}
                biasScore={category.bias_score}
              />
            </div>

            {/* Subgroups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.subgroups.map((subgroup) => {
                const impactType = getImpactType(subgroup.positive_impact_score, subgroup.bias_score);
                return (
                  <Card 
                    key={subgroup.code} 
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {SUBGROUP_NAMES[subgroup.code] || subgroup.code}
                      </h4>
                      <div className="flex items-center gap-2">
                        <ScoreDisplay 
                          score={subgroup.positive_impact_score}
                          biasScore={subgroup.bias_score}
                          type={impactType}
                        />
                        <ImpactBadge type={impactType} />
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {subgroup.evidence}
                    </p>
                  </Card>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 