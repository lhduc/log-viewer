# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite exists yet. Type-check with:
```bash
npx tsc --noEmit
```

## Architecture

Next.js 16 app (App Router) that connects to the local Docker socket and streams container logs to the browser via SSE.

**Data flow:**
1. `GET /api/containers` — calls `dockerode` on `/var/run/docker.sock`, returns running container list
2. `GET /api/containers/[id]/logs` — opens a `follow: true` log stream from dockerode, demuxes the Docker multiplexed stream format (8-byte header per frame), parses each line as JSON, and emits as SSE (`text/event-stream`)
3. `useLogStream` hook — opens an `EventSource` to the SSE endpoint, caps in-memory log buffer at 5,000 entries
4. `LogList` — renders logs with `@tanstack/react-virtual` (virtualized, fixed row height ~28px)
5. `useAutoScroll` — auto-scrolls to bottom unless user has scrolled up >80px

**Key files:**
- `src/lib/docker-client.ts` — singleton dockerode client, always connects via unix socket (no TCP)
- `src/lib/log-demux.ts` — parses Docker's multiplexed stream binary format (byte 0 = stream type, bytes 4-7 = payload length BE)
- `src/lib/log-utils.ts` — normalizes log level field names (`level`/`severity`/`lvl`), message fields (`message`/`msg`/`body`), and maps level aliases (`warning→warn`, `critical→fatal`)
- `src/types/log.ts` — `LogEntry` shape; all server-injected metadata uses `_` prefix (`_stream`, `_seq`, `_raw`, `_error`)

**UI components:**
- `ContainerTabs` — tab-per-container, lazy-activates `LogPanel` only for the selected tab
- `LogPanel` — owns filter state (level, search text, stdout/stderr), feeds `filteredLogs` down to `LogList`
- `LogLine` — renders a single log entry; supports raw JSON mode toggle

## Important constraints

- `dockerode`, `docker-modem`, and `ssh2` are listed in `serverExternalPackages` — they must stay server-only (API routes), never imported in client components
- Log entries may be raw (non-JSON) — `_raw: true` is set on those; `LogLine` must handle both structured and plain-text entries
- shadcn/ui is configured with `base-nova` style; add components via `npx shadcn add <component>`
