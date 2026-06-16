import Docker from 'dockerode'
import type { ContainerInfo } from '@/types/log'

let client: Docker | null = null

export function getDockerClient(): Docker {
  if (!client) {
    client = new Docker({ socketPath: '/var/run/docker.sock' })
  }
  return client
}

function deriveProject(name: string, labels: Record<string, string>): string {
  if (labels['com.docker.compose.project']) return labels['com.docker.compose.project']
  // fall back to first segment before . or -
  return name.split(/[.\-]/)[0] ?? name
}

export async function listRunningContainers(): Promise<ContainerInfo[]> {
  const docker = getDockerClient()
  const containers = await docker.listContainers({ all: false })
  return containers.map(c => {
    const name = c.Names[0]?.replace(/^\//, '') ?? c.Id.slice(0, 12)
    const labels = (c.Labels ?? {}) as Record<string, string>
    return {
      id: c.Id,
      name,
      image: c.Image,
      status: c.Status,
      state: c.State,
      project: deriveProject(name, labels),
    }
  })
}

export async function getContainerLogStream(
  containerId: string,
  tail: number = 100
): Promise<NodeJS.ReadableStream> {
  const docker = getDockerClient()
  const container = docker.getContainer(containerId)
  return container.logs({
    stdout: true,
    stderr: true,
    follow: true,
    tail,
    timestamps: false,
  }) as unknown as NodeJS.ReadableStream
}
