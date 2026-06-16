# Phase 01 — Project Setup

**Status:** todo  
**Priority:** high  
**Effort:** 30 min

## Overview

Bootstrap a Next.js 14 App Router project with all required dependencies and base configuration.

## Requirements

- Next.js 14+ with App Router, TypeScript, Tailwind CSS
- Shadcn UI initialized (Button, Tabs, Input, Badge components)
- `dockerode` + `@types/dockerode` installed
- `@tanstack/react-virtual` installed
- `date-fns` installed
- ESLint configured

## Implementation Steps

1. **Bootstrap Next.js project**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"
   ```

2. **Install core dependencies**
   ```bash
   npm install dockerode @tanstack/react-virtual date-fns
   npm install -D @types/dockerode
   ```

3. **Initialize Shadcn UI**
   ```bash
   npx shadcn@latest init
   # Select: Default style, Slate base color, CSS variables
   npx shadcn@latest add tabs button input badge separator scroll-area
   ```

4. **Configure `next.config.ts`** — disable static optimization for SSE routes:
   ```typescript
   const nextConfig = {
     // Needed for SSE: prevent caching API routes
     experimental: {
       serverActions: { allowedOrigins: ['localhost:3000'] }
     }
   }
   ```

5. **Verify Docker socket access**
   ```bash
   ls -la /var/run/docker.sock  # should exist
   docker ps                    # confirm daemon is running
   ```

## Todo

- [ ] Run `create-next-app` in project root
- [ ] Install dependencies
- [ ] Initialize Shadcn UI + add components
- [ ] Verify `tsconfig.json` paths alias (`@/*` → `./src/*`)
- [ ] Confirm Docker socket accessible from local machine

## Success Criteria

- `npm run dev` starts without errors
- `import Docker from 'dockerode'` compiles cleanly
- Shadcn components importable from `@/components/ui/*`

## Next Steps

→ Phase 02: Docker Integration & SSE API
