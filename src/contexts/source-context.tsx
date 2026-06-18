'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export type SourceMode = 'local' | 'k8s'

export interface K8sConnection {
  context: string
  namespace: string
}

interface SourceContextValue {
  mode: SourceMode
  k8s: K8sConnection | null
  switchToLocal: () => void
  switchToK8s: (conn: K8sConnection) => void
}

const SourceContext = createContext<SourceContextValue>({
  mode: 'local',
  k8s: null,
  switchToLocal: () => {},
  switchToK8s: () => {},
})

export function SourceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<SourceMode>('local')
  const [k8s, setK8s] = useState<K8sConnection | null>(null)

  const switchToLocal = useCallback(() => { setMode('local'); setK8s(null) }, [])
  const switchToK8s = useCallback((conn: K8sConnection) => { setK8s(conn); setMode('k8s') }, [])

  return (
    <SourceContext.Provider value={{ mode, k8s, switchToLocal, switchToK8s }}>
      {children}
    </SourceContext.Provider>
  )
}

export function useSource() {
  return useContext(SourceContext)
}
