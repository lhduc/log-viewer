# Phase 02 — Docker Integration & SSE API

**Status:** todo  
**Priority:** high  
**Effort:** 2h  
**Depends on:** Phase 01

## Overview

Implement the server-side layer: Docker daemon connection, log stream demultiplexing, and SSE API routes that push parsed JSON log lines to the browser.

## Key Insights (from research)

- Docker log streams multiplex stdout/stderr with 8-byte header (byte 0 = stream type, bytes 4–7 = payload size big-endian)
- `dockerode` auto-detects `/var/run/docker.sock` on macOS — no config needed
- SSE route must set `Cache-Control: no-cache` and handle `req.signal` abort to destroy stream on disconnect
- Lines may not be valid JSON (app could log non-JSON) — fall back to `{ message: rawLine }`

## Architecture

```
Browser (EventSource)
    ↕ SSE (text/event-stream)
Next.js API Route (/api/containers/[id]/logs)
    ↕ Node.js stream
Docker daemon (/var/run/docker.sock)
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/docker-client.ts` | Dockerode singleton + container list/stream helpers |
| `src/lib/log-demux.ts` | 8-byte header demultiplexer |
| `src/app/api/containers/route.ts` | GET /api/containers — list running containers |
| `src/app/api/containers/[id]/logs/route.ts` | GET /api/containers/:id/logs — SSE stream |
| `src/types/log.ts` | Shared TypeScript types |

## Implementation Steps

### 1. Shared Types (`src/types/log.ts`)

```typescript
export interface ContainerInfo {
  id: string
  name: string
  image: string
  status: string
  state: string
}

export interface LogEntry {
  timestamp?: string
  level?: string
  message?: string
  // allow any additional JSON fields
  [key: string]: unknown
  // internal fields
  _stream: 'stdout' | 'stderr'
  _raw?: boolean
  _seq: number   // monotonic sequence number for React keys
}
```

### 2. Docker Client (`src/lib/docker-client.ts`)

```typescript
import Docker from 'dockerode'

// Singleton — reused across requests
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
    timestamps: false,  // use JSON log timestamps instead
  })
}
```

### 3. Log Demultiplexer (`src/lib/log-demux.ts`)

```typescript
type StreamType = 'stdout' | 'stderr'
type OnLog = (type: StreamType, line: string) => void

export function demuxDockerStream(stream: NodeJS.ReadableStream, onLog: OnLog): void {
  let buffer = Buffer.alloc(0)

  stream.on('data', (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk])

    while (buffer.length >= 8) {
      const streamType = buffer[0]
      const payloadSize = buffer.readUInt32BE(4)

      if (buffer.length < 8 + payloadSize) break

      const payload = buffer.subarray(8, 8 + payloadSize).toString('utf8').trim()
      buffer = buffer.subarray(8 + payloadSize)

      if (payload) {
        onLog(streamType === 1 ? 'stdout' : 'stderr', payload)
      }
    }
  })
}
```

### 4. Containers List Route (`src/app/api/containers/route.ts`)

```typescript
import { NextResponse } from 'next/server'
import { listRunningContainers } from '@/lib/docker-client'

export async function GET() {
  try {
    const containers = await listRunningContainers()
    return NextResponse.json(containers)
  } catch (err) {
    return NextResponse.json(
      { error: 'Cannot connect to Docker daemon. Is Docker running?' },
      { status: 503 }
    )
  }
}
```

### 5. SSE Logs Route (`src/app/api/containers/[id]/logs/route.ts`)

```typescript
import { getContainerLogStream } from '@/lib/docker-client'
import { demuxDockerStream } from '@/lib/log-demux'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const tail = Number(new URL(req.url).searchParams.get('tail') ?? '100')
  const encoder = new TextEncoder()
  let seq = 0

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const logStream = await getContainerLogStream(params.id, tail)

        demuxDockerStream(logStream, (streamType, line) => {
          let entry: Record<string, unknown>
          try {
            entry = JSON.parse(line)
          } catch {
            entry = { message: line, _raw: true }
          }
          enqueue({ ...entry, _stream: streamType, _seq: seq++ })
        })

        logStream.on('end', () => controller.close())
        logStream.on('error', (err) => {
          enqueue({ _error: String(err) })
          controller.close()
        })

        req.signal.addEventListener('abort', () => {
          logStream.destroy()
          controller.close()
        })
      } catch (err) {
        enqueue({ _error: `Failed to attach to container: ${String(err)}` })
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

## Todo

- [ ] Create `src/types/log.ts`
- [ ] Create `src/lib/docker-client.ts`
- [ ] Create `src/lib/log-demux.ts`
- [ ] Create `src/app/api/containers/route.ts`
- [ ] Create `src/app/api/containers/[id]/logs/route.ts`
- [ ] Manual test: `curl http://localhost:3000/api/containers` returns container list
- [ ] Manual test: `curl http://localhost:3000/api/containers/<id>/logs` streams SSE events

## Success Criteria

- `/api/containers` returns JSON array of running containers
- `/api/containers/:id/logs` streams `data: {...}\n\n` events containing parsed log fields
- Non-JSON log lines arrive as `{ message: "...", _raw: true }`
- Closing the SSE connection (abort signal) destroys the Docker stream cleanly

## Risk Assessment

- **Docker not running:** Handle with 503 + user-friendly error message
- **Container exits mid-stream:** Stream `end` event closes SSE cleanly
- **Non-JSON logs:** Handled by try/catch in SSE route

## Next Steps

→ Phase 03: Log Viewer UI
