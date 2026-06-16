'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { HttpLogEntry } from '@/types/log'
import { RequestRow } from './request-row'
import { useAutoScroll } from '@/hooks/use-auto-scroll'

interface RequestListProps {
  entries: HttpLogEntry[]
  selectedSeq: number | null
  onSelect: (entry: HttpLogEntry) => void
}

export function RequestList({ entries, selectedSeq, onSelect }: RequestListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 42,
    overscan: 20,
  })

  const { paused, resume, onScroll } = useAutoScroll(virtualizer, entries.length)

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={parentRef} onScroll={onScroll} className="h-full overflow-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map(item => (
            <RequestRow
              key={entries[item.index]._seq}
              entry={entries[item.index]}
              selected={entries[item.index]._seq === selectedSeq}
              onClick={() => onSelect(entries[item.index])}
              style={{ position: 'absolute', top: item.start, left: 0, right: 0 }}
            />
          ))}
        </div>
      </div>

      {paused && (
        <button
          onClick={resume}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg"
        >
          ↓ Resume auto-scroll
        </button>
      )}
    </div>
  )
}
