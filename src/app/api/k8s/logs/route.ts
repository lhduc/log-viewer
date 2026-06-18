import { streamPodLogs } from '@/lib/k8s-client'

// Accepts ?context=...&namespace=...&pods=pod1:container1,pod2:container2
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const context = params.get('context') ?? ''
  const namespace = params.get('namespace') ?? ''
  const podsParam = params.get('pods') ?? ''
  const tail = Number(params.get('tail') ?? '100')

  if (!context || !namespace || !podsParam) {
    return new Response(JSON.stringify({ error: 'context, namespace, pods required' }), { status: 400 })
  }

  const targets = podsParam.split(',').map(s => {
    const [pod, container] = s.split(':')
    return { pod: pod ?? '', container: container ?? '' }
  }).filter(t => t.pod && t.container)

  if (targets.length === 0) {
    return new Response(JSON.stringify({ error: 'no valid pod:container pairs' }), { status: 400 })
  }

  const encoder = new TextEncoder()
  let seq = 0

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      const streams: (NodeJS.ReadableStream & { destroy?: () => void })[] = []

      const attachStream = (logStream: NodeJS.ReadableStream, podName: string) => {
        const s = logStream as NodeJS.ReadableStream & { destroy?: () => void }
        streams.push(s)
        let buffer = ''
        s.on('data', (chunk: Buffer) => {
          buffer += chunk.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            let entry: Record<string, unknown>
            try { entry = JSON.parse(trimmed) } catch { entry = { message: trimmed, _raw: true } }
            enqueue({ ...entry, _stream: 'stdout', _pod: podName, _seq: seq++ })
          }
        })
        s.on('error', (err: Error) => enqueue({ _error: String(err), _pod: podName }))
      }

      try {
        await Promise.all(
          targets.map(({ pod, container }) =>
            streamPodLogs(context, namespace, pod, container, tail)
              .then(s => attachStream(s, pod))
              .catch(err => enqueue({ _error: `Failed to attach ${pod}/${container}: ${String(err)}` }))
          )
        )
      } catch (err) {
        enqueue({ _error: String(err) })
        controller.close()
        return
      }

      req.signal.addEventListener('abort', () => {
        streams.forEach(s => s.destroy?.())
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
