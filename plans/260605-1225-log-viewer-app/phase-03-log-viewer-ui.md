# Phase 03 — Log Viewer UI

**Status:** todo  
**Priority:** high  
**Effort:** 3h  
**Depends on:** Phase 02

## Overview

Build the frontend: container tabs, real-time log list with virtual scrolling, auto-scroll behavior, and structured JSON log display with raw toggle.

## Key Insights (from research)

- `@tanstack/react-virtual` v3 handles dynamic row heights — best fit for variable log lines
- Only stream logs for the **active tab** to avoid browser's 6 SSE connections/domain limit
- Auto-scroll pauses when user scrolls up; shows "resume" button to snap back to bottom
- Level coloring via Tailwind class map — no runtime CSS needed
- Two view modes: structured grid (timestamp | level | message) and raw JSON `<pre>`

## Component Architecture

```
src/app/page.tsx
└── <ContainerTabs>          # Shadcn Tabs — container list as tab triggers
    └── <LogPanel>           # Per-container panel (only active tab mounts SSE)
        ├── <LogToolbar>     # Level filter chips + search input + raw toggle
        └── <LogList>        # Virtual scroll container
            └── <LogLine>    # Single row: timestamp | level | message | expand
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main page — fetches container list, renders ContainerTabs |
| `src/components/container-tabs.tsx` | Tabs wrapper with container list |
| `src/components/log-panel.tsx` | SSE connection + state; renders LogToolbar + LogList |
| `src/components/log-list.tsx` | `@tanstack/react-virtual` list |
| `src/components/log-line.tsx` | Single log row with expand |
| `src/components/log-toolbar.tsx` | Level filter + search |
| `src/hooks/use-log-stream.ts` | EventSource hook → returns `logs[]` |
| `src/hooks/use-auto-scroll.ts` | Auto-scroll + pause logic |
| `src/lib/log-utils.ts` | Level color map, timestamp formatter, field extractor |

## Implementation Steps

### 1. Log Utilities (`src/lib/log-utils.ts`)

```typescript
import { format } from 'date-fns'

export const LEVEL_STYLES: Record<string, string> = {
  fatal:   'text-red-300 bg-red-950/40 font-semibold',
  error:   'text-red-400 bg-red-950/20',
  warn:    'text-yellow-400',
  warning: 'text-yellow-400',
  info:    'text-blue-400',
  debug:   'text-gray-500',
  trace:   'text-gray-600',
}

export const KNOWN_LEVELS = ['fatal','error','warn','warning','info','debug','trace']

export function getLevel(entry: Record<string, unknown>): string {
  const raw = (entry.level ?? entry.severity ?? entry.lvl ?? '')
  return String(raw).toLowerCase()
}

export function getMessage(entry: Record<string, unknown>): string {
  return String(entry.message ?? entry.msg ?? entry.body ?? JSON.stringify(entry))
}

export function formatTimestamp(ts: unknown): string {
  if (!ts) return ''
  try {
    return format(new Date(String(ts)), 'HH:mm:ss.SSS')
  } catch {
    return String(ts).slice(0, 12)
  }
}
```

### 2. `use-log-stream` Hook (`src/hooks/use-log-stream.ts`)

```typescript
import { useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@/types/log'

const MAX_LOGS = 5000  // drop oldest beyond this limit

export function useLogStream(containerId: string | null, active: boolean) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const seqRef = useRef(0)

  useEffect(() => {
    if (!containerId || !active) return

    const es = new EventSource(`/api/containers/${containerId}/logs`)
    setConnected(false)
    setError(null)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      const entry: LogEntry = JSON.parse(e.data)
      if (entry._error) { setError(entry._error as string); return }
      setLogs(prev => {
        const next = [...prev, entry]
        return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next
      })
    }

    es.onerror = () => {
      setConnected(false)
      setError('Connection lost — reconnecting…')
    }

    return () => es.close()
  }, [containerId, active])

  return { logs, connected, error, clear: () => setLogs([]) }
}
```

### 3. `use-auto-scroll` Hook (`src/hooks/use-auto-scroll.ts`)

```typescript
import { useEffect, useRef, useState } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'

export function useAutoScroll(virtualizer: Virtualizer<HTMLDivElement, Element>, count: number) {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!paused && count > 0) {
      virtualizer.scrollToIndex(count - 1, { align: 'end' })
    }
  }, [count, paused])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setPaused(distFromBottom > 80)
  }

  return { paused, resume: () => setPaused(false), onScroll }
}
```

### 4. Log Line (`src/components/log-line.tsx`)

```typescript
// Renders one log entry row; expandable to show full JSON
```

Fields shown in compact view: `timestamp | [LEVEL] | message`  
Expanded: full JSON in `<pre>` block via click or expand icon.

Row height: ~36px compact, dynamic when expanded (handled by `@tanstack/react-virtual` dynamic sizing).

### 5. Log List (`src/components/log-list.tsx`)

```typescript
// Uses useVirtualizer with estimateSize=36, overscan=30
// Renders only visible LogLine components
// Forwards scroll events to useAutoScroll
```

### 6. Log Toolbar (`src/components/log-toolbar.tsx`)

```typescript
// Level filter: row of Badge/Button toggles (ALL | ERROR | WARN | INFO | DEBUG)
// Search: debounced text input (300ms), filters log.message
// Raw toggle: switches LogLine between structured and raw JSON view
// Clear button: clears in-memory log buffer
```

Filtering happens in-component (client-side) — no re-fetch needed.

### 7. Log Panel (`src/components/log-panel.tsx`)

```typescript
// Mounts useLogStream only when `active=true`
// Applies level + search filters to logs array before passing to LogList
// Shows connection status badge (green/red)
// Shows "⬇ Resume" sticky button when auto-scroll is paused
```

### 8. Container Tabs (`src/components/container-tabs.tsx`)

```typescript
// Fetches /api/containers every 10s (SWR or simple setInterval)
// Renders Shadcn <Tabs> with container name as tab label
// Shows container state as colored dot (running=green, exited=red)
// LogPanel active=true only for selected tab
```

### 9. Main Page (`src/app/page.tsx`)

```typescript
// Server component: initial container list fetch (or client fetch on mount)
// Renders ContainerTabs
// Shows "Docker not running" error state if API returns 503
```

## Todo

- [ ] `src/lib/log-utils.ts`
- [ ] `src/hooks/use-log-stream.ts`
- [ ] `src/hooks/use-auto-scroll.ts`
- [ ] `src/components/log-line.tsx`
- [ ] `src/components/log-list.tsx`
- [ ] `src/components/log-toolbar.tsx`
- [ ] `src/components/log-panel.tsx`
- [ ] `src/components/container-tabs.tsx`
- [ ] `src/app/page.tsx`
- [ ] Manual test: open browser, see container tabs, logs stream in real-time
- [ ] Test auto-scroll pauses when scrolling up, resumes on button click
- [ ] Test expand/collapse of log line
- [ ] Test raw JSON toggle

## Success Criteria

- Container list renders as tabs; switching tabs starts/stops SSE
- Log lines render with level coloring and timestamp
- Auto-scroll to bottom; pauses on manual scroll with resume button visible
- Expand row shows full JSON
- Virtual list handles 1000+ lines without jank

## Risk Assessment

- **`@tanstack/react-virtual` dynamic sizing:** measure row heights after render — `measureElement` callback needed
- **SSE reconnect on tab switch:** unmounting EventSource and remounting is fine; browser handles reconnect
- **Empty container list:** show "No containers running" empty state

## Next Steps

→ Phase 04: Filter & Search
