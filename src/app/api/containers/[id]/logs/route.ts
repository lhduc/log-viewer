import { getContainerLogStream } from '@/lib/docker-client'
import { demuxDockerStream } from '@/lib/log-demux'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tail = Number(new URL(req.url).searchParams.get('tail') ?? '100')
  const encoder = new TextEncoder()
  let seq = 0

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const logStream = await getContainerLogStream(id, tail)

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
        logStream.on('error', (err: Error) => {
          enqueue({ _error: String(err) })
          controller.close()
        })

        req.signal.addEventListener('abort', () => {
          (logStream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.()
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
