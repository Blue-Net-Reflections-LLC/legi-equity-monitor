'use client'

import { Loader2 } from 'lucide-react'
import { useAppSelector } from '@/app/lib/redux/hooks'

export function LoadingState({ feature }: { feature: string }) {
  const loading = useAppSelector(state => state.ui.loading)
  
  if (!loading || !loading[feature]) return null
  
  return (
    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="space-y-4">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Loading {feature}...
        </p>
      </div>
    </div>
  )
} 