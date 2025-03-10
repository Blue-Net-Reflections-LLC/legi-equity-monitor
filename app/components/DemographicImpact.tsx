import { useState, useEffect } from 'react';

interface DemographicImpactProps {
  category: string;
  score: number;
  sentiment: 'POSITIVE' | 'NEGATIVE';
}

export function DemographicImpact({ category, score, sentiment }: DemographicImpactProps) {
  const [currentWidth, setCurrentWidth] = useState(0);
  const barColor = sentiment === 'POSITIVE' ? 'bg-emerald-500' : 'bg-red-500';
  
  useEffect(() => {
    // Start animation after mount
    requestAnimationFrame(() => {
      setCurrentWidth(score);
    });
  }, [score]);

  const toTitleCase = (str: string) => {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="w-full">
      {/* Category label */}
      <div className="mb-1">
        <span className="text-sm font-medium">{toTitleCase(category)}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full">
        <div 
          className={`${barColor} h-2 rounded-full transition-all duration-750 linear`}
          style={{ width: `${currentWidth}%` }}
        />
      </div>

      {/* Centered percentage */}
      <div className="text-center mt-1">
        <span className="text-sm font-medium">{score}%</span>
      </div>
    </div>
  );
} 