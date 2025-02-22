import { Card } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "@/app/components/analysis/ConfidenceBadge";
import { ImpactScore, getImpactType } from "@/app/components/analysis/ImpactScore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip"

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

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  race: 'Impact across racial and ethnic groups',
  religion: 'Effects on religious communities',
  gender: 'Analysis by gender identity',
  age: 'Impact across age groups',
  disability: 'Effects on disability communities',
  socioeconomic: 'Analysis by economic status'
};

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

function ScoreBar({ score, type }: { score: number; type: 'POSITIVE' | 'BIAS' | 'NEUTRAL' }) {
  if (type === 'NEUTRAL') return null;

  const colors = {
    POSITIVE: {
      bars: [
        'bg-emerald-300 dark:bg-emerald-300',
        'bg-emerald-400 dark:bg-emerald-400',
        'bg-emerald-500 dark:bg-emerald-500',
        'bg-emerald-600 dark:bg-emerald-600',
        'bg-emerald-700 dark:bg-emerald-700'
      ]
    },
    BIAS: {
      bars: [
        'bg-red-300 dark:bg-red-300',
        'bg-red-400 dark:bg-red-400',
        'bg-red-500 dark:bg-red-500',
        'bg-red-600 dark:bg-red-600',
        'bg-red-700 dark:bg-red-700'
      ]
    }
  };

  // Calculate how many full and partial bars to show
  const totalBars = 5;
  const scorePerBar = 1 / totalBars;
  const fullBars = Math.floor(score / scorePerBar);
  const partialBar = score % scorePerBar > 0 ? score % scorePerBar / scorePerBar : 0;

  const percentage = Math.round(score * 100);
  const message = type === 'POSITIVE' 
    ? `${percentage}% Positive Impact`
    : `${percentage}% Bias Concern`;

  return (
    <TooltipProvider delayDuration={750}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex gap-[2px] h-4">
            {[...Array(totalBars)].map((_, i) => (
              <div 
                key={i}
                className="w-1 overflow-hidden bg-zinc-200 dark:bg-zinc-700 relative cursor-help"
              >
                <div
                  className={cn(
                    "w-full absolute bottom-0",
                    colors[type as 'POSITIVE' | 'BIAS'].bars[i]
                  )}
                  style={{
                    height: i < fullBars ? '100%' : 
                           i === fullBars ? `${partialBar * 100}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top"
          className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
        >
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function BillAnalysis({ analysis }: BillAnalysisProps) {
  if (!analysis) return null;

  return (
    <div id="demographic-breakdown" className="space-y-6">
      {analysis.demographic_categories.map((category) => (
        <Card key={category.category} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {toTitleCase(category.category)}
              </h3>
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-normal">
                • {CATEGORY_DESCRIPTIONS[category.category]}
              </span>
            </div>
            <ImpactScore 
              positiveScore={category.positive_impact_score}
              biasScore={category.bias_score}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.subgroups.map((subgroup) => {
              const impactType = getImpactType(subgroup.positive_impact_score, subgroup.bias_score);
              const displayScore = impactType === 'POSITIVE' ? subgroup.positive_impact_score : 
                                 impactType === 'BIAS' ? subgroup.bias_score : 0;
              return (
                <div 
                  key={subgroup.code} 
                  className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {SUBGROUP_NAMES[subgroup.code] || subgroup.code}
                    </h4>
                    <div className="flex items-center gap-2">
                      <ImpactBadge type={impactType} />
                      {impactType !== 'NEUTRAL' && (
                        <ScoreBar 
                          score={displayScore}
                          type={impactType}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {subgroup.evidence}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
} 