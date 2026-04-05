# CLAUDE.md

Project-specific instructions for Claude Code when working on the NetPulse Frontend.

## Project Overview

NetPulse Frontend -- a React SPA for network monitoring. Backend is a Python FastAPI service at `http://127.0.0.1:8000`.

## Quick Reference

```bash
npm run dev          # Start dev server (localhost:5173, proxies /api to :8000)
npm run build        # tsc -b && vite build
npm run test         # vitest run
npm run generate:api # Regenerate API client from OpenAPI
```

## Architecture

- **Vite 8** SPA (NOT Next.js -- no SSR, no `"use client"` directives)
- **React Router 7** for routing (`src/router.tsx`)
- **TanStack Query** for all server state (hooks in `src/api/hooks/`)
- **Zustand** for client state (auth + theme stores in `src/stores/`)
- **shadcn/ui** components built on **@base-ui/react** (NOT Radix UI)
- **ECharts** for SmokePing-style monitoring charts
- **i18next** with `en.json` and `zh.json` -- all user-facing text must use `t()` keys

## Key Conventions

### File Organization
- Feature-based: `src/features/{feature}/pages/`, `components/`, `lib/`
- Shared UI: `src/components/ui/` (shadcn primitives)
- Shared utilities: `src/lib/` (jwt.ts, format.ts, constants.ts)
- API hooks: `src/api/hooks/use-{resource}.ts`
- Query keys: `src/api/hooks/keys.ts`

### API Types
- Auto-generated types in `src/api/generated/types.gen.ts` -- some fields are manually added (e.g., `user_uuid`, `is_deleted`, `platform`, `AlertRuleUpdate`, `UserChangePassword`)
- After regenerating with `npm run generate:api`, re-apply manual additions
- Custom shared types go in `src/api/types.ts` (e.g., `DashboardStats`)
- Agent endpoints return `unknown` from OpenAPI -- pages cast with `as`

### State Management
- Auth: `useAuthStore` (Zustand) -- tokens in localStorage, JWT decoded with `src/lib/jwt.ts`
- Use `useAuthStore((s) => s.isAdmin())` (call inside selector, returns boolean)
- Do NOT use `useAuthStore((s) => s.isAdmin)()` (returns function, defeats Zustand optimization)

### Agent-Task Assignment
- Assignment is **bidirectional**: manage from task detail page OR agent detail page
- Task detail page uses `CheckableList` for one-click toggle (assign/unassign)
- Agent detail page uses dual-panel `CheckableList` layout: left for batch-add, right for batch-remove
- Creation dialogs (task + agent) include optional multi-select for immediate assignment
- Task list page has "Manage Agents" quick-assign dialog per row
- API: `POST /tasks/{task_uuid}/assign` with `{ agent_uuids: string[] }` (bulk)
- `GET /agents/{agent_uuid}/tasks` returns `{ agent_uuid, tasks: TaskResponse[] }` (nested, not flat array)
- Hooks: `src/api/hooks/use-task-assignments.ts` (task-side), `src/api/hooks/use-agent-tasks.ts` (agent-side)
- Cache invalidation is cross-directional: task-side mutations invalidate `agentKeys.all` and vice versa
- Reusable `CheckableList` component at `src/components/ui/checkable-list.tsx` (supports `maxHeight` prop)

### i18n
- Every user-facing string must use `t('namespace.key')`
- Both `en.json` and `zh.json` must be updated together
- Never hardcode English strings in JSX

### Styling
- Tailwind CSS 4 with design tokens defined in `src/index.css`
- Never concatenate Tailwind classes dynamically (e.g., `color + '/60'`) -- Tailwind can't extract them
- Use pre-defined class maps instead (see `protocolIconDim` pattern in layouts)
- Shared color maps: `PROTOCOL_COLORS`, `AGENT_STATUS_COLORS` in `src/lib/constants.ts`
- Chart tooltip HTML must use theme-aware colors from `ChartThemeConfig` (not hardcoded `#fff` / `#d1d5db`)
- `tooltipLabelColor` for muted labels, `tooltipValueColor` for data values -- adapts to light/dark theme

### Charts
- Two display styles: `'smoke'` (straight segments, default) and `'basic'` (smooth curves)
- Style toggle in monitoring detail page (`monitoring.chartStyleBasic` / `monitoring.chartStyleSmoke` in i18n)
- Gaps > 5 minutes show as visual breaks (null values inserted at midpoint)
- `MAX_GAP_MS = 5 * 60 * 1000` defines the gap threshold
- `connectNulls: false` ensures ECharts doesn't connect across gaps
- Both single-agent and multi-agent charts support the same features

### Forms
- Populate edit forms in the click handler (not `useEffect` on derived objects)
- Use functional `setState((prev) => ...)` in callbacks to avoid stale closures
- Dynamic lists must use stable unique IDs as React keys (not array index)

### Error Handling
- Wrap `navigator.clipboard.writeText()` in try/catch
- API hooks throw on error -- pages show error state from `isError`
- JWT decode returns `null` on failure (never throws)

### Roles & Permissions
- `subscriber`: sees own webhooks/alerts only, full CRUD on own resources
- `admin`: sees all resources with owner column, can manage agents/tasks/users
- Admin-only routes: `/agents`, `/users` (wrapped in `<AdminGuard>`)
- Webhook/alert actions gated by `canManageRule()`/`canManageWebhook()` (owner or admin)

### DELETE vs PATCH Semantics
- `PATCH is_active=false` = temporary disable (stays in list, can re-enable)
- `DELETE` = permanent soft-delete (hidden from list, cannot recover)
- Both webhooks and alert rules follow this pattern

### Timezone & Date Formatting
- Backend and agents use **UTC** exclusively
- `new Date()` auto-converts UTC ISO strings and Unix timestamps to local timezone -- no manual offset needed
- **All date/time display must use helpers from `src/lib/format.ts`:**
  - `formatDate(iso, lang)` -- date only, for list pages
  - `formatDateTime(iso, lang)` -- date+time, for detail pages and deliveries
  - `formatChartTime(tsMs)` -- `YYYY-MM-DD HH:mm` for chart tooltips
- Never use bare `new Date().toLocaleString()` -- always pass locale via `i18n.language`
- `MonitoringDataPoint.timestamp` is Unix seconds from backend; multiply by 1000 for JS Date / ECharts
- ECharts `xAxis.type = 'time'` auto-formats axis labels in local timezone

## Do NOT

- Import from `src/test/` in production code
- Use `next-themes` or `"use client"` (this is a Vite SPA)
- Add `sonner` Toaster without a proper theme provider
- Use `as` casts on `JSON.parse` results at trust boundaries -- validate at runtime
- Pass unused params to hooks that don't forward them to the API
- Duplicate constants across files -- check `src/lib/constants.ts` first
- Use bare `new Date().toLocaleString()` without locale -- use `formatDate`/`formatDateTime` from `src/lib/format.ts`
- Set `VITE_API_BASE_URL=/api/v1` -- SDK paths already include the prefix

## Deployment

### Build & Artifacts
- `npm run build` outputs to `dist/` (static SPA, no SSR)
- `VITE_API_BASE_URL` is baked in at build time -- **must be empty** when SDK paths include `/api/v1` (setting `/api/v1` causes double-prefix `/api/v1/api/v1/...`)
- All `VITE_*` env vars are embedded in the JS bundle at build time, not read at runtime

### Docker
- `Dockerfile` -- two-stage build: `node:22-alpine` (build) + `nginx:alpine` (serve)
- `nginx.conf` -- SPA fallback + `/api/` reverse proxy to `http://backend:8000` + gzip + asset caching
- `.dockerignore` -- excludes node_modules, dist, .env, test artifacts
- Build arg: `docker build --build-arg VITE_API_BASE_URL=... -t netpulse-frontend .`

### Key Deployment Requirements
1. **SPA fallback** -- all non-file routes must return `index.html` (React Router handles client-side routing)
2. **API proxy** -- `/api/*` must reach the FastAPI backend. In Docker, nginx proxies to `http://backend:8000`. Without Docker, configure your reverse proxy accordingly.
3. **HTTPS** -- required in production for secure token handling
4. **No server-side rendering** -- this is a pure client-side SPA, no Node.js server needed in production

### When Modifying Deployment Files
- `nginx.conf` -- if backend service name or port changes, update `proxy_pass`
- `Dockerfile` -- if Node.js version changes, update the base image
- `.env.example` -- keep in sync with any new `VITE_*` variables
