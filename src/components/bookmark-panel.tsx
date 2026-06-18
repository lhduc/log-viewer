'use client'

import { Bookmark, X } from 'lucide-react'
import { useBookmarks } from '@/contexts/bookmark-context'
import { LogPanel } from './log-panel'
import { Button } from '@/components/ui/button'

interface BookmarkViewProps {
  onClose: () => void
}

export function BookmarkView({ onClose }: BookmarkViewProps) {
  const { bookmarks, clear } = useBookmarks()

  return (
    <div className="flex flex-col h-full">
      {/* Tab-style header matching ContainerTabs */}
      <div className="shrink-0 flex items-center border-b border-border bg-muted h-10 px-3 gap-3">
        <div className="flex items-center gap-1.5 flex-1">
          <Bookmark size={13} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">Bookmarks</span>
          {bookmarks.length > 0 && (
            <span className="text-[10px] text-muted-foreground">({bookmarks.length})</span>
          )}
        </div>
        {bookmarks.length > 0 && (
          <Button variant="ghost" size="xs" onClick={clear} className="text-muted-foreground text-[10px]">
            Clear all
          </Button>
        )}
        <button
          onClick={onClose}
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Close bookmarks"
        >
          <X size={13} />
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Bookmark size={28} className="opacity-30" />
          <p className="text-sm">No bookmarks yet</p>
          <p className="text-xs">Click the bookmark icon on any request to save it here.</p>
        </div>
      ) : (
        <LogPanel
          containerIds={[]}
          active={true}
          externalLogs={bookmarks}
          externalConnected={true}
          externalError={null}
        />
      )}
    </div>
  )
}
