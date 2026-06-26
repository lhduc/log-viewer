'use client'

import { useState } from 'react'
import type { LogEntry } from '@/types/log'
import type { JobGroup } from '@/lib/job-utils'
import { getJobDuration } from '@/lib/job-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { useTimeMode } from '@/contexts/time-mode-context'
import { JsonViewer } from './json-viewer'
import { CopyButton } from './copy-button'
import { SqlHighlight } from '@/lib/sql-highlight'
import { format as formatSql } from 'sql-formatter'
import { cn } from '@/lib/utils'

interface StackFrame { fn: string; shortFn: string; file: string }

function parseStackTrace(raw: string): StackFrame[] {
  const frames: StackFrame[] = []
  for (const line of raw.split('\n')) {
    if (!line) continue
    if (line.startsWith('\t') || line.startsWith('  ')) {
      if (frames.length > 0) frames[frames.length - 1].file = line.trim()
    } else {
      const parts = line.split('/')
      frames.push({ fn: line, shortFn: parts[parts.length - 1] ?? line, file: '' })
    }
  }
  return frames
}

function StackTrace({ raw }: { raw: string }) {
  const frames = parseStackTrace(raw)
  if (frames.length === 0) return null
  return (
    <div className="px-2.5 py-1">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trace</p>
      <div className="flex flex-col">
        {frames.map((f, i) => (
          <div key={i} className="flex gap-2 min-w-0">
            {/* dot + connector */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 mt-[3px] shrink-0" />
              {i < frames.length - 1 && <div className="w-px flex-1 bg-border mt-0.5 mb-0.5" />}
            </div>
            {/* frame content */}
            <div className={cn('min-w-0', i < frames.length - 1 ? 'pb-2' : '')}>
              <p className="text-[10px] font-mono text-foreground/80 break-all leading-snug" title={f.fn}>
                {f.shortFn}
              </p>
              {f.file && (
                <p className="text-[10px] font-mono text-muted-foreground/60 break-all leading-snug">
                  {f.file}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function callerFile(caller: unknown): string | null {
  if (typeof caller !== 'string') return null
  const parts = caller.split('/')
  return parts[parts.length - 1] ?? null
}

export function jobPayload(job: LogEntry): Record<string, unknown> {
  const { _stream, _raw, _seq, caller: _caller, stack: _stack, ...rest } = job as Record<string, unknown>
  return rest as Record<string, unknown>
}

export function isFailed(job: LogEntry | undefined): boolean {
  if (!job) return false
  const e = job as Record<string, unknown>
  const msg = typeof e.msg === 'string' ? e.msg.toLowerCase() : ''
  if (msg.includes('fail') || msg.includes('error') || msg.includes('exception')) return true
  return typeof e.error === 'string' || typeof e.exception === 'string'
}

function QueryRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const e = entry as Record<string, unknown>

  const sql = typeof e.query === 'string' ? e.query
    : typeof e.sql === 'string' ? e.sql
    : typeof e.msg === 'string' ? e.msg : ''

  const funcName = typeof e.func === 'string' ? e.func : null
  const caller = callerFile(e.caller)
  const rows = typeof e.rows === 'number' ? e.rows : null
  const durationMs = typeof e.seconds === 'number' ? `${(e.seconds * 1000).toFixed(1)}ms`
    : typeof e.time_ms === 'number' ? `${e.time_ms}ms` : null
  const error = typeof e.error === 'string' ? e.error : null

  // Try dialects: postgresql (double-quoted), mysql (backtick), sql (generic)
  let formatted = sql
  for (const language of ['postgresql', 'mysql', 'sql'] as const) {
    try {
      formatted = formatSql(sql, { language, tabWidth: 2, keywordCase: 'upper' })
      break
    } catch { /* try next */ }
  }

  return (
    <div className="border-t border-border/40">
      <div
        className="flex items-start gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-muted"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="shrink-0 font-semibold text-[10px] uppercase w-9 mt-px text-violet-500 dark:text-violet-400">SQL</span>
        <div className="flex-1 min-w-0">
          {funcName && (
            <span className="block font-mono text-xs text-foreground break-all sm:truncate">{funcName}</span>
          )}
          {caller && (
            <span className="block font-mono text-[10px] text-muted-foreground/60 break-all sm:truncate">{caller}</span>
          )}
          {!funcName && !caller && (
            <span className="block font-mono text-xs text-muted-foreground break-all sm:truncate">{sql}</span>
          )}
          {error && (
            <span className="block font-mono text-[10px] text-red-500 dark:text-red-400 break-all sm:truncate">{error}</span>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          {durationMs && <span className="text-muted-foreground/60 text-[10px]">{durationMs}</span>}
          {rows !== null && <span className="text-muted-foreground/40 text-[10px]">{rows} rows</span>}
        </div>
      </div>
      {expanded && (
        <div className="px-2.5 pb-2">
          <div className="relative">
            <pre className="overflow-x-auto p-2 rounded border border-border bg-muted text-xs leading-relaxed">
              <SqlHighlight sql={formatted} />
            </pre>
            <div className="absolute top-1.5 right-1.5">
              <CopyButton value={sql} className="bg-muted hover:bg-accent" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function UpdateRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const { mode } = useTimeMode()
  const e = entry as Record<string, unknown>

  // Delegate query logs to the dedicated QueryRow
  if (typeof e.type === 'string' && e.type === 'query') {
    return <QueryRow entry={entry} />
  }

  const msg = typeof e.msg === 'string' ? e.msg : ''
  const caller = callerFile(e.caller)
  const callerRaw = typeof e.caller === 'string' ? e.caller : null
  const stack = typeof e.stack === 'string' ? e.stack : null
  const level = typeof e.level === 'string' ? e.level : ''
  const levelUp = level.toUpperCase()
  const isDebug = levelUp === 'DEBUG'
  const isError = levelUp === 'ERROR' || levelUp === 'FATAL' || levelUp === 'CRITICAL'
  const isWarn  = levelUp === 'WARN' || levelUp === 'WARNING'
  const time = formatTimestamp(e.timestamp ?? e.time ?? e.ts, mode === 'utc', true)

  return (
    <div className="border-t border-border/40">
      <div
        className="flex items-start gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-muted"
        onClick={() => setExpanded(v => !v)}
      >
        <span className={cn(
          'shrink-0 font-semibold text-[10px] uppercase w-9 mt-px',
          isDebug ? 'text-muted-foreground/50'
          : isError ? 'text-red-500 dark:text-red-400'
          : isWarn  ? 'text-amber-500 dark:text-amber-400'
          : 'text-blue-500 dark:text-blue-400'
        )}>{level}</span>
        <span className="flex-1 break-all text-muted-foreground text-xs">{msg}</span>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          {time && <span className="text-muted-foreground/50 text-[10px]">{time}</span>}
          {caller && <span className="text-muted-foreground/40 text-[10px]">{caller}</span>}
        </div>
      </div>
      {expanded && (
        <div className="px-2.5 pb-2 flex flex-col gap-2">
          <JsonViewer data={jobPayload(entry)} />
          {(stack ?? callerRaw) && <StackTrace raw={stack ?? callerRaw!} />}
        </div>
      )}
    </div>
  )
}

export function JobGroupCard({ group }: { group: JobGroup }) {
  const [collapsed, setCollapsed] = useState(true)
  const { mode } = useTimeMode()
  const utc = mode === 'utc'
  const { job_id, type, started, completed, updates } = group
  const duration = getJobDuration(group)
  const isCompleted = !!completed
  const isRunning = !!started && !completed
  const isPollOnly = !started && !completed && updates.length > 0
  const failed = isFailed(completed)

  const startedE = started as Record<string, unknown> | undefined
  const completedE = completed as Record<string, unknown> | undefined
  const retry = typeof startedE?.retry === 'number' ? startedE.retry as number : undefined
  const maxRetry = typeof startedE?.max_retry === 'number' ? startedE.max_retry as number : undefined

  const firstUpdateMsg = typeof (updates[0] as Record<string, unknown> | undefined)?.msg === 'string'
    ? (updates[0] as Record<string, unknown>).msg as string : ''
  const processorName = /^[a-z][a-z0-9_]+/.test(firstUpdateMsg) ? firstUpdateMsg.split(' ')[0] : null
  const showProcessor = processorName && processorName !== type

  const errorDetail = (completedE?.error as string | undefined) ?? (completedE?.exception as string | undefined)

  return (
    <div className={cn('text-xs border rounded', failed ? 'border-red-500/50 bg-red-500/5' : 'border-border')}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 flex-wrap cursor-pointer hover:bg-muted" onClick={() => setCollapsed(v => !v)}>
        <span className={cn(
          'shrink-0 font-bold leading-none',
          failed ? 'text-red-500 text-base' : isCompleted ? 'text-green-500 text-sm' : isRunning ? 'text-amber-500 text-sm' : 'text-muted-foreground text-sm'
        )}>
          {failed ? '⚠' : isCompleted ? '✓' : isRunning ? '…' : isPollOnly ? '↻' : '?'}
        </span>
        <div className="flex flex-col ml-1">
          <span className={cn('font-medium', failed ? 'text-red-400' : 'text-foreground')}>{type}</span>
          {showProcessor && (
            <span className="text-[10px] text-muted-foreground">{processorName}</span>
          )}
          <span className="inline-flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground/60">{job_id}</span>
            <CopyButton value={job_id} />
          </span>
        </div>
        {updates.length > 0 && (
          <span className="px-1.5 py-0.5 rounded border font-semibold text-[10px] text-sky-600 border-sky-300 bg-sky-50 dark:text-sky-300 dark:border-sky-600 dark:bg-sky-950">
            ↻ {updates.length}×
          </span>
        )}
        {duration && (
          <span className="px-1.5 py-0.5 rounded border text-[10px] text-muted-foreground border-border bg-muted">
            {duration}
          </span>
        )}
        {isRunning && <span className="text-amber-500 text-[10px]">running</span>}
        {retry !== undefined && maxRetry !== undefined && (
          <span className="px-1.5 py-0.5 rounded border font-semibold text-[10px] text-purple-600 border-purple-400 bg-purple-100 dark:text-purple-300 dark:border-purple-500 dark:bg-purple-950">
            retry {retry}/{maxRetry}
          </span>
        )}
        <span className="ml-auto flex flex-col items-end gap-0.5">
          {typeof startedE?.timestamp === 'string' && (
            <span className="text-[10px] text-muted-foreground">
              {formatTimestamp(startedE.timestamp, utc, true)}
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-[10px]">{collapsed ? '▼' : '▲'}</span>
      </div>

      {!collapsed && <>
        {started && (
          <div className="flex items-start gap-2 px-2.5 py-1.5 border-t border-border/40 text-muted-foreground/70">
            <span className="shrink-0 text-[10px] mt-0.5">▶</span>
            <span className="flex-1 break-all text-xs">{typeof startedE?.msg === 'string' ? startedE.msg : ''}</span>
            <div className="shrink-0 flex flex-col items-end gap-0.5">
              {!!startedE?.timestamp && <span className="text-muted-foreground/50 text-[10px]">{formatTimestamp(startedE.timestamp as string, utc, true)}</span>}
              {!!startedE?.caller && <span className="text-muted-foreground/40 text-[10px]">{callerFile(startedE!.caller as string)}</span>}
            </div>
          </div>
        )}

        {updates.map((u, i) => <UpdateRow key={i} entry={u} />)}

        {completed && (
          <div className={cn('flex items-start gap-2 px-2.5 py-1.5 border-t border-border/40', failed ? 'text-red-400' : 'text-muted-foreground/70')}>
            <span className="shrink-0 text-[10px] mt-0.5">{failed ? '✕' : '■'}</span>
            <span className="flex-1 break-all text-xs">{typeof completedE?.msg === 'string' ? completedE.msg : ''}</span>
            <div className="shrink-0 flex flex-col items-end gap-0.5">
              {!!completedE?.timestamp && <span className="text-muted-foreground/50 text-[10px]">{formatTimestamp(completedE.timestamp as string, utc, true)}</span>}
              {!!completedE?.caller && <span className="text-muted-foreground/40 text-[10px]">{callerFile(completedE!.caller as string)}</span>}
            </div>
          </div>
        )}

        {errorDetail && (
          <div className="px-2.5 pb-1.5 font-mono text-[11px] break-all text-red-300 whitespace-pre-wrap border-t border-border/40">
            {errorDetail}
          </div>
        )}
      </>}
    </div>
  )
}
