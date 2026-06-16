'use client'

import type { HttpLogEntry } from '@/types/log'
import { formatDuration, getMethodStyle, getStatusStyle, getUriPath } from '@/lib/request-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { useTimeMode } from '@/contexts/time-mode-context'
import { CopyButton } from './copy-button'
import { cn } from '@/lib/utils'

interface RequestRowProps {
  entry: HttpLogEntry
  selected: boolean
  onClick: () => void
}

export function RequestRow({ entry, selected, onClick }: RequestRowProps) {
  const { mode } = useTimeMode()
  const path = getUriPath(entry.uri)
  const time = formatTimestamp(entry.timestamp ?? entry.time ?? entry.ts, mode === 'utc', true)
  const requestId = entry.request_id as string | undefined

  return (
    <div
      onClick={onClick}
      className={cn(
        'group px-4 py-2 border-b border-border/50 cursor-pointer text-xs hover:bg-muted/50 transition-colors select-none',
        selected && 'bg-muted border-l-2 border-l-primary'
      )}
    >
      {/* Main row: method, uri, status, duration, time */}
      <div className="flex items-center gap-3">
        <span className={cn(
          'shrink-0 w-14 text-center px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] uppercase',
          getMethodStyle(entry.method)
        )}>
          {entry.method}
        </span>

        <span className="flex-1 font-mono text-foreground truncate">{path}</span>

        <span className={cn(
          'shrink-0 px-1.5 py-0.5 rounded font-mono font-semibold text-[11px]',
          getStatusStyle(entry.status)
        )}>
          {entry.status}
        </span>

        <span className="shrink-0 text-muted-foreground w-12 text-right font-mono">
          {formatDuration(entry.seconds)}
        </span>

        {time && (
          <span className="shrink-0 text-muted-foreground w-20 text-right font-mono hidden sm:block">
            {time}
          </span>
        )}
      </div>

      {/* Request ID — subtle secondary line with copy button */}
      {requestId && (
        <div className="mt-0.5 flex items-center gap-1.5 pl-[calc(3.5rem+0.75rem)]">
          <span className="font-mono text-[10px] text-muted-foreground/60 truncate">{requestId}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton value={requestId} />
          </span>
        </div>
      )}
    </div>
  )
}
