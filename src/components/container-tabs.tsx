'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ContainerInfo } from '@/types/log'
import { LogPanel } from './log-panel'

export function ContainerTabs() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('')

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
      setActiveTab(prev => prev || (data.length > 0 ? data[0].id : ''))
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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      <TabsList className="flex shrink-0 h-9 w-full bg-muted border-b border-border rounded-none justify-start px-2 gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
        {containers.map(c => (
          <TabsTrigger
            key={c.id}
            value={c.id}
            className="shrink-0 text-xs h-7 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <span
              className={`mr-1.5 h-1.5 w-1.5 rounded-full inline-block ${
                c.state === 'running' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {c.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {containers.map(c => (
        <TabsContent key={c.id} value={c.id} className="flex-1 mt-0 min-h-0">
          <LogPanel containerId={c.id} active={activeTab === c.id} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
