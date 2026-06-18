'use client'

import { useEffect, useRef, useState } from 'react'
import type { HttpLogEntry } from '@/types/log'
import { RequestRow } from './request-row'

interface RequestListProps {
  entries: HttpLogEntry[]
  selectedSeq: number | null
  onSelect: (entry: HttpLogEntry) => void
}

export function RequestList({ entries, selectedSeq, onSelect }: RequestListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // useRef to avoid stale closure in scroll handler
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)

  // Scroll to bottom whenever new entries arrive, unless user scrolled up
  useEffect(() => {
    if (!pausedRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [entries.length])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const shouldPause = distFromBottom > 80
    pausedRef.current = shouldPause
    setPaused(shouldPause)
  }

  const resume = () => {
    pausedRef.current = false
    setPaused(false)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex-1 min-h-0 relative">
      {/* absolute inset-0 ensures scroll container fills 100% of the flex-1 area */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-auto"
      >
        {entries.map(entry => (
          <RequestRow
            key={entry._seq}
            entry={entry}
            selected={entry._seq === selectedSeq}
            onClick={() => onSelect(entry)}
          />
        ))}
        {/* Sentinel element — scroll target for auto-scroll to bottom */}
        <div ref={bottomRef} />
      </div>

      {paused && (
        <button
          onClick={resume}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg z-10"
        >
          ↓ Resume auto-scroll
        </button>
      )}
    </div>
  )
}
