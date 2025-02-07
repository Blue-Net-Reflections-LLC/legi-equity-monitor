import { cn } from '@/lib/utils'

type Status = 'pending' | 'processing' | 'completed' | 'failed' | 'no_theme'

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50'
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'
  },
  no_theme: {
    label: 'No Theme',
    className: 'bg-zinc-50 dark:bg-zinc-900/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-900/50'
  }
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config.className
    )}>
      {config.label}
    </span>
  )
} 