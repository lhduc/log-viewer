'use client'

import { useEffect, useState } from 'react'
import type { K8sPod } from '@/lib/k8s-client'
import type { K8sPodTarget } from '@/hooks/use-k8s-log-stream'
import { isInfraService } from '@/lib/service-filter'
import { useSource } from '@/contexts/source-context'
import { useConnectionStatus } from '@/contexts/connection-status-context'
import { useK8sLogStream } from '@/hooks/use-k8s-log-stream'
import { LogPanel } from './log-panel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type View = 'api' | 'scheduler'

interface ServiceGroup {
  service: string
  pods: K8sPod[]
}

// Find the longest common prefix that ends on a '-' boundary.
function detectPrefix(names: string[]): string {
  if (names.length === 0) return ''
  let prefix = names[0]
  for (const name of names.slice(1)) {
    while (prefix && !name.startsWith(prefix)) prefix = prefix.slice(0, -1)
    if (!prefix) return ''
  }
  const lastDash = prefix.lastIndexOf('-')
  return lastDash >= 0 ? prefix.slice(0, lastDash + 1) : ''
}

// Group pods by service name: strip the common prefix, then take the first '-'-segment.
function groupByService(pods: K8sPod[]): ServiceGroup[] {
  const prefix = detectPrefix(pods.map(p => p.name))
  const map = new Map<string, K8sPod[]>()
  for (const pod of pods) {
    const stripped = pod.name.slice(prefix.length)
    // k8s pod names: <service>-<replicaset-hash>-<pod-hash>
    // First segment after prefix = service name
    const service = stripped.split('-')[0] || pod.name
    const list = map.get(service) ?? []
    list.push(pod)
    map.set(service, list)
  }
  return Array.from(map.entries())
    .map(([service, pods]) => ({ service, pods }))
    .sort((a, b) => a.service.localeCompare(b.service))
}

// Collect all pod:container targets for a service group.
function buildTargets(group: ServiceGroup): K8sPodTarget[] {
  return group.pods.flatMap(pod =>
    pod.containers.map(container => ({ pod: pod.name, container }))
  )
}

function K8sServicePanel({ context, namespace, service, pods, active, view }: {
  context: string
  namespace: string
  service: string
  pods: K8sPod[]
  active: boolean
  view: View
}) {
  const { setStatus } = useConnectionStatus()
  const targets = buildTargets({ service, pods })
  const { logs, connected, error, clear } = useK8sLogStream(
    { context, namespace, pods: targets },
    active
  )

  useEffect(() => {
    if (active) setStatus(connected, error)
  }, [active, connected, error, setStatus])

  return (
    <LogPanel
      containerIds={[]}
      active={active}
      view={view}
      externalLogs={logs}
      externalConnected={connected}
      externalError={error}
      onClear={clear}
    />
  )
}

export function K8sContainerTabs() {
  const { k8s } = useSource()
  const [pods, setPods] = useState<K8sPod[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeService, setActiveService] = useState<string | null>(null)
  const [view, setView] = useState<View>('api')

  const context = k8s?.context ?? ''
  const namespace = k8s?.namespace ?? ''

  const fetchPods = async () => {
    if (!context || !namespace) return
    try {
      const res = await fetch(`/api/k8s/pods?context=${encodeURIComponent(context)}&namespace=${encodeURIComponent(namespace)}`)
      if (!res.ok) {
        const data = await res.json()
        setFetchError(data.error ?? 'Failed to fetch pods')
        return
      }
      const data: K8sPod[] = await res.json()
      setPods(data)
      setActiveService(prev => {
        if (prev) return prev
        const groups = groupByService(data).filter(g => !isInfraService(g.service))
        return groups[0]?.service ?? null
      })
    } catch {
      setFetchError('Cannot reach server')
    }
  }

  useEffect(() => {
    setPods([])
    setFetchError(null)
    setActiveService(null)
    fetchPods()
    const interval = setInterval(fetchPods, 15_000)
    return () => clearInterval(interval)
  }, [context, namespace])

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-destructive text-sm">{fetchError}</p>
        <button onClick={() => { setFetchError(null); fetchPods() }} className="text-xs text-muted-foreground underline">Retry</button>
      </div>
    )
  }

  if (pods.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">
          {context ? `No pods found in ${namespace}` : 'Not connected'}
        </p>
      </div>
    )
  }

  const groups = groupByService(pods).filter(g => !isInfraService(g.service))

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center border-b border-border bg-muted h-10">
        <div className="flex items-end gap-0 px-3 overflow-x-auto flex-1 h-full scrollbar-hide">
          {groups.map(({ service, pods: groupPods }) => {
            const active = service === activeService
            const podCount = groupPods.length
            return (
              <button
                key={service}
                onClick={() => setActiveService(service)}
                title={groupPods.map(p => p.name).join('\n')}
                className={cn(
                  'flex items-center gap-1.5 px-4 h-full text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <span className="font-semibold capitalize">{service}</span>
                {podCount > 1 && (
                  <span className="text-[10px] text-muted-foreground">×{podCount}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1 px-3 shrink-0">
          {(['api', 'scheduler'] as View[]).map(v => (
            <Button key={v} size="xs" variant={view === v ? 'default' : 'ghost'} onClick={() => setView(v)} className="capitalize">
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {groups.map(({ service, pods: groupPods }) => (
          <div key={service} className="h-full" style={{ display: service === activeService ? 'block' : 'none' }}>
            <K8sServicePanel
              context={context}
              namespace={namespace}
              service={service}
              pods={groupPods}
              active={service === activeService}
              view={view}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
