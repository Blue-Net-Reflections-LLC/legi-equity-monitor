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

function ScoreBar({ score, label }: { score: number; label: string }) {
  const percentage = Math.round(score * 100);
  const barColor = score > 0.66 ? 'bg-green-500' : score > 0.33 ? 'bg-yellow-500' : 'bg-red-500';

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
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold capitalize">{category.category}</h3>
      <div className="space-y-2">
        <ScoreBar score={category.positive_impact_score} label="Positive Impact" />
        <ScoreBar score={1 - category.bias_score} label="Fairness" />
      </div>
      <div className="space-y-4 mt-4">
        {category.subgroups.map((subgroup) => (
          <div key={subgroup.code} className="border-l-2 border-zinc-200 dark:border-zinc-700 pl-4">
            <h4 className="text-sm font-medium">{subgroup.code}</h4>
            <div className="space-y-2 mt-2">
              <ScoreBar score={subgroup.positive_impact_score} label="Positive Impact" />
              <ScoreBar score={1 - subgroup.bias_score} label="Fairness" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{subgroup.evidence}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BillAnalysis({ analysis }: { analysis: BillAnalysis | null }) {
  if (!analysis) {
    return null;
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Impact Analysis</h2>
        <div className="space-y-2">
          <ScoreBar score={analysis.overall_analysis.positive_impact_score} label="Overall Impact" />
          <ScoreBar score={1 - analysis.overall_analysis.bias_score} label="Overall Fairness" />
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