---
name: log-viewer-app
status: completed
created: 2026-06-05
blockedBy: []
blocks: []
---

# Log Viewer Web App

Docker log viewer — streams stdout/stderr (JSON format) from local Docker daemon to browser in real-time.

## Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS + Shadcn UI
- **Docker:** `dockerode` (local Docker socket)
- **Log transport:** Server-Sent Events (SSE)
- **Virtual scroll:** `@tanstack/react-virtual`

## Scope (v1)

- Connect to local Docker daemon via `/var/run/docker.sock`
- List running containers
- Stream logs (stdout + stderr) per container in real-time
- Multi-container support via tabs
- Filter by log level, search by keyword
- Auto-scroll with pause-on-user-scroll
- JSON log parsing with structured display + raw toggle

**Out of scope (v1):** Persistence/DB, remote Docker hosts, auth, multi-host.

## Phases

| # | Phase | Status | Priority |
|---|-------|--------|----------|
| 1 | [Project Setup](phase-01-project-setup.md) | done | high |
| 2 | [Docker Integration & SSE API](phase-02-docker-sse-api.md) | done | high |
| 3 | [Log Viewer UI](phase-03-log-viewer-ui.md) | done | high |
| 4 | [Filter & Search](phase-04-filter-search.md) | done | medium |

## Key Files (Post-Setup)

```
src/
├── app/
│   ├── page.tsx                          # Main page (container list + tabs)
│   ├── api/
│   │   ├── containers/route.ts           # GET /api/containers
│   │   └── containers/[id]/logs/route.ts # GET /api/containers/:id/logs (SSE)
├── components/
│   ├── container-list.tsx
│   ├── log-panel.tsx
│   ├── log-list.tsx
│   └── log-line.tsx
├── hooks/
│   ├── use-log-stream.ts
│   └── use-auto-scroll.ts
└── lib/
    ├── docker-client.ts
    └── log-demux.ts
```

## Research Reports

- [Docker streaming integration](../reports/researcher-260605-1224-docker-streaming-integration.md)
- [UI patterns](../reports/researcher-260605-1225-log-viewer-ui-patterns.md)
