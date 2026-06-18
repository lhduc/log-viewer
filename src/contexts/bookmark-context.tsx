'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { HttpLogEntry } from '@/types/log'

const STORAGE_KEY = 'log-viewer-bookmarks'

function load(): HttpLogEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

interface BookmarkContextValue {
  bookmarks: HttpLogEntry[]
  toggle: (entry: HttpLogEntry) => void
  isBookmarked: (requestId: string) => boolean
  remove: (requestId: string) => void
  clear: () => void
}

const BookmarkContext = createContext<BookmarkContextValue>({
  bookmarks: [],
  toggle: () => {},
  isBookmarked: () => false,
  remove: () => {},
  clear: () => {},
})

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<HttpLogEntry[]>([])

  useEffect(() => { setBookmarks(load()) }, [])

  const save = (next: HttpLogEntry[]) => {
    setBookmarks(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const toggle = useCallback((entry: HttpLogEntry) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.request_id === entry.request_id && b._seq === entry._seq)
      const next = exists
        ? prev.filter(b => !(b.request_id === entry.request_id && b._seq === entry._seq))
        : [entry, ...prev].slice(0, 200)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const remove = useCallback((requestId: string) => {
    setBookmarks(prev => {
      const next = prev.filter(b => b.request_id !== requestId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => { save([]) }, [])

  const isBookmarked = useCallback((requestId: string) =>
    bookmarks.some(b => b.request_id === requestId), [bookmarks])

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggle, isBookmarked, remove, clear }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks() {
  return useContext(BookmarkContext)
}
