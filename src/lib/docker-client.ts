import Docker from 'dockerode'
import type { ContainerInfo } from '@/types/log'

let client: Docker | null = null

export function getDockerClient(): Docker {
  if (!client) {
    client = new Docker({ socketPath: '/var/run/docker.sock' })
  }
  return client
}

export async function listRunningContainers(): Promise<ContainerInfo[]> {
  const docker = getDockerClient()
  const containers = await docker.listContainers({ all: false })
  return containers.map(c => ({
    id: c.Id,
    name: c.Names[0]?.replace(/^\//, '') ?? c.Id.slice(0, 12),
    image: c.Image,
    status: c.Status,
    state: c.State,
  }))
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
