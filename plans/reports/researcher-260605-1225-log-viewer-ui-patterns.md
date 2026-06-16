# Next.js SSE + Real-Time UI Patterns Research

**Date:** 2026-06-05
**Topic:** Real-time log viewer UI patterns for Next.js App Router

---

## 1. SSE in Next.js 14+ App Router

```typescript
// app/api/logs/route.ts
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: {"status":"connected"}\n\n'))
      // ... push log lines
      return () => { /* cleanup */ }
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

**Client:**
```typescript
useEffect(() => {
  const es = new EventSource('/api/logs')
  es.onmessage = (e) => setLogs(prev => [...prev, JSON.parse(e.data)])
  return () => es.close()
}, [])
```

Trade-offs: native browser API, auto-reconnects, unidirectional only (fine for view-only logs).

---

## 2. Virtual Scrolling

**Recommendation: `@tanstack/react-virtual` v3**

| Library | Bundle | Dynamic Heights | Maintenance |
|---------|--------|----------------|-------------|
| @tanstack/react-virtual v3 | 15KB | ✓ | Active |
| react-window | 9KB | Workaround needed | Low |
| react-virtualized | 30KB+ | ✓ | Deprecated trend |

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const parentRef = useRef<HTMLDivElement>(null)

const virtualizer = useVirtualizer({
  count: logs.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,  // estimated row height in px
  overscan: 20,
})

// Scroll to bottom
virtualizer.scrollToIndex(logs.length - 1, { behavior: 'smooth' })
```

---

## 3. Auto-Scroll + Pause Pattern

```typescript
const useAutoScroll = (virtualizer, logCount: number) => {
  const [isPaused, setIsPaused] = useState(false)
  
  useEffect(() => {
    if (!isPaused && logCount > 0) {
      virtualizer.scrollToIndex(logCount - 1)
    }
  }, [logCount, isPaused])
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setIsPaused(!isAtBottom)
  }
  
  return { isPaused, setIsPaused, handleScroll }
}
```

---

## 4. Log Level Coloring (Tailwind)

```typescript
const LEVEL_STYLES: Record<string, string> = {
  error:   'text-red-400 bg-red-950/30',
  fatal:   'text-red-300 bg-red-950/50 font-bold',
  warn:    'text-yellow-400 bg-yellow-950/20',
  warning: 'text-yellow-400 bg-yellow-950/20',
  info:    'text-blue-400',
  debug:   'text-gray-500',
  trace:   'text-gray-600',
}
```

---

## 5. JSON Log Rendering

Two-view pattern (structured vs raw):

```typescript
// Structured: highlight key fields
const LogRow = ({ log }) => (
  <div className="grid grid-cols-[120px_80px_1fr] gap-2 px-3 py-1 font-mono text-xs">
    <span className="text-gray-500">{formatTimestamp(log.timestamp)}</span>
    <span className={LEVEL_STYLES[log.level]}>[{log.level}]</span>
    <span>{log.message}</span>
  </div>
)

// Toggle raw JSON with <details>/<summary> — no library needed for basic use
```

For interactive JSON expansion: `react-json-tree` (~8KB, optional).

---

## 6. Multi-Container Tabs

```typescript
// Tabs pattern (Shadcn UI)
<Tabs value={activeId} onValueChange={setActiveId}>
  <TabsList>
    {containers.map(c => <TabsTrigger key={c.Id} value={c.Id}>{c.Names[0]}</TabsTrigger>)}
  </TabsList>
  {containers.map(c => (
    <TabsContent key={c.Id} value={c.Id}>
      <LogPanel containerId={c.Id} active={activeId === c.Id} />
    </TabsContent>
  ))}
</Tabs>
```

**Important:** Only stream logs for the active tab (or unmount SSE when tab is inactive) to avoid browser's 6-connection-per-domain limit.

---

## Package Recommendations

| Package | Purpose |
|---------|---------|
| `@tanstack/react-virtual` | Virtual list for log lines |
| `date-fns` | Timestamp formatting (tree-shakeable) |
| `shadcn/ui` | Tabs, Button, Input components |
| `dockerode` | Docker daemon communication |
| `@types/dockerode` | TypeScript types |

---

## Unresolved Questions

1. Browser limit of 6 SSE connections per domain — need multiplexing if supporting split view with many containers simultaneously
2. Memory bound: how many log lines to keep in JS memory before dropping oldest?
3. Filter persistence: localStorage for user's level/search filters?
