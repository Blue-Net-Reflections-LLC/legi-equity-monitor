import { ConfidenceBadge } from "@/app/components/analysis/ConfidenceBadge";
import { ImpactScore } from "@/app/components/analysis/ImpactScore";
import Link from "next/link";

interface BillDescriptionProps {
  text: string;
  analysis?: {
    overall_analysis: {
      bias_score: number;
      positive_impact_score: number;
      confidence: 'High' | 'Medium' | 'Low';
    };
    demographic_categories?: Array<{
      category: string;
      subgroups: Array<{
        code: string;
        bias_score: number;
        positive_impact_score: number;
        evidence: string;
      }>;
    }>;
  } | null;
}

export function BillDescription({ text, analysis }: BillDescriptionProps) {
  const hasSubgroups = analysis?.demographic_categories?.some(cat => cat.subgroups.length > 0);

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch">
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-4">Legislative Summary</h2>
        <p>{text}</p>
      </div>

      {analysis && (
        <div className="w-full md:w-auto md:min-w-[200px] bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Demographic Impact
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Overall analysis of equity impact
              </p>
            </div>
            <ImpactScore 
              positiveScore={analysis.overall_analysis.positive_impact_score}
              biasScore={analysis.overall_analysis.bias_score}
            />
            <ConfidenceBadge level={analysis.overall_analysis.confidence} />
            {hasSubgroups && (
              <Link 
                href="#demographic-breakdown"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                View detailed demographic breakdown ↓
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 