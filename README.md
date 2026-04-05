# NetPulse Frontend

NetPulse is a network monitoring platform (SmokePing-style). This is the React frontend for managing agents, tasks, alert rules, webhooks, and viewing real-time monitoring data.

## Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 8** (build & dev server)
- **React Router 7** (client-side routing)
- **TanStack Query 5** (server state management)
- **Zustand 5** (client state: auth, theme)
- **ECharts 6** (SmokePing-style charts)
- **Tailwind CSS 4** + **shadcn/ui** (Base UI)
- **i18next** (English / Chinese)
- **Vitest** + **Testing Library** + **MSW** (testing)
- **@hey-api/openapi-ts** (API client generation)

## Chart Features

### SmokePing-style Charts

The monitoring charts support two display styles, toggleable in the monitoring detail page:

- **Smoke (default)**: Straight line segments between data points (classic SmokePing style)
- **Basic**: Smooth curve interpolation between points

### Data Gap Handling

Charts automatically detect and display breaks in data:
- Gaps > 5 minutes are shown as visual breaks in the line
- No smoothing across missing data intervals
- Null values are inserted at gap midpoints to create clean breaks

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies API requests to the backend at `http://127.0.0.1:8000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run generate:api` | Regenerate API client from OpenAPI spec |

## Project Structure

```
src/
  api/
    generated/          # Auto-generated API client (openapi-ts)
    hooks/              # TanStack Query hooks (use-agents, use-alerts, etc.)
    client.ts           # API client config (interceptors, token refresh)
    types.ts            # Shared API types not in OpenAPI (DashboardStats)
  components/ui/        # Shared UI primitives (shadcn/ui)
  features/
    auth/               # Login, register, guards (AuthGuard, AdminGuard)
    dashboard/          # Dashboard with stats cards + mini charts
    tasks/              # Task CRUD + detail page
    agents/             # Agent CRUD + detail + geo-cascader
    alerts/             # Alert rule CRUD with enable/disable toggle
    webhooks/           # Webhook CRUD + template variables + custom headers
    users/              # User management + password change (admin)
    monitoring/         # Public SmokePing charts (single + multi-agent)
  i18n/                 # i18next config + en.json / zh.json
  layouts/              # AppLayout (auth), AuthLayout, PublicLayout
  lib/                  # Shared utilities (jwt, format, constants)
  stores/               # Zustand stores (auth, theme)
  test/                 # Test setup, MSW handlers, mock factories
  router.tsx            # Route definitions
  App.tsx               # Root component (QueryClient + Router)
  main.tsx              # Entry point
```

## Route Map

| Path | Access | Page |
|------|--------|------|
| `/monitoring` | Public | Task selection grid |
| `/monitoring/:taskUuid` | Public | SmokePing chart |
| `/login` | Public | Login |
| `/register` | Public | Register (subscriber only) |
| `/dashboard` | Auth | Stats overview + mini charts |
| `/tasks` | Auth | Task list + create/edit/delete (admin) |
| `/tasks/:taskUuid` | Auth | Task detail + agent assignment (admin) |
| `/alerts` | Auth | Alert rules CRUD + enable/disable |
| `/webhooks` | Auth | Webhooks CRUD + template + headers |
| `/agents` | Admin | Agent list + create (with platform) |
| `/agents/:agentUuid` | Admin | Agent detail + edit |
| `/users` | Admin | User management + password change |

## Roles

- **subscriber** -- Can manage own alert rules and webhooks. Sees only own resources.
- **admin** -- Full access. Sees all resources with owner column. Can manage agents, tasks, users, and change passwords.

## Agent-Task Assignment

Agents and tasks can be linked from multiple entry points:

| Entry Point | Action |
|-------------|--------|
| Task detail page (`/tasks/:uuid`) | Toggle agents on/off with one click (CheckableList) |
| Agent detail page (`/agents/:uuid`) | Dual-panel batch add/remove tasks (CheckableList) |
| Task creation dialog | Optionally select agents to assign immediately |
| Agent creation dialog | Optionally select tasks to assign immediately |
| Task list page | "Manage Agents" button opens quick-assign dialog |

The backend API supports bulk assignment: `POST /tasks/{task_uuid}/assign` with `{ agent_uuids: string[] }`. Cache invalidation is bidirectional -- changes from either side refresh both task and agent queries. Note: `GET /agents/{agent_uuid}/tasks` returns a nested `{ agent_uuid, tasks: [...] }` object, not a flat array.

## API Client

The API client is auto-generated from the backend's OpenAPI spec:

```bash
npm run generate:api
```

Manual additions to `types.gen.ts` and `sdk.gen.ts` (e.g., `user_uuid`, `is_deleted`, `AlertRuleUpdate`, password change endpoint) are documented inline.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | (empty) | API base URL. Must be empty when SDK paths already include `/api/v1`. |

> **Important:** The auto-generated SDK paths already contain `/api/v1/...`. Setting `VITE_API_BASE_URL=/api/v1` will cause double-prefix requests (`/api/v1/api/v1/...`). Leave it empty for same-origin deployments with nginx proxy.

## i18n

Supports English (`en`) and Chinese (`zh`). Language is auto-detected from the browser and can be toggled in the sidebar. Translation files are in `src/i18n/locales/`.

## Timezone Handling

The backend and all agents use **UTC** exclusively. The frontend converts UTC to the user's local timezone for display:

- **ISO strings** (`created_at`) -- `new Date(iso)` auto-converts UTC to local time
- **Unix timestamps** (`MonitoringDataPoint.timestamp`) -- seconds from backend, multiplied by 1000 for JS/ECharts milliseconds

All date/time formatting goes through shared helpers in `src/lib/format.ts`:

| Function | Usage | Example Output |
|----------|-------|----------------|
| `formatDate(iso, lang)` | List pages (date only) | "Jan 1, 2026" / "2026年1月1日" |
| `formatDateTime(iso, lang)` | Detail pages, deliveries | "Jan 1, 2026, 14:30" |
| `formatChartTime(tsMs)` | Chart tooltips | "2026-01-01 14:30" |

ECharts time axis (`xAxis.type = 'time'`) handles axis label formatting automatically using the browser's local timezone.

## Deployment

### Production Build

```bash
npm run build
```

Output is in `dist/`. This is a pure static SPA -- serve it with any static file server (Nginx, Caddy, S3+CloudFront, etc.). All routes must fall back to `index.html` for client-side routing to work.

### Docker

```bash
# Build image
docker build -t netpulse-frontend .

# Run (backend at http://backend:8000)
docker run -d -p 80:80 netpulse-frontend
```

The Dockerfile uses a two-stage build:
1. **Build stage** -- `node:22-alpine`, runs `npm ci && npm run build`
2. **Serve stage** -- `nginx:alpine`, serves `dist/` with SPA fallback + API reverse proxy

#### Build-time Variables

Pass `VITE_API_BASE_URL` at build time if the API is not same-origin:

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t netpulse-frontend .
```

### Docker Compose

Example with backend:

```yaml
services:
  backend:
    image: netpulse-backend
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Nginx Configuration

The included `nginx.conf` handles:
- **SPA fallback** -- `try_files $uri $uri/ /index.html`
- **API reverse proxy** -- `/api/` proxied to `http://backend:8000`
- **Static asset caching** -- `/assets/` cached for 1 year with `immutable`
- **Gzip compression** -- enabled for text/JS/CSS/JSON/SVG

To customize the backend upstream, edit the `proxy_pass` directive in `nginx.conf` or use environment variable substitution with `envsubst`.

### Manual Deployment (without Docker)

```bash
npm run build
# Copy dist/ to your web server's document root
# Configure your web server for SPA fallback and API proxy
```

Key requirements for any deployment:
1. **SPA fallback** -- All non-file routes must serve `index.html`
2. **API proxy** -- `/api/*` must be proxied to the backend (or set `VITE_API_BASE_URL` at build time for cross-origin)
3. **HTTPS** -- Required in production for secure cookie/token handling
