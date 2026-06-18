'use client'

import { useState } from 'react'
import { Bookmark, Trash2 } from 'lucide-react'
import { useBookmarks } from '@/contexts/bookmark-context'
import { RequestDetail } from './request-detail'
import { RequestRow } from './request-row'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { HttpLogEntry } from '@/types/log'

export function BookmarkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { bookmarks, clear } = useBookmarks()
  const [selected, setSelected] = useState<HttpLogEntry | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 rounded-2xl overflow-hidden flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border shrink-0">
          <Bookmark size={15} className="text-muted-foreground" />
          <DialogTitle className="text-sm font-semibold flex-1">Bookmarks</DialogTitle>
          {bookmarks.length > 0 && (
            <Button variant="ghost" size="xs" onClick={clear} className="text-muted-foreground gap-1.5">
              <Trash2 size={12} /> Clear all
            </Button>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Bookmark size={28} className="opacity-30" />
            <p className="text-sm">No bookmarks yet</p>
            <p className="text-xs">Click the bookmark icon on any request to save it here.</p>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* List */}
            <div className="w-96 shrink-0 border-r border-border overflow-y-auto">
              {bookmarks.map(entry => (
                <RequestRow
                  key={`${entry._seq}-${entry.request_id}`}
                  entry={entry}
                  selected={selected?._seq === entry._seq}
                  onClick={() => setSelected(prev => prev?._seq === entry._seq ? null : entry)}
                />
              ))}
            </div>

            {/* Detail */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {selected ? (
                <RequestDetail
                  entry={selected}
                  jobs={[]}
                  onClose={() => setSelected(null)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Select a request to view details
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
