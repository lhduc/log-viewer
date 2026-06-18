import { getContainerLogStream } from '@/lib/docker-client'
import { demuxDockerStream } from '@/lib/log-demux'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const containerIds = (url.searchParams.get('containers') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const tail = Number(url.searchParams.get('tail') ?? '200')

  if (containerIds.length === 0) {
    return new Response('Missing containers param', { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const logStreams: (NodeJS.ReadableStream & { destroy?: () => void })[] = []

      await Promise.all(containerIds.map(async containerId => {
        try {
          const logStream = await getContainerLogStream(containerId, tail) as NodeJS.ReadableStream & { destroy?: () => void }
          logStreams.push(logStream)

          demuxDockerStream(logStream, (streamType, line) => {
            let entry: Record<string, unknown>
            try {
              entry = JSON.parse(line)
            } catch {
              entry = { message: line, _raw: true }
            }
            enqueue({ ...entry, _stream: streamType })
          })

          logStream.on('error', (err: Error) => {
            enqueue({ _error: `[${containerId.slice(0, 12)}] ${String(err)}` })
          })
        } catch (err) {
          enqueue({ _error: `Failed to attach to ${containerId.slice(0, 12)}: ${String(err)}` })
        }
      }))

      req.signal.addEventListener('abort', () => {
        logStreams.forEach(s => s.destroy?.())
        controller.close()
      })
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
