'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSource } from '@/contexts/source-context'
import { useConnectionStatus } from '@/contexts/connection-status-context'
import { cn } from '@/lib/utils'

type Step = 'pick-source' | 'pick-context' | 'pick-namespace'

interface K8sContext {
  name: string
  cluster: string
  user: string
}

export function SourceSwitcher() {
  const { mode, k8s, recentConnections, switchToLocal, switchToK8s, removeFromHistory } = useSource()
  const { connected, error } = useConnectionStatus()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('pick-source')
  const [contexts, setContexts] = useState<K8sContext[]>([])
  const [namespaces, setNamespaces] = useState<string[]>([])
  const [selectedContext, setSelectedContext] = useState('')
  const [selectedNamespace, setSelectedNamespace] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const openDialog = () => {
    setStep('pick-source')
    setFetchError(null)
    setOpen(true)
  }

  const handlePickK8s = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/k8s/contexts')
      if (!res.ok) throw new Error('Failed to load contexts')
      const data: K8sContext[] = await res.json()
      setContexts(data)
      setSelectedContext(data[0]?.name ?? '')

      // Auto-connect when allowlist has exactly 1 context + 1 namespace
      if (data.length === 1) {
        const nsRes = await fetch(`/api/k8s/namespaces?context=${encodeURIComponent(data[0].name)}`)
        if (nsRes.ok) {
          const nsData: string[] = await nsRes.json()
          if (nsData.length === 1) {
            switchToK8s({ context: data[0].name, namespace: nsData[0] })
            setOpen(false)
            return
          }
          setNamespaces(nsData)
          setSelectedNamespace(nsData[0] ?? '')
          setSelectedContext(data[0].name)
          setStep('pick-namespace')
          return
        }
      }

      setStep('pick-context')
    } catch (e) {
      setFetchError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handlePickContext = async () => {
    if (!selectedContext) return
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/k8s/namespaces?context=${encodeURIComponent(selectedContext)}`)
      if (!res.ok) throw new Error('Failed to load namespaces')
      const data: string[] = await res.json()
      setNamespaces(data)
      setSelectedNamespace(data[0] ?? '')
      setStep('pick-namespace')
    } catch (e) {
      setFetchError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    switchToK8s({ context: selectedContext, namespace: selectedNamespace })
    setOpen(false)
  }

  // Status chip appearance
  const isK8s = mode === 'k8s'
  const chipColor = error
    ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700'
    : connected
    ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-700'
    : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-700'
  const dotColor = error ? 'bg-red-500' : connected ? 'bg-green-500' : 'bg-amber-500'

  const chipLabel = isK8s && k8s
    ? `${k8s.context.split('/').pop()} / ${k8s.namespace}`
    : error ? 'Error' : connected ? 'Local' : 'Connecting…'

  return (
    <>
      <button
        onClick={openDialog}
        className={cn('h-6 px-2 flex items-center gap-1.5 text-xs rounded-full border cursor-pointer hover:opacity-80 transition-opacity w-[150px] sm:w-auto', chipColor)}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />
        <span className="flex-1 min-w-0 truncate">{chipLabel}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Connect to source</DialogTitle>
          </DialogHeader>

          {step === 'pick-source' && (
            <div className="flex flex-col gap-2 pt-1">
              {process.env.NEXT_PUBLIC_DISABLE_LOCAL_DOCKER !== 'true' && (
                <SourceOption
                  title="Local Docker"
                  description="Stream logs from containers on this machine"
                  active={mode === 'local'}
                  onClick={() => { switchToLocal(); setOpen(false) }}
                />
              )}
              <SourceOption
                title="Kubernetes"
                description="Connect to a cluster via ~/.kube/config"
                active={mode === 'k8s'}
                onClick={handlePickK8s}
                loading={loading}
              />
              {fetchError && <p className="text-xs text-destructive">{fetchError}</p>}

              {recentConnections.length > 0 && (
                <div className="mt-1">
                  <div className="border-t border-border mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-2">Connection History</p>
                  <div className="flex flex-col gap-2">
                    {recentConnections.map(conn => {
                      const isActive = mode === 'k8s' && k8s?.context === conn.context && k8s?.namespace === conn.namespace
                      return (
                        <div
                          key={`${conn.context}/${conn.namespace}`}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                            isActive ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border hover:bg-muted'
                          )}
                        >
                          <button
                            className="flex-1 flex flex-col items-start min-w-0 text-left"
                            onClick={() => { switchToK8s(conn); setOpen(false) }}
                          >
                            <span className="text-sm font-semibold text-foreground truncate w-full">
                              {conn.namespace}
                            </span>
                            <span className="text-xs text-muted-foreground truncate w-full mt-0.5">
                              {conn.context.split('/').pop()}
                            </span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFromHistory(conn) }}
                            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                            aria-label="Remove"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'pick-context' && (
            <div className="flex flex-col gap-3 pt-1">
              <p className="text-sm text-muted-foreground">Choose a cluster context</p>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {contexts.map(ctx => (
                  <button
                    key={ctx.name}
                    onClick={() => setSelectedContext(ctx.name)}
                    className={cn(
                      'flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-colors hover:bg-muted',
                      selectedContext === ctx.name ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <span className="text-sm font-medium truncate w-full">{ctx.name}</span>
                    <span className="text-[11px] text-muted-foreground">{ctx.cluster}</span>
                  </button>
                ))}
              </div>
              {fetchError && <p className="text-xs text-destructive">{fetchError}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setStep('pick-source')}>Back</Button>
                <Button size="sm" onClick={handlePickContext} disabled={!selectedContext || loading}>
                  {loading ? 'Loading…' : 'Next'}
                </Button>
              </div>
            </div>
          )}

          {step === 'pick-namespace' && (
            <div className="flex flex-col gap-3 pt-1">
              <p className="text-sm text-muted-foreground">Choose a namespace in <strong>{selectedContext}</strong></p>
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {namespaces.map(ns => (
                  <button
                    key={ns}
                    onClick={() => setSelectedNamespace(ns)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-left text-sm transition-colors hover:bg-muted',
                      selectedNamespace === ns ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    {ns}
                  </button>
                ))}
              </div>
              {fetchError && <p className="text-xs text-destructive">{fetchError}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setStep('pick-context')}>Back</Button>
                <Button size="sm" onClick={handleConnect} disabled={!selectedNamespace}>
                  Connect
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function SourceOption({ title, description, active, onClick, loading }: {
  title: string
  description: string
  active: boolean
  onClick: () => void
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-colors hover:bg-muted w-full',
        active ? 'border-primary bg-primary/5' : 'border-border'
      )}
    >
      <span className="text-sm font-medium flex items-center gap-2">
        {title}
        {active && <span className="text-[10px] text-primary font-semibold uppercase tracking-wide">active</span>}
        {loading && <span className="text-[10px] text-muted-foreground">loading…</span>}
      </span>
      <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
    </button>
  )
}
