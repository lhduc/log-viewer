import Docker from 'dockerode'
import type { ContainerInfo } from '@/types/log'

let client: Docker | null = null

// Server-side enforcement of the same flag that hides the "Local Docker" UI option.
// NEXT_PUBLIC_ vars are still readable in server code, so this closes the API off too.
export function isLocalDockerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_LOCAL_DOCKER !== 'true'
}

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
