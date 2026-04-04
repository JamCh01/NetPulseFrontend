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
| `/tasks` | Auth | Task list + create |
| `/tasks/:taskUuid` | Auth | Task detail + agent assignment |
| `/alerts` | Auth | Alert rules CRUD + enable/disable |
| `/webhooks` | Auth | Webhooks CRUD + template + headers |
| `/agents` | Admin | Agent list + create (with platform) |
| `/agents/:agentUuid` | Admin | Agent detail + edit |
| `/users` | Admin | User management + password change |

## Roles

- **subscriber** -- Can manage own alert rules and webhooks. Sees only own resources.
- **admin** -- Full access. Sees all resources with owner column. Can manage agents, tasks, users, and change passwords.

## API Client

The API client is auto-generated from the backend's OpenAPI spec:

```bash
npm run generate:api
```

Manual additions to `types.gen.ts` and `sdk.gen.ts` (e.g., `user_uuid`, `is_deleted`, `AlertRuleUpdate`, password change endpoint) are documented inline.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | (empty, uses proxy) | API base URL. Empty = same-origin (Vite proxy in dev). |

## i18n

Supports English (`en`) and Chinese (`zh`). Language is auto-detected from the browser and can be toggled in the sidebar. Translation files are in `src/i18n/locales/`.
