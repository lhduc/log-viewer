'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLogStream } from '@/hooks/use-log-stream'
import { isHttpEntry, getStatusBucket } from '@/lib/request-utils'
import { hasJobId } from '@/lib/job-utils'
import { useTimeMode } from '@/contexts/time-mode-context'

import { LogToolbar } from './log-toolbar'
import { RequestList } from './request-list'
import { RequestDetail } from './request-detail'
import { WorkerPanel } from './worker-panel'
import type { HttpLogEntry, LogEntry } from '@/types/log'

const DETAIL_WIDTH_DEFAULT = 55  // percent
const DETAIL_WIDTH_MIN = 25
const DETAIL_WIDTH_MAX = 80

interface LogPanelProps {
  containerIds: string[]
  active: boolean
  isWorker?: boolean
}

export function LogPanel({ containerIds, active, isWorker = false }: LogPanelProps) {
  const { logs, connected, error, clear } = useLogStream(containerIds, active)
  const { mode: timeMode } = useTimeMode()

  const [methodFilter, setMethodFilter] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [selected, setSelected] = useState<HttpLogEntry | null>(null)
  const [detailWidth, setDetailWidth] = useState(DETAIL_WIDTH_DEFAULT)

  const splitRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const httpEntries = useMemo(() => logs.filter(isHttpEntry), [logs])

  const jobsByRequestId = useMemo(() => {
    const map = new Map<string, LogEntry[]>()
    for (const entry of logs) {
      if (isHttpEntry(entry)) continue
      const e = entry as Record<string, unknown>
      const reqId = typeof e.request_id === 'string' ? e.request_id : null
      if (reqId) {
        const list = map.get(reqId) ?? []
        list.push(entry)
        map.set(reqId, list)
      }
    }
    return map
  }, [logs])

  // request_ids whose correlated jobs match the search (by job_id or msg content).
  const jobMatchedRequestIds = useMemo(() => {
    const set = new Set<string>()
    if (!search) return set
    const q = search.toLowerCase()
    for (const [reqId, entries] of jobsByRequestId) {
      if (entries.some(e => {
        const r = e as Record<string, unknown>
        const jobId = typeof r.job_id === 'string' ? r.job_id.toLowerCase() : ''
        const type = typeof r.type === 'string' ? r.type.toLowerCase() : ''
        const msg = typeof r.msg === 'string' ? r.msg.toLowerCase() : ''
        return jobId.includes(q) || type.includes(q) || msg.includes(q)
      })) {
        set.add(reqId)
      }
    }
    return set
  }, [jobsByRequestId, search])

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase()
    return httpEntries
      .filter(entry => {
        const passMethod = methodFilter.size === 0 || methodFilter.has(entry.method.toUpperCase())
        const passStatus = statusFilter === 'all' || getStatusBucket(entry.status) === statusFilter
        const reqId = entry.request_id?.toLowerCase()
        const passSearch = !search
          || entry.uri.toLowerCase().includes(q)
          || (reqId?.includes(q) ?? false)
          || (entry.request_id ? jobMatchedRequestIds.has(entry.request_id) : false)
        const entryMs = entry.timestamp ? Date.parse(entry.timestamp) : 0
        // datetime-local value is always local time; append 'Z' to treat as UTC when in UTC mode
        const fromMs = timeFrom ? Date.parse(timeMode === 'utc' ? timeFrom + 'Z' : timeFrom) : 0
        const toMs = timeTo ? Date.parse(timeMode === 'utc' ? timeTo + 'Z' : timeTo) : 0
        const passTime = (!timeFrom || entryMs >= fromMs) && (!timeTo || entryMs <= toMs)
        return passMethod && passStatus && passSearch && passTime
      })
      // Sort chronologically — logs arrive interleaved from parallel container streams
      .sort((a, b) => {
        const ta = a.timestamp ? Date.parse(a.timestamp) : 0
        const tb = b.timestamp ? Date.parse(b.timestamp) : 0
        return ta - tb || a._seq - b._seq
      })
  }, [httpEntries, methodFilter, statusFilter, search, jobMatchedRequestIds, timeFrom, timeTo, timeMode])

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
    setTimeFrom('')
    setTimeTo('')
  }, [])

  // Drag-to-resize the detail panel
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current || !splitRef.current) return
      const rect = splitRef.current.getBoundingClientRect()
      const pct = ((rect.right - ev.clientX) / rect.width) * 100
      setDetailWidth(Math.min(DETAIL_WIDTH_MAX, Math.max(DETAIL_WIDTH_MIN, pct)))
    }

    const onMouseUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  // Reset width when panel closes
  useEffect(() => {
    if (!selected) setDetailWidth(DETAIL_WIDTH_DEFAULT)
  }, [selected])

  const selectedJobs = selected?.request_id
    ? (jobsByRequestId.get(selected.request_id) ?? [])
    : []

  const statusBar = (
    <div className="flex items-center gap-2 px-3 py-1 bg-muted border-b border-border text-xs shrink-0">
      <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-muted-foreground">{connected ? 'Connected' : 'Connecting…'}</span>
      {error && <span className="text-destructive ml-2">{error}</span>}
    </div>
  )

  if (isWorker) {
    return (
      <div className="flex flex-col h-full bg-background">
        {statusBar}
        <WorkerPanel logs={logs} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {statusBar}

      <LogToolbar
        methodFilter={methodFilter}
        statusFilter={statusFilter}
        search={search}
        timeFrom={timeFrom}
        timeTo={timeTo}
        filteredCount={filteredEntries.length}
        totalCount={httpEntries.length}
        onToggleMethod={toggleMethod}
        onStatusFilter={setStatusFilter}
        onSearch={setSearch}
        onTimeFrom={setTimeFrom}
        onTimeTo={setTimeTo}
        onClear={clear}
        onClearFilters={clearFilters}
      />

      <div ref={splitRef} className="flex flex-1 min-h-0 overflow-hidden">
        {/* Request list */}
        <div
          className="flex flex-col min-h-0 overflow-hidden"
          style={{ width: selected ? `${100 - detailWidth}%` : '100%' }}
        >
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

        {/* Drag divider + detail panel */}
        {selected && (
          <>
            {/* Resize handle */}
            <div
              onMouseDown={onDividerMouseDown}
              className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors"
            />

            {/* Detail panel with distinct background */}
            <div
              className="flex flex-col min-h-0 overflow-hidden bg-muted/30 animate-in slide-in-from-right-4 duration-200"
              style={{ width: `${detailWidth}%` }}
            >
              <RequestDetail
                entry={selected}
                onClose={() => setSelected(null)}
                jobs={selectedJobs}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
