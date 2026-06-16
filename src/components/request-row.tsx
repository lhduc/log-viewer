'use client'

import type { HttpLogEntry } from '@/types/log'
import { formatDuration, getMethodStyle, getStatusStyle, getUriPath } from '@/lib/request-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { cn } from '@/lib/utils'

interface RequestRowProps {
  entry: HttpLogEntry
  selected: boolean
  onClick: () => void
  style?: React.CSSProperties
}

export function RequestRow({ entry, selected, onClick, style }: RequestRowProps) {
  const path = getUriPath(entry.uri)
  const time = formatTimestamp(entry.timestamp ?? entry.time ?? entry.ts)

  return (
    <div
      style={style}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 border-b border-border/50 cursor-pointer text-xs hover:bg-muted/50 transition-colors select-none',
        selected && 'bg-muted border-l-2 border-l-primary'
      )}
    >
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
  )
}
