# Phase 04 — Filter & Search

**Status:** todo  
**Priority:** medium  
**Effort:** 1.5h  
**Depends on:** Phase 03

## Overview

Add client-side filtering by log level and keyword search. All filtering is in-memory — no API changes needed. Extend the LogToolbar and LogPanel with filter state.

## Requirements

- Filter by log level (multi-select: ALL / ERROR / WARN / INFO / DEBUG / TRACE)
- Keyword search on `message` field (case-insensitive, debounced 300ms)
- Show filtered count vs total count
- Filters persist while SSE streams — new incoming logs pass through active filters immediately
- "Clear filters" resets to show all logs

## Implementation Steps

### 1. Filter State in `log-panel.tsx`

```typescript
const [levelFilter, setLevelFilter] = useState<Set<string>>(new Set()) // empty = all
const [search, setSearch] = useState('')

const filteredLogs = useMemo(() => {
  return logs.filter(entry => {
    const level = getLevel(entry)
    const msg = getMessage(entry).toLowerCase()
    const passLevel = levelFilter.size === 0 || levelFilter.has(level)
    const passSearch = !search || msg.includes(search.toLowerCase())
    return passLevel && passSearch
  })
}, [logs, levelFilter, search])
```

Pass `filteredLogs` (not `logs`) to `<LogList>`.

### 2. Level Filter Chips in `log-toolbar.tsx`

```typescript
const LEVELS = ['error', 'warn', 'info', 'debug', 'trace'] as const

// Toggle: clicking active level removes it; clicking inactive adds it
// When all removed, show all (empty set = no filter)
const toggleLevel = (level: string) => {
  setLevelFilter(prev => {
    const next = new Set(prev)
    next.has(level) ? next.delete(level) : next.add(level)
    return next
  })
}
```

Visual: colored badge per level matching `LEVEL_STYLES`, dimmed when not selected.

### 3. Search Input with Debounce

```typescript
// In log-toolbar.tsx
const [inputValue, setInputValue] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setSearch(inputValue), 300)
  return () => clearTimeout(timer)
}, [inputValue])
```

### 4. Filter Count Display

```typescript
// In log-panel.tsx or log-toolbar.tsx
<span className="text-xs text-gray-500">
  {filteredLogs.length} / {logs.length} lines
</span>
```

### 5. Stream Filter (stderr-only / stdout-only)

Optional quick filter buttons: `stdout` | `stderr` | `both`

```typescript
const [streamFilter, setStreamFilter] = useState<'both' | 'stdout' | 'stderr'>('both')
// Add to filteredLogs: entry._stream === streamFilter || streamFilter === 'both'
```

## Todo

- [ ] Add `levelFilter`, `search`, `streamFilter` state to `log-panel.tsx`
- [ ] Implement `filteredLogs` memo in `log-panel.tsx`
- [ ] Update `log-toolbar.tsx`: level chips, search input, stream toggle, count display
- [ ] Add "Clear filters" button
- [ ] Test: filter by ERROR shows only error entries
- [ ] Test: search "connection" filters message field
- [ ] Test: new logs arriving while filter is active — correct filtering applied

## Success Criteria

- Level filter chips toggle correctly; all levels off = show all
- Search filters in real-time (300ms debounce)
- Log count shows filtered / total
- Clear filters resets to unfiltered view
- Filtering is smooth with 1000+ logs in memory (no UI lag)

## Risk Assessment

- **Performance:** `useMemo` with `logs.filter()` on every new log — acceptable for ≤5000 logs in memory. If profiling shows lag, debounce the memo update.
- **Level field variance:** JSON logs may use `level`, `severity`, `lvl` — `getLevel()` in `log-utils.ts` already handles common variants.
