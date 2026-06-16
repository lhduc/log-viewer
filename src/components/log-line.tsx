'use client'

import { useState } from 'react'
import type { LogEntry } from '@/types/log'
import { getLevel, getMessage, formatTimestamp, LEVEL_STYLES } from '@/lib/log-utils'
import { cn } from '@/lib/utils'

interface LogLineProps {
  entry: LogEntry
  rawMode: boolean
  style?: React.CSSProperties
}

export function LogLine({ entry, rawMode, style }: LogLineProps) {
  const [expanded, setExpanded] = useState(false)

  const level = getLevel(entry as Record<string, unknown>)
  const message = getMessage(entry as Record<string, unknown>)
  const timestamp = formatTimestamp(entry.timestamp ?? entry.time ?? entry.ts)
  const levelStyle = LEVEL_STYLES[level] ?? 'text-foreground'

  const { _stream, _raw, _seq, ...rest } = entry

  if (rawMode) {
    return (
      <div style={style} className="px-3 py-0.5 font-mono text-xs text-foreground border-b border-border/50">
        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(rest, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div
      style={style}
      className={cn(
        'px-3 py-0.5 font-mono text-xs border-b border-border/50 cursor-pointer hover:bg-muted/50',
        _stream === 'stderr' && 'border-l-2 border-l-red-400'
      )}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-start gap-2 min-w-0">
        {timestamp && (
          <span className="shrink-0 text-muted-foreground">{timestamp}</span>
        )}
        {level && (
          <span className={cn('shrink-0 uppercase font-semibold w-12', levelStyle)}>
            {level.slice(0, 5)}
          </span>
        )}
        <span className="truncate text-foreground">{message}</span>
      </div>
      {expanded && (
        <pre className="mt-1 text-muted-foreground whitespace-pre-wrap break-all bg-muted/50 rounded p-2">
          {JSON.stringify(rest, null, 2)}
        </pre>
      )}
    </div>
  )
}
