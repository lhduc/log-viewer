'use client'

import { Bookmark } from 'lucide-react'
import type { HttpLogEntry } from '@/types/log'
import { formatDuration, getMethodStyle, getStatusStyle, getUriPath } from '@/lib/request-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { useTimeMode } from '@/contexts/time-mode-context'
import { useBookmarks } from '@/contexts/bookmark-context'
import { CopyButton } from './copy-button'
import { cn } from '@/lib/utils'

interface RequestRowProps {
  entry: HttpLogEntry
  selected: boolean
  onClick: () => void
}

export function RequestRow({ entry, selected, onClick }: RequestRowProps) {
  const { mode } = useTimeMode()
  const { toggle, isBookmarked } = useBookmarks()
  const bookmarked = entry.request_id ? isBookmarked(entry.request_id) : false
  const path = getUriPath(entry.uri)
  const time = formatTimestamp(entry.timestamp ?? entry.time ?? entry.ts, mode === 'utc', true)
  const requestId = entry.request_id as string | undefined
  const username = entry.username as string | undefined

  return (
    <div
      onClick={onClick}
      className={cn(
        'group px-4 py-2 border-b border-border/50 cursor-pointer text-xs hover:bg-muted transition-colors select-none',
        selected && 'bg-muted border-l-2 border-l-primary'
      )}
    >
      {/* Main row: method, uri, status, duration, time */}
      <div className="flex items-center gap-3">
        <span className={cn(
          'shrink-0 w-14 text-center px-1.5 py-0.5 rounded border font-bold text-[10px] uppercase',
          getMethodStyle(entry.method)
        )}>
          {entry.method}
        </span>

        <span className="flex-1 text-foreground truncate">{path}</span>

        <span className={cn(
          'shrink-0 px-1.5 py-0.5 rounded font-semibold text-[11px]',
          getStatusStyle(entry.status)
        )}>
          {entry.status}
        </span>

        <span className="shrink-0 text-muted-foreground w-12 text-right">
          {formatDuration(entry.seconds)}
        </span>

        {time && (
          <span className="shrink-0 text-muted-foreground w-20 text-right hidden sm:block">
            {time}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); toggle(entry) }}
          className={cn(
            'shrink-0 transition-colors',
            bookmarked
              ? 'text-primary opacity-100'
              : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary'
          )}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark size={12} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Secondary line: request_id left, username right */}
      {(username || requestId) && (
        <div className="mt-0.5 flex items-center gap-1.5 pl-[calc(3.5rem+0.75rem)]">
          {requestId && (
            <>
              <span className="text-[10px] text-muted-foreground/60 truncate">{requestId}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton value={requestId} />
              </span>
            </>
          )}
          <div className="flex-1" />
          {username && (
            <span className="flex items-center gap-1 shrink-0">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton value={username} />
              </span>
              <span className="text-[10px] text-muted-foreground/60">{username}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
