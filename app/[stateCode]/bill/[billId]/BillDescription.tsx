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
      subgroups: Array<any>;
    }>;
  } | null;
}

export function BillDescription({ text, analysis }: BillDescriptionProps) {
  const hasSubgroups = analysis?.demographic_categories?.some(cat => cat.subgroups.length > 0);

  return (
    <div className="flex gap-8 items-start">
      <div className="flex-1">
        <h2 className="text-xl font-semibold mb-4">Legislative Summary</h2>
        <p>{text}</p>
      </div>

      {analysis && (
        <div className="flex flex-col items-end min-w-[200px]">
          <div className="text-right">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Demographic Impact
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
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
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1"
            >
              View detailed demographic breakdown ↓
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 