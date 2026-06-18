'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { HttpLogEntry, LogEntry } from '@/types/log'

const STORAGE_KEY = 'log-viewer-bookmarks'

interface BookmarkRecord {
  entry: HttpLogEntry
  jobs: LogEntry[]
}

function load(): BookmarkRecord[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    // Migrate old format: flat HttpLogEntry[] → BookmarkRecord[]
    return raw
      .map((item: unknown) => {
        const r = item as Record<string, unknown>
        if (r.entry && typeof (r.entry as Record<string, unknown>).method === 'string') {
          return { entry: r.entry as HttpLogEntry, jobs: Array.isArray(r.jobs) ? r.jobs : [] }
        }
        // Old flat format: item itself is the HttpLogEntry
        if (typeof r.method === 'string') {
          return { entry: item as HttpLogEntry, jobs: [] }
        }
        return null
      })
      .filter(Boolean) as BookmarkRecord[]
  } catch { return [] }
}

interface BookmarkContextValue {
  records: BookmarkRecord[]
  // flat list of all logs (entry + jobs) ready to pass as externalLogs to LogPanel
  allLogs: LogEntry[]
  toggle: (entry: HttpLogEntry, jobs: LogEntry[]) => void
  isBookmarked: (requestId: string) => boolean
  clear: () => void
}

const BookmarkContext = createContext<BookmarkContextValue>({
  records: [],
  allLogs: [],
  toggle: () => {},
  isBookmarked: () => false,
  clear: () => {},
})

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<BookmarkRecord[]>([])

  useEffect(() => { setRecords(load()) }, [])

  const save = (next: BookmarkRecord[]) => {
    setRecords(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const toggle = useCallback((entry: HttpLogEntry, jobs: LogEntry[]) => {
    setRecords(prev => {
      const exists = prev.some(r => r.entry.request_id === entry.request_id && r.entry._seq === entry._seq)
      const next = exists
        ? prev.filter(r => !(r.entry.request_id === entry.request_id && r.entry._seq === entry._seq))
        : [{ entry, jobs }, ...prev].slice(0, 200)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => { save([]) }, [])

  const isBookmarked = useCallback((requestId: string) =>
    records.some(r => r.entry?.request_id === requestId), [records])

  const allLogs = useMemo<LogEntry[]>(
    () => records.flatMap(r => r.entry ? [r.entry as LogEntry, ...(r.jobs ?? [])] : []),
    [records]
  )

  return (
    <BookmarkContext.Provider value={{ records, allLogs, toggle, isBookmarked, clear }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks() {
  return useContext(BookmarkContext)
}
