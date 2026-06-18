'use client'

import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@/types/log'

const MAX_LOGS = 5000

export function useLogStream(containerIds: string[], active: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idsKey = containerIds.join(',')
  // Client-side seq never resets — survives SSE reconnects without key collisions
  const seqRef = useRef(0)

  useEffect(() => {
    if (!idsKey || !active) return

    setLogs([])
    setConnected(false)
    setError(null)

    // Single SSE connection for all containers — avoids browser 6-connection limit
    const es = new EventSource(`/api/logs?containers=${idsKey}`)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      const entry: LogEntry = JSON.parse(e.data)
      if (entry._error) {
        setError(entry._error as string)
        return
      }
      entry._seq = seqRef.current++
      setLogs(prev => {
        const next = [...prev, entry]
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next
      })
    }

    es.onerror = () => {
      setConnected(false)
      setError('Connection lost — reconnecting…')
    }

    return () => es.close()
  }, [idsKey, active])

  return { logs, connected, error, clear: () => setLogs([]) }
}
