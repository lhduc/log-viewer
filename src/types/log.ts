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
  [key: string]: unknown
  _stream: 'stdout' | 'stderr'
  _raw?: boolean
  _seq: number
}
