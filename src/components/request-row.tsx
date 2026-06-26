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
  onBookmark?: (entry: HttpLogEntry) => void
}

export function RequestRow({ entry, selected, onClick, onBookmark }: RequestRowProps) {
  const { mode } = useTimeMode()
  const { isBookmarked } = useBookmarks()
  const bookmarked = entry.request_id ? isBookmarked(entry.request_id) : false
  const path = getUriPath(entry.uri)
  const datetime = formatTimestamp(entry.timestamp ?? entry.time ?? entry.ts, mode === 'utc')
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
      {/* Line 1: method + URI (full, wrapped) */}
      <div className="flex items-start gap-3">
        <span className={cn(
          'shrink-0 w-14 text-center px-1.5 py-0.5 rounded border font-bold text-[10px] uppercase mt-px',
          getMethodStyle(entry.method)
        )}>
          {entry.method}
        </span>
        <span className="flex-1 text-foreground break-all leading-snug">{path}</span>
      </div>

      {/* Line 2: request_id, bookmark, username */}
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
          <button
            onClick={e => { e.stopPropagation(); onBookmark?.(entry) }}
            className={cn(
              'shrink-0 transition-colors',
              bookmarked
                ? 'text-primary'
                : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary'
            )}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark size={11} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
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

      {/* Line 3: status, duration, datetime */}
      <div className="mt-0.5 flex items-center gap-2 pl-[calc(3.5rem+0.75rem)]">
        <span className={cn(
          'shrink-0 px-1.5 py-0.5 rounded font-semibold text-[11px]',
          getStatusStyle(entry.status)
        )}>
          {entry.status}
        </span>
        <span className="shrink-0 text-muted-foreground">{formatDuration(entry.seconds)}</span>
        {datetime && <span className="ml-auto shrink-0 text-muted-foreground/70">{datetime}</span>}
      </div>
    </div>
  )
}
