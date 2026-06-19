import { NextResponse } from 'next/server'

/** Logs the full exception server-side and returns a JSON error response with a trace ID. */
export function apiError(err: unknown, context: string, status = 500): NextResponse {
  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? (err.stack ?? message) : message

  console.error(`[API Error] ${context} trace=${traceId}\n${stack}`)

  return NextResponse.json({ error: message, trace: traceId }, { status })
}

/** Same as apiError but for SSE streams — encodes the error as an SSE event. */
export function sseError(err: unknown, context: string): string {
  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? (err.stack ?? message) : message

  console.error(`[SSE Error] ${context} trace=${traceId}\n${stack}`)

  return `data: ${JSON.stringify({ _error: message, _trace: traceId })}\n\n`
}
