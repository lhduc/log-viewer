'use client'

import { useEffect, useState } from 'react'
import type { ContainerInfo } from '@/types/log'
import { LogPanel } from './log-panel'

export function ContainerTabs() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchContainers = async () => {
    try {
      const res = await fetch('/api/containers')
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to fetch containers')
        return
      }
      const data: ContainerInfo[] = await res.json()
      setContainers(data)
    } catch {
      setError('Cannot reach server')
    }
  }

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 10_000)
    return () => clearInterval(interval)
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
        <p className="text-destructive text-sm">{error}</p>
        <button
          onClick={() => { setError(null); fetchContainers() }}
          className="text-xs text-muted-foreground underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (containers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">No running containers found</p>
      </div>
    )
  }

  const projectContainerIds = containers
    .filter(c => !c.name.startsWith('share.'))
    .map(c => c.id)

  return (
    <LogPanel
      containerIds={projectContainerIds}
      active={true}
    />
  )
}
