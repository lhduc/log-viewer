import type { LogEntry, JobEntry } from '@/types/log'
import { formatDuration } from './request-utils'

export function isJobEntry(entry: LogEntry): entry is JobEntry {
  const e = entry as Record<string, unknown>
  return typeof e.type === 'string' && typeof e.job_id === 'string'
}

export function hasJobId(entry: LogEntry): boolean {
  return typeof (entry as Record<string, unknown>).job_id === 'string'
}

export interface JobGroup {
  job_id: string
  type: string
  started?: JobEntry
  completed?: JobEntry
  updates: LogEntry[]
}

export function groupJobs(entries: LogEntry[]): JobGroup[] {
  const map = new Map<string, JobGroup>()

  for (const entry of entries) {
    const e = entry as Record<string, unknown>
    const jobId = typeof e.job_id === 'string' ? e.job_id : null
    if (!jobId) continue

    const existing = map.get(jobId)

    if (isJobEntry(entry)) {
      const group: JobGroup = existing ?? { job_id: jobId, type: entry.type, updates: [] }
      if (entry.msg?.startsWith('Job started:')) {
        map.set(jobId, { ...group, type: entry.type, started: entry })
      } else {
        map.set(jobId, { ...group, type: entry.type, completed: entry })
      }
    } else {
      // Debug/polling update — derive type from the message prefix
      const msg = typeof e.msg === 'string' ? e.msg : ''
      const derivedType = msg.split(/[\s:]/)[0] ?? 'unknown'
      const group: JobGroup = existing ?? { job_id: jobId, type: derivedType, updates: [] }
      map.set(jobId, { ...group, updates: [...group.updates, entry] })
    }
  }

  return Array.from(map.values())
}

export function getJobDuration(group: JobGroup): string | null {
  if (group.completed?.seconds !== undefined) return formatDuration(group.completed.seconds)
  return null
}
