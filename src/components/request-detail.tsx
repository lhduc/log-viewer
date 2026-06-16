'use client'

import type { HttpLogEntry } from '@/types/log'
import { formatDuration, getMethodStyle, getStatusStyle } from '@/lib/request-utils'
import { formatTimestamp } from '@/lib/log-utils'
import { cn } from '@/lib/utils'

interface RequestDetailProps {
  entry: HttpLogEntry
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono break-all">{value}</dd>
    </>
  )
}

export function RequestDetail({ entry, onClose }: RequestDetailProps) {
  const time = formatTimestamp(entry.timestamp ?? (entry as Record<string, unknown>).time ?? (entry as Record<string, unknown>).ts)

  // Extract known fields, leave the rest as "extra"
  const { _stream, _raw, _seq, method, uri, status, seconds, ip, request_id, response, timestamp, level, msg, message, time: _t, ts: _ts, ...extra } = entry as HttpLogEntry & Record<string, unknown>
  const hasExtra = Object.keys(extra).length > 0

  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0 min-w-0">
        <span className={cn(
          'shrink-0 px-1.5 py-0.5 rounded border font-mono font-bold text-[10px] uppercase',
          getMethodStyle(method)
        )}>
          {method}
        </span>
        <span className="flex-1 font-mono text-sm text-foreground truncate" title={uri}>{uri}</span>
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
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overview</h3>
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
            {request_id && <DetailRow label="Request ID" value={request_id as string} />}
          </dl>
        </section>

        {/* Response body */}
        {response !== undefined && (
          <section className="px-4 py-3 border-b border-border">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Response</h3>
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all bg-muted/40 rounded p-3 leading-relaxed">
              {JSON.stringify(response, null, 2)}
            </pre>
          </section>
        )}

        {/* Extra fields */}
        {hasExtra && (
          <section className="px-4 py-3">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Extra</h3>
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all bg-muted/40 rounded p-3 leading-relaxed">
              {JSON.stringify(extra, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </div>
  )
}
