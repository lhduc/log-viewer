'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'log-viewer-settings'
const DEFAULT_EXCLUDED_URLS = ['/health']

interface Settings {
  excludedUrls: string[]
  excludedJobs: string[]
}

interface SettingsContextValue extends Settings {
  addExcludedUrl: (url: string) => void
  removeExcludedUrl: (url: string) => void
  isExcluded: (uri: string) => boolean
  addExcludedJob: (jobType: string) => void
  removeExcludedJob: (jobType: string) => void
  isJobExcluded: (jobType: string) => boolean
}

const SettingsContext = createContext<SettingsContextValue>({
  excludedUrls: DEFAULT_EXCLUDED_URLS,
  excludedJobs: [],
  addExcludedUrl: () => {},
  removeExcludedUrl: () => {},
  isExcluded: () => false,
  addExcludedJob: () => {},
  removeExcludedJob: () => {},
  isJobExcluded: () => false,
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [excludedUrls, setExcludedUrls] = useState<string[]>(DEFAULT_EXCLUDED_URLS)
  const [excludedJobs, setExcludedJobs] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: Settings = JSON.parse(stored)
        if (Array.isArray(parsed.excludedUrls)) setExcludedUrls(parsed.excludedUrls)
        if (Array.isArray(parsed.excludedJobs)) setExcludedJobs(parsed.excludedJobs)
      }
    } catch { /* ignore */ }
  }, [])

  const persistAll = (urls: string[], jobs: string[]) => {
    setExcludedUrls(urls)
    setExcludedJobs(jobs)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ excludedUrls: urls, excludedJobs: jobs })) } catch { /* ignore */ }
  }

  const addExcludedUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed || excludedUrls.includes(trimmed)) return
    persistAll([...excludedUrls, trimmed], excludedJobs)
  }

  const removeExcludedUrl = (url: string) => persistAll(excludedUrls.filter(u => u !== url), excludedJobs)

  const isExcluded = (uri: string) => excludedUrls.some(pattern => uri.startsWith(pattern) || uri === pattern)

  const addExcludedJob = (jobType: string) => {
    const trimmed = jobType.trim()
    if (!trimmed || excludedJobs.includes(trimmed)) return
    persistAll(excludedUrls, [...excludedJobs, trimmed])
  }

  const removeExcludedJob = (jobType: string) => persistAll(excludedUrls, excludedJobs.filter(j => j !== jobType))

  const isJobExcluded = (jobType: string) => excludedJobs.some(pattern => jobType.startsWith(pattern) || jobType === pattern)

  return (
    <SettingsContext.Provider value={{ excludedUrls, excludedJobs, addExcludedUrl, removeExcludedUrl, isExcluded, addExcludedJob, removeExcludedJob, isJobExcluded }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
