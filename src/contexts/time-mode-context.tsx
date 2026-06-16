'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type TimeMode = 'local' | 'utc'

const KEY = 'log-viewer:time-mode'

interface TimeModeContextValue {
  mode: TimeMode
  toggle: () => void
}

const TimeModeContext = createContext<TimeModeContextValue>({ mode: 'local', toggle: () => {} })

export function TimeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<TimeMode>('local')

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    if (stored === 'utc') setModeState('utc')
  }, [])

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'local' ? 'utc' : 'local'
      localStorage.setItem(KEY, next)
      return next
    })
  }, [])

  return (
    <TimeModeContext.Provider value={{ mode, toggle }}>
      {children}
    </TimeModeContext.Provider>
  )
}

export function useTimeMode() {
  return useContext(TimeModeContext)
}
