'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type SourceMode = 'local' | 'k8s'

export interface K8sConnection {
  context: string
  namespace: string
}

const HISTORY_KEY = 'log-viewer-k8s-history'
const HISTORY_MAX = 5

function loadHistory(): K8sConnection[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveHistory(history: K8sConnection[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

function pushToHistory(history: K8sConnection[], conn: K8sConnection): K8sConnection[] {
  const deduped = history.filter(h => !(h.context === conn.context && h.namespace === conn.namespace))
  return [conn, ...deduped].slice(0, HISTORY_MAX)
}

interface SourceContextValue {
  mode: SourceMode
  k8s: K8sConnection | null
  recentConnections: K8sConnection[]
  switchToLocal: () => void
  switchToK8s: (conn: K8sConnection) => void
  removeFromHistory: (conn: K8sConnection) => void
}

const SourceContext = createContext<SourceContextValue>({
  mode: 'local',
  k8s: null,
  recentConnections: [],
  switchToLocal: () => {},
  switchToK8s: () => {},
  removeFromHistory: () => {},
})

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<SourceMode>('local')
  const [k8s, setK8s] = useState<K8sConnection | null>(null)
  const [recentConnections, setRecentConnections] = useState<K8sConnection[]>([])

  useEffect(() => {
    setRecentConnections(loadHistory())
  }, [])

  const switchToLocal = useCallback(() => { setMode('local'); setK8s(null) }, [])

  const switchToK8s = useCallback((conn: K8sConnection) => {
    setK8s(conn)
    setMode('k8s')
    setRecentConnections(prev => {
      const next = pushToHistory(prev, conn)
      saveHistory(next)
      return next
    })
  }, [])

  const removeFromHistory = useCallback((conn: K8sConnection) => {
    setRecentConnections(prev => {
      const next = prev.filter(h => !(h.context === conn.context && h.namespace === conn.namespace))
      saveHistory(next)
      return next
    })
  }, [])

  return (
    <SourceContext.Provider value={{ mode, k8s, recentConnections, switchToLocal, switchToK8s, removeFromHistory }}>
      {children}
    </SourceContext.Provider>
  )
}

export function useSource() {
  return useContext(SourceContext)
}
