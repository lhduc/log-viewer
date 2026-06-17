'use client'

import { useEffect, useState } from 'react'
import type { ContainerInfo } from '@/types/log'
import { LogPanel } from './log-panel'
import { cn } from '@/lib/utils'

type View = 'api' | 'scheduler'

interface ProjectGroup {
  project: string
  containers: ContainerInfo[]
}

function groupByProject(containers: ContainerInfo[]): ProjectGroup[] {
  const map = new Map<string, ContainerInfo[]>()
  for (const c of containers) {
    const list = map.get(c.project) ?? []
    list.push(c)
    map.set(c.project, list)
  }
  return Array.from(map.entries())
    .map(([project, containers]) => ({ project, containers }))
    .sort((a, b) => a.project.localeCompare(b.project))
}

export function ContainerTabs() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [view, setView] = useState<View>('api')

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
      setActiveProject(prev => {
        if (prev) return prev
        const groups = groupByProject(data.filter(c => c.project !== 'common'))
        return groups[0]?.project ?? null
      })
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

  // Exclude shared infrastructure project
  const groups = groupByProject(containers.filter(c => c.project !== 'common'))

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: project tabs left, API/Scheduler view switcher right */}
      <div className="shrink-0 flex items-end border-b border-border bg-muted/60 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Project tabs */}
        <div className="flex items-end gap-0 px-3 overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {groups.map(({ project, containers: cs }) => {
            const active = project === activeProject
            return (
              <button
                key={project}
                onClick={() => setActiveProject(project)}
                title={cs.map(c => c.name).join('\n')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <span className="font-semibold">{project}</span>
                <span className={cn('text-[10px] font-mono', active ? 'text-muted-foreground' : 'text-muted-foreground/50')}>
                  {cs.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* View switcher — right side */}
        <div className="flex items-center gap-0 px-3 pb-0 shrink-0">
          {(['api', 'scheduler'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-2 text-[11px] font-medium border-b-2 transition-colors capitalize',
                view === v
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* One LogPanel per project — all mounted, display:none for inactive to preserve streams */}
      <div className="flex-1 min-h-0">
        {groups.map(({ project, containers: cs }) => (
          <div
            key={project}
            className="h-full"
            style={{ display: project === activeProject ? 'block' : 'none' }}
          >
            <LogPanel
              containerIds={cs.map(c => c.id)}
              active={project === activeProject}
              view={view}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
