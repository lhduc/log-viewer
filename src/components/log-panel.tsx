'use client'

import { useCallback, useMemo, useState } from 'react'
import { useLogStream } from '@/hooks/use-log-stream'
import { getLevel, getMessage } from '@/lib/log-utils'
import { LogToolbar } from './log-toolbar'
import { LogList } from './log-list'
import type { LogEntry } from '@/types/log'

interface LogPanelProps {
  containerId: string
  active: boolean
}

export function LogPanel({ containerId, active }: LogPanelProps) {
  const { logs, connected, error, clear } = useLogStream(containerId, active)

  const [levelFilter, setLevelFilter] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [streamFilter, setStreamFilter] = useState<'both' | 'stdout' | 'stderr'>('both')
  const [rawMode, setRawMode] = useState(false)

  const filteredLogs = useMemo(() => {
    return logs.filter(entry => {
      const level = getLevel(entry as Record<string, unknown>)
      const msg = getMessage(entry as Record<string, unknown>).toLowerCase()
      const passLevel = levelFilter.size === 0 || levelFilter.has(level)
      const passSearch = !search || msg.includes(search.toLowerCase())
      const passStream = streamFilter === 'both' || entry._stream === streamFilter
      return passLevel && passSearch && passStream
    })
  }, [logs, levelFilter, search, streamFilter])

  const toggleLevel = useCallback((level: string) => {
    setLevelFilter(prev => {
      const next = new Set(prev)
      next.has(level) ? next.delete(level) : next.add(level)
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setLevelFilter(new Set())
    setSearch('')
    setStreamFilter('both')
  }, [])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Status bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-muted border-b border-border text-xs">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-muted-foreground">{connected ? 'Connected' : 'Connecting…'}</span>
        {error && <span className="text-destructive ml-2">{error}</span>}
      </div>

      <LogToolbar
        levelFilter={levelFilter}
        search={search}
        streamFilter={streamFilter}
        rawMode={rawMode}
        filteredCount={filteredLogs.length}
        totalCount={logs.length}
        onToggleLevel={toggleLevel}
        onSearch={setSearch}
        onStreamFilter={setStreamFilter}
        onToggleRaw={() => setRawMode(v => !v)}
        onClear={clear}
        onClearFilters={clearFilters}
      />

      {filteredLogs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {logs.length === 0 ? 'Waiting for logs…' : 'No logs match current filters'}
        </div>
      ) : (
        <LogList logs={filteredLogs as LogEntry[]} rawMode={rawMode} />
      )}
    </div>
  )
}
