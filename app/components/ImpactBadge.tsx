import { AlertTriangle, ArrowUp } from 'lucide-react'

type ImpactLevel = 'mild' | 'medium' | 'high' | 'urgent'
type Sentiment = 'positive' | 'negative'

const levelColors: Record<Sentiment, Record<ImpactLevel, string>> = {
  positive: {
    mild: 'bg-green-50 text-green-600 border border-green-200',
    medium: 'bg-green-100 text-green-700 border border-green-300',
    high: 'bg-green-200 text-green-800 border border-green-400',
    urgent: 'bg-green-300 text-green-900 border border-green-500',
  },
  negative: {
    mild: 'bg-red-50 text-red-600 border border-red-200',
    medium: 'bg-red-100 text-red-700 border border-red-300',
    high: 'bg-red-200 text-red-800 border border-red-400',
    urgent: 'bg-red-300 text-red-900 border border-red-500',
  }
}

const levelIcons: Record<ImpactLevel, JSX.Element> = {
  mild: <ArrowUp size={14} className="rotate-45" />,
  medium: <ArrowUp size={14} />,
  high: <ArrowUp size={14} className="-rotate-45" />,
  urgent: <AlertTriangle size={14} />,
}

export default function ImpactBadge({ 
  level, 
  sentiment 
}: { 
  level?: ImpactLevel; 
  sentiment?: Sentiment 
}) {
  // Return null if either level or sentiment is missing
  if (!level || !sentiment || !levelColors[sentiment]?.[level]) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${levelColors[sentiment][level]}`}>
      {levelIcons[level]}
      <span className="capitalize">{level}</span>
    </div>
  )
}

