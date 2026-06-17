'use client'

import { useState } from 'react'
import type { HttpLogEntry, LogEntry } from '@/types/log'
import { formatDuration, getMethodStyle, getStatusStyle } from '@/lib/request-utils'
import { groupJobs, getJobDuration, hasJobId, type JobGroup } from '@/lib/job-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { useTimeMode } from '@/contexts/time-mode-context'
import { JsonViewer } from './json-viewer'
import { CopyButton } from './copy-button'
import { JobGroupCard, UpdateRow } from './job-group-card'
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

export function RequestDetail({ entry, onClose, jobs }: RequestDetailProps) {
  const { mode } = useTimeMode()
  const utc = mode === 'utc'
  const time = formatTimestamp(entry.timestamp ?? (entry as Record<string, unknown>).time ?? (entry as Record<string, unknown>).ts, utc)

  const { _stream, _raw, _seq, method, uri, status, seconds, ip, request_id, username, request, response, timestamp, level, msg, message, time: _t, ts: _ts, ...extra } = entry as HttpLogEntry & Record<string, unknown>
  const hasExtra = Object.keys(extra).length > 0

  const jobEntries = jobs.filter(hasJobId)
  const requestLogs = jobs.filter(e => !hasJobId(e))
  const jobGroups = groupJobs(jobEntries)

  type TimelineItem =
    | { kind: 'job'; group: JobGroup; t: number }
    | { kind: 'log'; entry: LogEntry; t: number }

  const toMs = (v: unknown) => {
    const s = typeof v === 'string' ? v : ''
    const n = Date.parse(s)
    return isNaN(n) ? 0 : n
  }

  const timeline: TimelineItem[] = [
    ...jobGroups.map(group => ({
      kind: 'job' as const,
      group,
      t: toMs(
        (group.started as Record<string,unknown> | undefined)?.timestamp
        ?? (group.updates[0] as Record<string,unknown> | undefined)?.timestamp
        ?? (group.completed as Record<string,unknown> | undefined)?.timestamp
      ),
    })),
    ...requestLogs.map(entry => ({
      kind: 'log' as const,
      entry,
      t: toMs((entry as Record<string,unknown>).timestamp ?? (entry as Record<string,unknown>).time),
    })),
  ].sort((a, b) => a.t - b.t)

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
            {username && <DetailRow label="Username" value={`@${username as string}`} />}
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

        {/* Unified chronological timeline */}
        {timeline.length > 0 && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title={`Timeline (${timeline.length})`} />
            <div className="flex flex-col gap-2">
              {timeline.map((item, i) =>
                item.kind === 'job'
                  ? <JobGroupCard key={item.group.job_id} group={item.group} />
                  : (
                    <div key={i} className="border border-border rounded overflow-hidden">
                      <UpdateRow entry={item.entry} />
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {request !== undefined && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title="Request" copyValue={request} />
            <JsonViewer data={request} />
          </section>
        )}

        {hasExtra && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title="Extra" copyValue={extra} />
            <JsonViewer data={extra} />
          </section>
        )}

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
