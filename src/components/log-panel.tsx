'use client'

import { useCallback, useMemo, useState } from 'react'
import { useLogStream } from '@/hooks/use-log-stream'
import { isHttpEntry, getStatusBucket } from '@/lib/request-utils'
import { isJobEntry } from '@/lib/job-utils'
import { LogToolbar } from './log-toolbar'
import { RequestList } from './request-list'
import { RequestDetail } from './request-detail'
import type { HttpLogEntry, JobEntry } from '@/types/log'

interface LogPanelProps {
  containerIds: string[]
  active: boolean
}

export function LogPanel({ containerIds, active }: LogPanelProps) {
  const { logs, connected, error, clear } = useLogStream(containerIds, active)

  const [methodFilter, setMethodFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<HttpLogEntry | null>(null)

  const httpEntries = useMemo(() => logs.filter(isHttpEntry), [logs])

  // Index job entries by request_id for quick lookup in detail panel
  const jobsByRequestId = useMemo(() => {
    const map = new Map<string, JobEntry[]>()
    for (const entry of logs) {
      if (isJobEntry(entry) && entry.request_id) {
        const list = map.get(entry.request_id) ?? []
        list.push(entry)
        map.set(entry.request_id, list)
      }
    }
    return map
  }, [logs])

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

  const selectedJobs = selected?.request_id
    ? (jobsByRequestId.get(selected.request_id) ?? [])
    : []

  return (
    <div className="flex flex-col h-full bg-background">
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

      <div className="flex flex-1 min-h-0">
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

        {selected && (
          <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-200">
            <RequestDetail
              entry={selected}
              onClose={() => setSelected(null)}
              jobs={selectedJobs}
            />
          </div>
        )}
      </div>
    </div>
  )
}
