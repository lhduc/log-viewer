'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface ConnectionStatus {
  connected: boolean
  error: string | null
}

interface ConnectionStatusContextValue extends ConnectionStatus {
  setStatus: (connected: boolean, error: string | null) => void
}

const ConnectionStatusContext = createContext<ConnectionStatusContextValue>({
  connected: false,
  error: null,
  setStatus: () => {},
})

export function ConnectionStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatusState] = useState<ConnectionStatus>({ connected: false, error: null })
  const setStatus = useCallback((connected: boolean, error: string | null) => {
    setStatusState({ connected, error })
  }, [])
  return (
    <ConnectionStatusContext.Provider value={{ ...status, setStatus }}>
      {children}
    </ConnectionStatusContext.Provider>
  )
}

export function useConnectionStatus() {
  return useContext(ConnectionStatusContext)
}
