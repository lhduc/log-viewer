import { KubeConfig, CoreV1Api, Log } from '@kubernetes/client-node'
import { PassThrough } from 'stream'

export interface K8sContext {
  name: string
  cluster: string
  user: string
}

export interface K8sPod {
  name: string
  namespace: string
  containers: string[]
  status: string
}

function makeKubeConfig(contextName?: string): KubeConfig {
  const kc = new KubeConfig()
  kc.loadFromDefault()
  if (contextName) kc.setCurrentContext(contextName)
  return kc
}

export function listContexts(): K8sContext[] {
  const kc = new KubeConfig()
  kc.loadFromDefault()
  return (kc.getContexts() ?? []).map(ctx => ({
    name: ctx.name,
    cluster: ctx.cluster,
    user: ctx.user,
  }))
}

export async function listNamespaces(contextName: string): Promise<string[]> {
  const kc = makeKubeConfig(contextName)
  const api = kc.makeApiClient(CoreV1Api)
  const res = await api.listNamespace()
  return (res.items ?? [])
    .map(ns => ns.metadata?.name ?? '')
    .filter(Boolean)
    .sort()
}

export async function listPods(contextName: string, namespace: string): Promise<K8sPod[]> {
  const kc = makeKubeConfig(contextName)
  const api = kc.makeApiClient(CoreV1Api)
  const res = await api.listNamespacedPod({ namespace })
  return (res.items ?? []).map(pod => ({
    name: pod.metadata?.name ?? '',
    namespace,
    containers: (pod.spec?.containers ?? []).map(c => c.name),
    status: pod.status?.phase ?? 'Unknown',
  })).filter(p => p.name)
}

export async function streamPodLogs(
  contextName: string,
  namespace: string,
  podName: string,
  containerName: string,
  tailLines = 100,
): Promise<NodeJS.ReadableStream> {
  const kc = makeKubeConfig(contextName)
  const log = new Log(kc)
  const stream = new PassThrough()
  await log.log(namespace, podName, containerName, stream, () => stream.end(), {
    follow: true,
    tailLines,
    pretty: false,
    timestamps: false,
  })
  return stream
}
