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
