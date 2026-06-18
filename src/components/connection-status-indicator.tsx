'use client'

import { useConnectionStatus } from '@/contexts/connection-status-context'

export function ConnectionStatusIndicator() {
  const { connected, error } = useConnectionStatus()
  const chip = error
    ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700'
    : connected
    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-700'
    : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-700'

  return (
    <div className={`h-6 px-2 flex items-center gap-1.5 text-xs rounded-full border ${chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${error ? 'bg-red-500' : connected ? 'bg-green-500' : 'bg-amber-500'}`} />
      {error ? 'Error' : connected ? 'Live' : 'Connecting…'}
    </div>
  )
}
