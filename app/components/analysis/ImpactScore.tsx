import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';

interface ImpactScoreProps {
  positiveScore: number;
  biasScore: number;
}

export function getImpactType(positiveScore: number, biasScore: number): 'POSITIVE' | 'BIAS' | 'NEUTRAL' {
  if (positiveScore >= 0.6) return 'POSITIVE';
  if (biasScore >= 0.6) return 'BIAS';
  return 'NEUTRAL';
}

export function ImpactScore({ positiveScore, biasScore }: ImpactScoreProps) {
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