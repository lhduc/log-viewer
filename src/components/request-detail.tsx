'use client'

import type { HttpLogEntry, JobEntry } from '@/types/log'
import { formatDuration, getMethodStyle, getStatusStyle } from '@/lib/request-utils'
import { groupJobs, getJobDuration } from '@/lib/job-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { JsonViewer } from './json-viewer'
import { CopyButton } from './copy-button'
import { cn } from '@/lib/utils'

interface RequestDetailProps {
  entry: HttpLogEntry
  onClose: () => void
  jobs: JobEntry[]
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

export function RequestDetail({ entry, onClose, jobs }: RequestDetailProps) {
  const time = formatTimestamp(entry.timestamp ?? (entry as Record<string, unknown>).time ?? (entry as Record<string, unknown>).ts)

  const { _stream, _raw, _seq, method, uri, status, seconds, ip, request_id, request, response, timestamp, level, msg, message, time: _t, ts: _ts, ...extra } = entry as HttpLogEntry & Record<string, unknown>
  const hasExtra = Object.keys(extra).length > 0

  const jobGroups = groupJobs(jobs)

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
            <div className="flex flex-col gap-1.5">
              {jobGroups.map(group => {
                const duration = getJobDuration(group)
                const isCompleted = !!group.completed
                const isRunning = !!group.started && !group.completed
                return (
                  <div key={group.job_id} className="flex items-start gap-2 text-xs">
                    <span className={cn('shrink-0 mt-0.5 font-bold', isCompleted ? 'text-green-500' : isRunning ? 'text-amber-500' : 'text-muted-foreground')}>
                      {isCompleted ? '✓' : isRunning ? '…' : '?'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-foreground">{group.type}</span>
                        {duration && <span className="text-muted-foreground">{duration}</span>}
                        {isRunning && <span className="text-amber-500">running</span>}
                      </div>
                      <div className="text-muted-foreground font-mono text-[10px] mt-0.5 flex gap-3">
                        <span title={group.job_id}>{group.job_id.slice(0, 8)}…</span>
                        {group.started?.retry !== undefined && group.started?.max_retry !== undefined && (
                          <span>retry {group.started.retry}/{group.started.max_retry}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
