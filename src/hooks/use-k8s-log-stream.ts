'use client'

import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@/types/log'

const MAX_LOGS = 5000

export interface K8sPodTarget {
  pod: string
  container: string
}

export interface K8sStreamParams {
  context: string
  namespace: string
  pods: K8sPodTarget[]
}

export function useK8sLogStream(params: K8sStreamParams | null, active: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seqRef = useRef(0)

  const key = params
    ? `${params.context}/${params.namespace}/${params.pods.map(p => `${p.pod}:${p.container}`).join(',')}`
    : ''

  useEffect(() => {
    if (!key || !active || !params) return

    setLogs([])
    setConnected(false)
    setError(null)

    const podsParam = params.pods.map(p => `${p.pod}:${p.container}`).join(',')
    const url = `/api/k8s/logs?context=${encodeURIComponent(params.context)}&namespace=${encodeURIComponent(params.namespace)}&pods=${encodeURIComponent(podsParam)}`
    const es = new EventSource(url)

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
  }, [key, active])

  return { logs, connected, error, clear: () => setLogs([]) }
}
