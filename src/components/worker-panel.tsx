'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LogEntry } from '@/types/log'
import type { JobGroup } from '@/lib/job-utils'
import { groupJobs, hasJobId, getJobDuration } from '@/lib/job-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { useTimeMode } from '@/contexts/time-mode-context'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { isFailed } from './job-group-card'
import { JobDetail } from './job-detail'
import { CopyButton } from './copy-button'
import { cn } from '@/lib/utils'

const QUICK_RANGES = [
  { label: '5m', minutes: 5 },
  { label: '10m', minutes: 10 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
] as const

const DETAIL_WIDTH_DEFAULT = 55
const DETAIL_WIDTH_MIN = 25
const DETAIL_WIDTH_MAX = 80

function toDatetimeLocal(d: Date, utc: boolean): string {
  if (utc) return d.toISOString().slice(0, 19)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const STATUS_BADGE: Record<string, string> = {
  failed:    'text-red-600 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-700 dark:bg-red-950/40',
  completed: 'text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950/40',
  running:   'text-amber-600 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:bg-amber-950/40',
  pending:   'text-muted-foreground border-border',
}

function JobListRow({ group, selected, onClick }: { group: JobGroup; selected: boolean; onClick: () => void }) {
  const { mode } = useTimeMode()
  const utc = mode === 'utc'
  const failed = isFailed(group.completed)
  const isCompleted = !!group.completed
  const isRunning = !!group.started && !group.completed
  const isPollOnly = !group.started && !group.completed && group.updates.length > 0
  const duration = getJobDuration(group)
  const startedE = group.started as Record<string, unknown> | undefined
  const retry = typeof startedE?.retry === 'number' ? startedE.retry as number : undefined
  const maxRetry = typeof startedE?.max_retry === 'number' ? startedE.max_retry as number : undefined
  const username = typeof startedE?.username === 'string' ? startedE.username : undefined

  const statusKey = failed ? 'failed' : isCompleted ? 'completed' : isRunning ? 'running' : 'pending'
  const statusLabel = failed ? 'FAILED' : isCompleted ? 'DONE' : isRunning ? 'RUN' : isPollOnly ? 'POLL' : 'PEND'

  return (
    <div
      onClick={onClick}
      className={cn(
        'group px-4 py-2 border-b border-border/50 cursor-pointer text-xs hover:bg-muted/50 transition-colors select-none',
        selected && 'bg-muted border-l-2 border-l-primary'
      )}
    >
      {/* Main row: status badge, type, badges, duration, time */}
      <div className="flex items-center gap-3">
        <span className={cn(
          'shrink-0 w-14 text-center px-1.5 py-0.5 rounded border font-mono font-bold text-[10px]',
          STATUS_BADGE[statusKey]
        )}>
          {statusLabel}
        </span>

        <span className="flex-1 font-mono text-foreground truncate">{group.type}</span>

        {group.updates.length > 0 && (
          <span className="shrink-0 px-1.5 py-0.5 rounded border font-mono text-[10px] text-sky-600 border-sky-300 bg-sky-50 dark:text-sky-300 dark:border-sky-600 dark:bg-sky-950">
            ↻{group.updates.length}
          </span>
        )}
        {retry !== undefined && maxRetry !== undefined && (
          <span className="shrink-0 px-1.5 py-0.5 rounded border font-mono text-[10px] text-purple-600 border-purple-400 bg-purple-100 dark:text-purple-300 dark:border-purple-500 dark:bg-purple-950">
            {retry}/{maxRetry}
          </span>
        )}

        <span className="shrink-0 text-muted-foreground w-12 text-right font-mono">
          {duration ?? ''}
        </span>

        <span className="shrink-0 text-muted-foreground w-20 text-right font-mono hidden sm:block">
          {typeof startedE?.timestamp === 'string'
            ? formatTimestamp(startedE.timestamp, utc, true)
            : ''}
        </span>
      </div>

      {/* Secondary line: job_id left, username right */}
      <div className="mt-0.5 flex items-center gap-1.5 pl-[calc(3.5rem+0.75rem)]">
        <span className="font-mono text-[10px] text-muted-foreground/60 truncate">{group.job_id}</span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton value={group.job_id} />
        </span>
        <div className="flex-1" />
        {username && (
          <span className="flex items-center gap-1 shrink-0">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton value={username} />
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/60">{username}</span>
          </span>
        )}
      </div>
    </div>
  )
}

interface WorkerPanelProps {
  logs: LogEntry[]
}

export function WorkerPanel({ logs }: WorkerPanelProps) {
  const { mode } = useTimeMode()
  const [search, setSearch] = useState('')
  const [usernameFilter, setUsernameFilter] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [selected, setSelected] = useState<JobGroup | null>(null)
  const [detailWidth, setDetailWidth] = useState(DETAIL_WIDTH_DEFAULT)
  const splitRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const [scrollPaused, setScrollPaused] = useState(false)

  const onListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const shouldPause = distFromBottom > 80
    pausedRef.current = shouldPause
    setScrollPaused(shouldPause)
  }

  const resumeScroll = () => {
    pausedRef.current = false
    setScrollPaused(false)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const jobEntries = useMemo(() => logs.filter(hasJobId), [logs])
  const jobGroups = useMemo(() => groupJobs(jobEntries), [jobEntries])

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase()
    const fromMs = timeFrom ? Date.parse(mode === 'utc' ? timeFrom + 'Z' : timeFrom) : 0
    const toMs = timeTo ? Date.parse(mode === 'utc' ? timeTo + 'Z' : timeTo) : 0

    return jobGroups
      .filter(group => {
        if (q) {
          const matchId = group.job_id.toLowerCase().includes(q)
          const matchType = group.type.toLowerCase().includes(q)
          const matchMsg = [group.started, group.completed, ...group.updates].some(e => {
            if (!e) return false
            const r = e as Record<string, unknown>
            const msg = typeof r.msg === 'string' ? r.msg.toLowerCase() : ''
            return msg.includes(q)
          })
          if (!matchId && !matchType && !matchMsg) return false
        }
        if (usernameFilter) {
          const uq = usernameFilter.toLowerCase()
          const matchUsername = [group.started, group.completed, ...group.updates].some(e => {
            if (!e) return false
            const r = e as Record<string, unknown>
            const uname = typeof r.username === 'string' ? r.username.toLowerCase() : ''
            return uname.includes(uq)
          })
          if (!matchUsername) return false
        }
        if (fromMs || toMs) {
          const entries = [group.started, ...group.updates, group.completed].filter(Boolean)
          const timestamps = entries.map(e => {
            const ts = (e as Record<string, unknown>)?.timestamp
            return typeof ts === 'string' ? Date.parse(ts) : 0
          }).filter(n => n > 0)
          if (timestamps.length > 0) {
            const earliest = Math.min(...timestamps)
            const latest = Math.max(...timestamps)
            if (fromMs && latest < fromMs) return false
            if (toMs && earliest > toMs) return false
          }
        }
        return true
      })
      .sort((a, b) => {
        const tsOf = (g: typeof a) => {
          const e = g.completed ?? g.updates[g.updates.length - 1] ?? g.started
          const ts = (e as Record<string, unknown> | undefined)?.timestamp
          return typeof ts === 'string' ? Date.parse(ts) : 0
        }
        return tsOf(a) - tsOf(b)
      })
  }, [jobGroups, search, usernameFilter, timeFrom, timeTo, mode])

  useEffect(() => {
    if (!pausedRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [filteredGroups.length])

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

  const hasFilters = !!search || !!usernameFilter || !!timeFrom || !!timeTo
  const clearFilters = () => { setSearch(''); setUsernameFilter(''); setTimeFrom(''); setTimeTo('') }

  // Keep selected group in sync as new logs arrive
  const selectedGroup = selected
    ? filteredGroups.find(g => g.job_id === selected.job_id) ?? selected
    : null

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40 flex-wrap shrink-0">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search job ID, type, message…"
          className="h-6 text-xs w-52"
        />
        <Input
          value={usernameFilter}
          onChange={e => setUsernameFilter(e.target.value)}
          placeholder="Username"
          className="h-6 text-xs w-28"
        />
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          {QUICK_RANGES.map(range => (
            <button
              key={range.label}
              onClick={() => {
                const now = new Date()
                setTimeFrom(toDatetimeLocal(new Date(now.getTime() - range.minutes * 60000), mode === 'utc'))
                setTimeTo('')
              }}
              className="px-1.5 py-0.5 rounded border border-border font-mono text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1">
          <input type="datetime-local" step="1" value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
            className="h-6 text-[11px] font-mono bg-transparent border border-border rounded px-1.5 text-foreground cursor-pointer" />
          <span className="text-muted-foreground text-[10px]">–</span>
          <input type="datetime-local" step="1" value={timeTo} onChange={e => setTimeTo(e.target.value)}
            className="h-6 text-[11px] font-mono bg-transparent border border-border rounded px-1.5 text-foreground cursor-pointer" />
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground shrink-0">
          {filteredGroups.length} / {jobGroups.length} jobs
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Split: job list + detail panel */}
      <div ref={splitRef} className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className="relative min-h-0"
          style={{ width: selectedGroup ? `${100 - detailWidth}%` : '100%' }}
        >
          <div
            className="absolute inset-0 overflow-y-auto flex flex-col"
            onScroll={onListScroll}
          >
            {filteredGroups.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                {logs.length === 0 ? 'Waiting for logs…' : 'No jobs match filters'}
              </div>
            ) : (
              filteredGroups.map(group => (
                <JobListRow
                  key={group.job_id}
                  group={group}
                  selected={selectedGroup?.job_id === group.job_id}
                  onClick={() => setSelected(prev => prev?.job_id === group.job_id ? null : group)}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
          {scrollPaused && (
            <button
              onClick={resumeScroll}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg z-10"
            >
              ↓ Resume auto-scroll
            </button>
          )}
        </div>

        {selectedGroup && (
          <>
            <div
              onMouseDown={onDividerMouseDown}
              className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors"
            />
            <div
              className="flex flex-col min-h-0 overflow-hidden bg-muted/30 animate-in slide-in-from-right-4 duration-200"
              style={{ width: `${detailWidth}%` }}
            >
              <JobDetail group={selectedGroup} onClose={() => setSelected(null)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
