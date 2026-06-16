import type { LogEntry, JobEntry } from '@/types/log'
import { formatDuration } from './request-utils'

export function isJobEntry(entry: LogEntry): entry is JobEntry {
  const e = entry as Record<string, unknown>
  return typeof e.type === 'string' && typeof e.job_id === 'string'
}

export interface JobGroup {
  job_id: string
  type: string
  started?: JobEntry
  completed?: JobEntry
}

export function groupJobs(jobs: JobEntry[]): JobGroup[] {
  const map = new Map<string, JobGroup>()
  for (const job of jobs) {
    const existing = map.get(job.job_id) ?? { job_id: job.job_id, type: job.type }
    if (job.msg?.startsWith('Job started:')) {
      map.set(job.job_id, { ...existing, started: job })
    } else {
      map.set(job.job_id, { ...existing, completed: job })
    }
  }
  return Array.from(map.values())
}

export function getJobDuration(group: JobGroup): string | null {
  if (group.completed?.seconds !== undefined) return formatDuration(group.completed.seconds)
  return null
}
