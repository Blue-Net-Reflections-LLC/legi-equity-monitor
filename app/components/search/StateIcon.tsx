'use client'

import Image from 'next/image'

interface StateIconProps {
  stateAbbr: string
  size?: number
}

// Map of state abbreviations to vivid background colors
const STATE_COLORS: Record<string, string> = {
  CA: 'bg-blue-500',
  NY: 'bg-orange-500',
  TX: 'bg-red-500',
  FL: 'bg-green-500',
  IL: 'bg-purple-500',
  PA: 'bg-indigo-500',
  OH: 'bg-pink-500',
  MI: 'bg-teal-500',
  GA: 'bg-cyan-500',
  NC: 'bg-rose-500',
  // Add more states with different colors
}

export function StateIcon({ stateAbbr, size = 40 }: StateIconProps) {
  const bgColor = STATE_COLORS[stateAbbr] || 'bg-blue-500' // Default to blue if state not found

  return (
    <div 
      className={`relative ${bgColor} rounded-lg overflow-hidden flex items-center justify-center shadow-sm`}
      style={{ width: size, height: size }}
    >
      <Image
        src={`/images/states/${stateAbbr.toLowerCase()}.svg`}
        alt={stateAbbr}
        width={size * 0.7}
        height={size * 0.7}
        className="object-contain brightness-[2] contrast-[2]"
      />
    </div>
  )
} 