import type { LogEntry, HttpLogEntry } from '@/types/log'

export function isHttpEntry(entry: LogEntry): entry is HttpLogEntry {
  const e = entry as Record<string, unknown>
  return typeof e.method === 'string' &&
    typeof e.uri === 'string' &&
    typeof e.status === 'number'
}

export function formatDuration(seconds: number): string {
  const ms = seconds * 1000
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${seconds.toFixed(2)}s`
}

export function getUriPath(uri: string): string {
  const idx = uri.indexOf('?')
  return idx === -1 ? uri : uri.slice(0, idx)
}

export const METHOD_STYLES: Record<string, string> = {
  GET:    'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-300/50 dark:border-blue-700/50',
  POST:   'text-green-600 dark:text-green-400 bg-green-500/10 border-green-300/50 dark:border-green-700/50',
  PUT:    'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-300/50 dark:border-amber-700/50',
  PATCH:  'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-300/50 dark:border-orange-700/50',
  DELETE: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-300/50 dark:border-red-700/50',
}

export const STATUS_STYLES: Record<string, string> = {
  '2xx': 'text-green-600 dark:text-green-400 bg-green-500/10',
  '3xx': 'text-blue-500 dark:text-blue-400 bg-blue-500/10',
  '4xx': 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
  '5xx': 'text-red-600 dark:text-red-400 bg-red-500/10',
}

export function getMethodStyle(method: string): string {
  return METHOD_STYLES[method.toUpperCase()] ?? 'text-gray-500 bg-gray-500/10 border-gray-300/50'
}

export function getStatusStyle(status: number): string {
  if (status >= 500) return STATUS_STYLES['5xx']
  if (status >= 400) return STATUS_STYLES['4xx']
  if (status >= 300) return STATUS_STYLES['3xx']
  return STATUS_STYLES['2xx']
}

export function getStatusBucket(status: number): string {
  if (status >= 500) return '5xx'
  if (status >= 400) return '4xx'
  if (status >= 300) return '3xx'
  return '2xx'
}
