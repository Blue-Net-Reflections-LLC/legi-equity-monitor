import { Users, Baby, DollarSign, Heart } from 'lucide-react';
import { Progress } from '@/app/components/ui/progress';

interface DemographicImpactProps {
  category: 'Race' | 'Age' | 'Income' | 'Disability';
  score: number;
}

export function DemographicImpact({ category, score }: DemographicImpactProps) {
  const getIcon = () => {
    switch (category) {
      case 'Race':
        return <Users className="w-4 h-4 mr-2" />;
      case 'Age':
        return <Baby className="w-4 h-4 mr-2" />;
      case 'Income':
        return <DollarSign className="w-4 h-4 mr-2" />;
      case 'Disability':
        return <Heart className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <div className="flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {getIcon()}
          <span className="text-sm font-medium capitalize">{category}</span>
        </div>
        <span className="text-sm font-semibold">{score}%</span>
      </div>
      <Progress value={score} className="h-2 rounded-full" />
    </div>
  );
} 