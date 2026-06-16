'use client'

import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@/types/log'

const MAX_LOGS = 5000

export function useLogStream(containerId: string | null, active: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seqRef = useRef(0)

  useEffect(() => {
    if (!containerId || !active) return

    seqRef.current = 0
    setLogs([])
    setConnected(false)
    setError(null)

    const es = new EventSource(`/api/containers/${containerId}/logs`)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      const entry: LogEntry = JSON.parse(e.data)
      if (entry._error) {
        setError(entry._error as string)
        return
      }
      setLogs(prev => {
        const next = [...prev, entry]
        return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next
      })
    }

    es.onerror = () => {
      setConnected(false)
      setError('Connection lost — reconnecting…')
    }

    return () => es.close()
  }, [containerId, active])

  return { logs, connected, error, clear: () => setLogs([]) }
}
