'use client'

import { useEffect, useState } from 'react'
import type { ContainerInfo } from '@/types/log'
import { LogPanel } from './log-panel'
import { cn } from '@/lib/utils'

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

// null = all containers in project
function useContainerSelection() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const select = (id: string | null) => setSelectedId(id)
  return { selectedId, select }
}

export function ContainerTabs() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const { selectedId, select } = useContainerSelection()

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
        const groups = groupByProject(data)
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

  // Reset container selection when switching projects
  const switchProject = (project: string) => {
    setActiveProject(project)
    select(null)
  }

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

  const groups = groupByProject(containers)
  const activeGroup = groups.find(g => g.project === activeProject)
  const activeIds = activeGroup
    ? (selectedId ? [selectedId] : activeGroup.containers.map(c => c.id))
    : []

  const selectedContainer = activeGroup?.containers.find(c => c.id === selectedId)
  const isWorker = !!selectedContainer && selectedContainer.name.toLowerCase().includes('worker')

  return (
    <div className="flex flex-col h-full">
      {/* Project tabs */}
      <div className="shrink-0 flex items-end gap-0 px-3 border-b border-border bg-muted/60 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {groups.map(({ project, containers: cs }) => {
          const active = project === activeProject
          return (
            <button
              key={project}
              onClick={() => switchProject(project)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <span className="font-semibold">{project}</span>
              <span className={cn(
                'text-[10px] font-mono px-1 rounded',
                active ? 'text-muted-foreground' : 'text-muted-foreground/60'
              )}>
                {cs.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Container filter chips — only when project has multiple containers */}
      {activeGroup && activeGroup.containers.length > 1 && (
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-muted/30 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => select(null)}
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors whitespace-nowrap',
              selectedId === null
                ? 'border-primary/60 bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
            )}
          >
            All
          </button>
          {activeGroup.containers.map(c => (
            <button
              key={c.id}
              onClick={() => select(selectedId === c.id ? null : c.id)}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-mono border transition-colors whitespace-nowrap',
                selectedId === c.id
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Log panel — keyed by project so it remounts on project switch */}
      <div className="flex-1 min-h-0">
        {activeGroup && (
          <LogPanel
            key={`${activeProject}-${selectedId ?? 'all'}`}
            containerIds={activeIds}
            active={true}
            isWorker={isWorker}
          />
        )}
      </div>
    </div>
  )
}
