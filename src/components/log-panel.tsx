'use client'

import { useCallback, useMemo, useState } from 'react'
import { useLogStream } from '@/hooks/use-log-stream'
import { isHttpEntry, getStatusBucket } from '@/lib/request-utils'
import { LogToolbar } from './log-toolbar'
import { RequestList } from './request-list'
import { RequestDetail } from './request-detail'
import type { HttpLogEntry } from '@/types/log'

interface LogPanelProps {
  containerId: string
  active: boolean
}

export function LogPanel({ containerId, active }: LogPanelProps) {
  const { logs, connected, error, clear } = useLogStream(containerId, active)

  const [methodFilter, setMethodFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<HttpLogEntry | null>(null)

  const httpEntries = useMemo(() => logs.filter(isHttpEntry), [logs])

  const filteredEntries = useMemo(() => {
    return httpEntries.filter(entry => {
      const passMethod = methodFilter.size === 0 || methodFilter.has(entry.method.toUpperCase())
      const passStatus = statusFilter === 'all' || getStatusBucket(entry.status) === statusFilter
      const passSearch = !search || entry.uri.toLowerCase().includes(search.toLowerCase())
      return passMethod && passStatus && passSearch
    })
  }, [httpEntries, methodFilter, statusFilter, search])

  const toggleMethod = useCallback((method: string) => {
    setMethodFilter(prev => {
      const next = new Set(prev)
      next.has(method) ? next.delete(method) : next.add(method)
      return next
    })
  }, [])

  const clearFilters = useCallback(() => {
    setMethodFilter(new Set())
    setStatusFilter('all')
    setSearch('')
  }, [])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Connection status bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-muted border-b border-border text-xs shrink-0">
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-muted-foreground">{connected ? 'Connected' : 'Connecting…'}</span>
        {error && <span className="text-destructive ml-2">{error}</span>}
      </div>

      <LogToolbar
        methodFilter={methodFilter}
        statusFilter={statusFilter}
        search={search}
        filteredCount={filteredEntries.length}
        totalCount={httpEntries.length}
        onToggleMethod={toggleMethod}
        onStatusFilter={setStatusFilter}
        onSearch={setSearch}
        onClear={clear}
        onClearFilters={clearFilters}
      />

      {/* Main split layout */}
      <div className="flex flex-1 min-h-0">
        {/* Request list — shrinks when detail panel is open */}
        <div className={`flex flex-col min-h-0 transition-all duration-200 ${selected ? 'w-[45%]' : 'flex-1'}`}>
          {filteredEntries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              {logs.length === 0 ? 'Waiting for logs…' : 'No requests match filters'}
            </div>
          ) : (
            <RequestList
              entries={filteredEntries}
              selectedSeq={selected?._seq ?? null}
              onSelect={setSelected}
            />
          )}
        </div>

        {/* Detail panel — slides in from the right */}
        {selected && (
          <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-200">
            <RequestDetail entry={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
