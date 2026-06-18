'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'log-viewer-settings'
const DEFAULT_EXCLUDED_URLS = ['/health']

interface Settings {
  excludedUrls: string[]
}

interface SettingsContextValue extends Settings {
  addExcludedUrl: (url: string) => void
  removeExcludedUrl: (url: string) => void
  isExcluded: (uri: string) => boolean
}

const SettingsContext = createContext<SettingsContextValue>({
  excludedUrls: DEFAULT_EXCLUDED_URLS,
  addExcludedUrl: () => {},
  removeExcludedUrl: () => {},
  isExcluded: () => false,
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [excludedUrls, setExcludedUrls] = useState<string[]>(DEFAULT_EXCLUDED_URLS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: Settings = JSON.parse(stored)
        if (Array.isArray(parsed.excludedUrls)) setExcludedUrls(parsed.excludedUrls)
      }
    } catch { /* ignore */ }
  }, [])

  const persist = (urls: string[]) => {
    setExcludedUrls(urls)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ excludedUrls: urls })) } catch { /* ignore */ }
  }

  const addExcludedUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed || excludedUrls.includes(trimmed)) return
    persist([...excludedUrls, trimmed])
  }

  const removeExcludedUrl = (url: string) => persist(excludedUrls.filter(u => u !== url))

  const isExcluded = (uri: string) => excludedUrls.some(pattern => uri.startsWith(pattern) || uri === pattern)

  return (
    <SettingsContext.Provider value={{ excludedUrls, addExcludedUrl, removeExcludedUrl, isExcluded }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
