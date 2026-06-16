'use client'

import { useState } from 'react'
import type { HttpLogEntry, LogEntry } from '@/types/log'
import { formatDuration, getMethodStyle, getStatusStyle } from '@/lib/request-utils'
import { groupJobs, getJobDuration, hasJobId, type JobGroup } from '@/lib/job-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { JsonViewer } from './json-viewer'
import { CopyButton } from './copy-button'
import { cn } from '@/lib/utils'

interface RequestDetailProps {
  entry: HttpLogEntry
  onClose: () => void
  jobs: LogEntry[]
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono break-all">{value}</dd>
    </>
  )
}

// Section header with title and optional copy-the-JSON button
function SectionHeader({ title, copyValue }: { title: string; copyValue?: unknown }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      {copyValue !== undefined && (
        <CopyButton value={typeof copyValue === 'string' ? copyValue : JSON.stringify(copyValue, null, 2)} />
      )}
    </div>
  )
}

function jobPayload(job: LogEntry): Record<string, unknown> {
  const { _stream, _raw, _seq, ...rest } = job as Record<string, unknown>
  return rest as Record<string, unknown>
}

function isFailed(job: LogEntry | undefined): boolean {
  if (!job) return false
  const e = job as Record<string, unknown>
  const msg = typeof e.msg === 'string' ? e.msg.toLowerCase() : ''
  if (msg.includes('fail') || msg.includes('error') || msg.includes('exception')) return true
  return typeof e.error === 'string' || typeof e.exception === 'string'
}

function callerFile(caller: unknown): string | null {
  if (typeof caller !== 'string') return null
  const parts = caller.split('/')
  return parts[parts.length - 1] ?? null
}

function UpdateRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const e = entry as Record<string, unknown>
  const msg = typeof e.msg === 'string' ? e.msg : ''
  const caller = callerFile(e.caller)
  const level = typeof e.level === 'string' ? e.level : ''
  const isDebug = level.toUpperCase() === 'DEBUG'
  const time = formatTimestamp(e.timestamp ?? e.time ?? e.ts)

  return (
    <div className="border-t border-border/40">
      <div
        className="flex items-start gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded(v => !v)}
      >
        <span className={cn(
          'shrink-0 font-semibold text-[10px] uppercase w-9 mt-px',
          isDebug ? 'text-muted-foreground/50' : 'text-blue-500 dark:text-blue-400'
        )}>{level}</span>
        <span className="flex-1 break-all text-muted-foreground font-mono text-xs">{msg}</span>
        <div className="shrink-0 flex flex-col items-end gap-0.5">
          {time && <span className="text-muted-foreground/50 text-[10px] font-mono">{time}</span>}
          {caller && <span className="text-muted-foreground/40 text-[10px] font-mono">{caller}</span>}
        </div>
      </div>
      {expanded && (
        <div className="px-2.5 pb-2">
          <JsonViewer data={jobPayload(entry)} />
        </div>
      )}
    </div>
  )
}

function JobGroupCard({ group }: { group: JobGroup }) {
  const [collapsed, setCollapsed] = useState(true)
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

  // Derive processor name from first update's msg prefix (snake_case word before space)
  const firstUpdateMsg = typeof (updates[0] as Record<string, unknown> | undefined)?.msg === 'string'
    ? (updates[0] as Record<string, unknown>).msg as string : ''
  const processorName = /^[a-z][a-z0-9_]+/.test(firstUpdateMsg) ? firstUpdateMsg.split(' ')[0] : null
  const showProcessor = processorName && processorName !== type

  const errorDetail = (completedE?.error as string | undefined) ?? (completedE?.exception as string | undefined)

  return (
    <div className={cn('text-xs border rounded', failed ? 'border-red-500/50 bg-red-500/5' : 'border-border')}>

      {/* Header */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 flex-wrap cursor-pointer hover:bg-muted/30" onClick={() => setCollapsed(v => !v)}>
        <span className={cn(
          'shrink-0 font-bold leading-none',
          failed ? 'text-red-500 text-base' : isCompleted ? 'text-green-500 text-sm' : isRunning ? 'text-amber-500 text-sm' : 'text-muted-foreground text-sm'
        )}>
          {failed ? '⚠' : isCompleted ? '✓' : isRunning ? '…' : isPollOnly ? '↻' : '?'}
        </span>
        <div className="flex flex-col ml-1">
          <span className={cn('font-mono font-medium', failed ? 'text-red-400' : 'text-foreground')}>{type}</span>
          {showProcessor && (
            <span className="font-mono text-[10px] text-muted-foreground">{processorName}</span>
          )}
        </div>
        {updates.length > 0 && (
          <span className="px-1.5 py-0.5 rounded border font-mono font-semibold text-[10px] text-sky-600 border-sky-300 bg-sky-50 dark:text-sky-300 dark:border-sky-600 dark:bg-sky-950">
            ↻ {updates.length}×
          </span>
        )}
        {duration && (
          <span className="px-1.5 py-0.5 rounded border font-mono text-[10px] text-muted-foreground border-border bg-muted/50">
            {duration}
          </span>
        )}
        {isRunning && <span className="text-amber-500 text-[10px]">running</span>}
        {retry !== undefined && maxRetry !== undefined && (
          <span className="px-1.5 py-0.5 rounded border font-mono font-semibold text-[10px] text-purple-600 border-purple-400 bg-purple-100 dark:text-purple-300 dark:border-purple-500 dark:bg-purple-950">
            retry {retry}/{maxRetry}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1">
          <span className="font-mono text-[10px] text-muted-foreground break-all">{job_id}</span>
          <CopyButton value={job_id} />
        </span>
        <span className="text-muted-foreground text-[10px]">{collapsed ? '▼' : '▲'}</span>
      </div>

      {!collapsed && <>
      {/* Started — compact msg + caller + time */}
      {started && (
        <div className="flex items-start gap-2 px-2.5 py-1.5 border-t border-border/40 text-muted-foreground/70">
          <span className="shrink-0 text-[10px] mt-0.5">▶</span>
          <span className="flex-1 break-all font-mono text-xs">{typeof startedE?.msg === 'string' ? startedE.msg : ''}</span>
          <div className="shrink-0 flex flex-col items-end gap-0.5">
            {!!startedE?.timestamp && <span className="text-muted-foreground/50 text-[10px] font-mono">{formatTimestamp(startedE.timestamp as string)}</span>}
            {!!startedE?.caller && <span className="text-muted-foreground/40 text-[10px] font-mono">{callerFile(startedE!.caller as string)}</span>}
          </div>
        </div>
      )}

      {/* Updates — each row clickable to expand full JSON */}
      {updates.map((u, i) => <UpdateRow key={i} entry={u} />)}

      {/* Completed — compact msg + caller + time */}
      {completed && (
        <div className={cn('flex items-start gap-2 px-2.5 py-1.5 border-t border-border/40', failed ? 'text-red-400' : 'text-muted-foreground/70')}>
          <span className="shrink-0 text-[10px] mt-0.5">{failed ? '✕' : '■'}</span>
          <span className="flex-1 break-all font-mono text-xs">{typeof completedE?.msg === 'string' ? completedE.msg : ''}</span>
          <div className="shrink-0 flex flex-col items-end gap-0.5">
            {!!completedE?.timestamp && <span className="text-muted-foreground/50 text-[10px] font-mono">{formatTimestamp(completedE.timestamp as string)}</span>}
            {!!completedE?.caller && <span className="text-muted-foreground/40 text-[10px] font-mono">{callerFile(completedE!.caller as string)}</span>}
          </div>
        </div>
      )}

      {/* Error/exception detail */}
      {errorDetail && (
        <div className="px-2.5 pb-1.5 font-mono text-[11px] break-all text-red-300 whitespace-pre-wrap border-t border-border/40">
          {errorDetail}
        </div>
      )}
      </>}
    </div>
  )
}

export function RequestDetail({ entry, onClose, jobs }: RequestDetailProps) {
  const time = formatTimestamp(entry.timestamp ?? (entry as Record<string, unknown>).time ?? (entry as Record<string, unknown>).ts)

  const { _stream, _raw, _seq, method, uri, status, seconds, ip, request_id, request, response, timestamp, level, msg, message, time: _t, ts: _ts, ...extra } = entry as HttpLogEntry & Record<string, unknown>
  const hasExtra = Object.keys(extra).length > 0

  const jobEntries = jobs.filter(hasJobId)
  const requestLogs = jobs.filter(e => !hasJobId(e))
  const jobGroups = groupJobs(jobEntries)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0 min-w-0">
        <span className={cn(
          'shrink-0 px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] uppercase',
          getMethodStyle(method)
        )}>
          {method}
        </span>
        <span className="flex-1 font-mono text-sm text-foreground truncate" title={uri}>{uri}</span>
        <CopyButton value={uri} />
        <button
          onClick={onClose}
          className="shrink-0 text-muted-foreground hover:text-foreground w-6 h-6 flex items-center justify-center rounded hover:bg-muted text-base leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Overview */}
        <section className="px-4 py-3 border-b border-border">
          <SectionHeader title="Overview" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
            <DetailRow
              label="Status"
              value={
                <span className={cn('px-1.5 py-0.5 rounded font-semibold text-[11px]', getStatusStyle(status))}>
                  {status}
                </span>
              }
            />
            <DetailRow label="Duration" value={formatDuration(seconds)} />
            {ip && <DetailRow label="IP" value={ip} />}
            {time && <DetailRow label="Time" value={time} />}
            {request_id && (
              <DetailRow
                label="Request ID"
                value={
                  <span className="inline-flex items-center gap-2">
                    {request_id as string}
                    <CopyButton value={request_id as string} />
                  </span>
                }
              />
            )}
          </dl>
        </section>

        {/* Jobs triggered by this request */}
        {jobGroups.length > 0 && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title={`Jobs (${jobGroups.length})`} />
            <div className="flex flex-col gap-3">
              {jobGroups.map(group => (
                <JobGroupCard key={group.job_id} group={group} />
              ))}
            </div>
          </section>
        )}

        {/* Other request logs (no job_id) */}
        {requestLogs.length > 0 && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title={`Logs (${requestLogs.length})`} />
            <div className="flex flex-col border border-border rounded overflow-hidden">
              {requestLogs.map((log, i) => <UpdateRow key={i} entry={log} />)}
            </div>
          </section>
        )}

        {/* Request body */}
        {request !== undefined && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title="Request" copyValue={request} />
            <JsonViewer data={request} />
          </section>
        )}

        {/* Extra fields */}
        {hasExtra && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title="Extra" copyValue={extra} />
            <JsonViewer data={extra} />
          </section>
        )}

        {/* Response body */}
        {response !== undefined && (
          <section className="px-4 py-3">
            <SectionHeader title="Response" copyValue={response} />
            <JsonViewer data={response} />
          </section>
        )}
      </div>
    </div>
  )
}
