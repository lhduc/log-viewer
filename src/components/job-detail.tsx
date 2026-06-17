'use client'

import type { JobGroup } from '@/lib/job-utils'
import { getJobDuration } from '@/lib/job-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { useTimeMode } from '@/contexts/time-mode-context'
import { CopyButton } from './copy-button'
import { UpdateRow, isFailed, callerFile } from './job-group-card'
import { cn } from '@/lib/utils'

interface JobDetailProps {
  group: JobGroup
  onClose: () => void
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono break-all">{value}</dd>
    </>
  )
}

export function JobDetail({ group, onClose }: JobDetailProps) {
  const { mode } = useTimeMode()
  const utc = mode === 'utc'
  const { job_id, type, started, completed, updates } = group

  const failed = isFailed(completed)
  const isCompleted = !!completed
  const isRunning = !!started && !completed
  const duration = getJobDuration(group)

  const startedE = started as Record<string, unknown> | undefined
  const completedE = completed as Record<string, unknown> | undefined
  const retry = typeof startedE?.retry === 'number' ? startedE.retry as number : undefined
  const maxRetry = typeof startedE?.max_retry === 'number' ? startedE.max_retry as number : undefined
  const username = typeof startedE?.username === 'string' ? startedE.username : undefined
  const errorDetail = (completedE?.error as string | undefined) ?? (completedE?.exception as string | undefined)

  const statusLabel = failed ? 'Failed' : isCompleted ? 'Completed' : isRunning ? 'Running' : 'Pending'
  const statusClass = failed
    ? 'text-red-500 bg-red-500/10 border-red-500/40'
    : isCompleted
    ? 'text-green-600 bg-green-500/10 border-green-500/40 dark:text-green-400'
    : isRunning
    ? 'text-amber-500 bg-amber-500/10 border-amber-500/40'
    : 'text-muted-foreground border-border'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0 min-w-0">
        <span className={cn('shrink-0 px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] uppercase', statusClass)}>
          {statusLabel}
        </span>
        <span className="flex-1 font-mono text-sm text-foreground truncate" title={type}>{type}</span>
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
              label="Job ID"
              value={
                <span className="inline-flex items-center gap-2">
                  {job_id}
                  <CopyButton value={job_id} />
                </span>
              }
            />
            {username && (
              <DetailRow
                label="Username"
                value={
                  <span className="inline-flex items-center gap-2">
                    {username}
                    <CopyButton value={username} />
                  </span>
                }
              />
            )}
            {duration && <DetailRow label="Duration" value={duration} />}
            {retry !== undefined && maxRetry !== undefined && (
              <DetailRow label="Retry" value={`${retry} / ${maxRetry}`} />
            )}
            {typeof startedE?.timestamp === 'string' && (
              <DetailRow label="Started" value={formatTimestamp(startedE.timestamp, utc)} />
            )}
            {typeof completedE?.timestamp === 'string' && (
              <DetailRow label="Completed" value={formatTimestamp(completedE.timestamp, utc)} />
            )}
          </dl>
        </section>

        {/* Timeline */}
        {(started || updates.length > 0 || completed) && (
          <section className="px-4 py-3 border-b border-border">
            <SectionHeader title={`Timeline (${(started ? 1 : 0) + updates.length + (completed ? 1 : 0)})`} />
            <div className="border border-border rounded overflow-hidden flex flex-col">
              {started && (
                <div className="flex items-start gap-2 px-2.5 py-1.5 text-muted-foreground/70 border-b border-border/40">
                  <span className="shrink-0 text-[10px] mt-0.5">▶</span>
                  <span className="flex-1 break-all font-mono text-xs">{typeof startedE?.msg === 'string' ? startedE.msg : ''}</span>
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    {typeof startedE?.timestamp === 'string' && (
                      <span className="text-muted-foreground/50 text-[10px] font-mono">{formatTimestamp(startedE.timestamp, utc, true)}</span>
                    )}
                    {typeof startedE?.caller === 'string' && (
                      <span className="text-muted-foreground/40 text-[10px] font-mono">{callerFile(startedE.caller)}</span>
                    )}
                  </div>
                </div>
              )}
              {updates.map((u, i) => <UpdateRow key={i} entry={u} />)}
              {completed && (
                <div className={cn('flex items-start gap-2 px-2.5 py-1.5', failed ? 'text-red-400' : 'text-muted-foreground/70')}>
                  <span className="shrink-0 text-[10px] mt-0.5">{failed ? '✕' : '■'}</span>
                  <span className="flex-1 break-all font-mono text-xs">{typeof completedE?.msg === 'string' ? completedE.msg : ''}</span>
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    {typeof completedE?.timestamp === 'string' && (
                      <span className="text-muted-foreground/50 text-[10px] font-mono">{formatTimestamp(completedE.timestamp, utc, true)}</span>
                    )}
                    {typeof completedE?.caller === 'string' && (
                      <span className="text-muted-foreground/40 text-[10px] font-mono">{callerFile(completedE.caller)}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Error detail */}
        {errorDetail && (
          <section className="px-4 py-3">
            <SectionHeader title="Error" />
            <pre className="font-mono text-[11px] break-all text-red-400 whitespace-pre-wrap bg-red-500/5 border border-red-500/20 rounded p-2">
              {errorDetail}
            </pre>
          </section>
        )}
      </div>
    </div>
  )
}
