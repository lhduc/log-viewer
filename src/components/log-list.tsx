'use client'

import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { LogEntry } from '@/types/log'
import { LogLine } from './log-line'
import { useAutoScroll } from '@/hooks/use-auto-scroll'

interface LogListProps {
  logs: LogEntry[]
  rawMode: boolean
}

export function LogList({ logs, rawMode }: LogListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 30,
  })

  const { paused, resume, onScroll } = useAutoScroll(virtualizer, logs.length)

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={parentRef}
        onScroll={onScroll}
        className="h-full overflow-auto"
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map(item => (
            <LogLine
              key={logs[item.index]._seq}
              entry={logs[item.index]}
              rawMode={rawMode}
              style={{
                position: 'absolute',
                top: item.start,
                left: 0,
                right: 0,
              }}
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
