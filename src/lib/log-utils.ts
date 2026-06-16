import { format } from 'date-fns'

export const LEVEL_STYLES: Record<string, string> = {
  fatal:   'text-red-700 dark:text-red-300 bg-red-100/60 dark:bg-red-950/40 font-semibold',
  error:   'text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20',
  warn:    'text-amber-600 dark:text-yellow-400',
  info:    'text-blue-600 dark:text-blue-400',
  debug:   'text-gray-500 dark:text-gray-500',
  trace:   'text-gray-400 dark:text-gray-600',
}

export const KNOWN_LEVELS = ['fatal', 'error', 'warn', 'warning', 'info', 'debug', 'trace']

// Normalize level variants to canonical chip values
const LEVEL_ALIASES: Record<string, string> = {
  warning: 'warn',
  critical: 'fatal',
  crit: 'fatal',
  verbose: 'trace',
}

export function getLevel(entry: Record<string, unknown>): string {
  const raw = String(entry.level ?? entry.severity ?? entry.lvl ?? '').toLowerCase()
  return LEVEL_ALIASES[raw] ?? raw
}

export function getMessage(entry: Record<string, unknown>): string {
  return String(entry.message ?? entry.msg ?? entry.body ?? JSON.stringify(entry))
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return ''
  try {
    return format(new Date(String(ts)), 'HH:mm:ss.SSS')
  } catch {
    return String(ts).slice(0, 12)
  }
}
