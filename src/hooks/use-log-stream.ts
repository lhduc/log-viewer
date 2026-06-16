'use client'

import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@/types/log'

const MAX_LOGS = 5000

export function useLogStream(containerIds: string[], active: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seqRef = useRef(0)
  const idsKey = containerIds.join(',')

  useEffect(() => {
    if (!idsKey || !active) return

    seqRef.current = 0
    setLogs([])
    setConnected(false)
    setError(null)

    const sources = containerIds.map(containerId => {
      const es = new EventSource(`/api/containers/${containerId}/logs`)

      es.onopen = () => setConnected(true)

      es.onmessage = (e) => {
        const entry: LogEntry = JSON.parse(e.data)
        if (entry._error) {
          setError(entry._error as string)
          return
        }
        // Override per-container _seq with a global counter across all streams
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

      return es
    })

    return () => sources.forEach(es => es.close())
  }, [idsKey, active])

  return { logs, connected, error, clear: () => setLogs([]) }
}
