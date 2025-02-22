import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  level: 'High' | 'Medium' | 'Low';
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
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