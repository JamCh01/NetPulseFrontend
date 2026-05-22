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

## Core Features

### 📡 Target-Centric Monitoring
- **GEO Sidebar**: Targets are grouped by continent, country, and city, with a separate AnyCast branch.
- **Target Detail View**: Selecting a Target shows ICMP, TCP, and MTR data on the same page instead of drilling into task pages first.
- **Agent Filtering**: ICMP, TCP, and MTR sections have independent Agent checkbox filters, so each protocol can be inspected separately.
- **Time Ranges**: Monitoring charts default to the latest 1 hour. Quick ranges are relative windows that advance every minute to fetch the latest data; absolute ranges stay fixed.

### 📈 Monitoring Visualizations
- **ICMP/TCP Smoke Charts**: Uses a main Avg line, translucent Min-Max band, and Packet Loss bars for SmokePing-style analysis.
- **VictoriaMetrics Source**: ICMP and TCP metrics are queried from VictoriaMetrics through the backend metrics API.
- **MTR Evidence Workbench**: MTR uses result and hop data instead of synthetic metrics. The workbench includes an Agent-colored result timeline and hop evidence table.
- **Data Export**: Single-task ICMP/TCP detail pages support CSV export.

### 🛡️ Security & Management
- **User Self-Service**: Users can change their own passwords via the header dropdown menu.
- **System Health**: Detailed real-time status page for core middleware (PostgreSQL, Redis, NATS, VictoriaMetrics).
- **Admin Audit**: Comprehensive audit log viewer with filtering capabilities.
- **Webhook Integration**: Flexible alert notifications with template variables and delivery history.

### 📱 Responsive Experience
- **Mobile Optimized**: Adaptive layout with a slide-out hamburger menu and backdrop blur.
- **Smart Tables**: Wide data tables gracefully degrade to vertical card streams on small screens.
- **Adaptive Charts**: Auto-resizing charts with simplified grids and responsive legends.

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run generate:api` | Regenerate API client from OpenAPI spec |

## Project Structure

```
src/
  api/
    generated/          # Auto-generated API client (openapi-ts)
    hooks/              # TanStack Query hooks for API resources and monitoring data
    client.ts           # API client config (interceptors, token refresh)
  components/ui/        # Shared UI primitives (shadcn/ui)
  features/
    auth/               # Login, register, password change dialog
    dashboard/          # Dashboard stats + time range + system health card
    tasks/              # Task CRUD + agent assignment
    agents/             # Agent management + release management
    alerts/             # Alert rules + Webhook assignment
    webhooks/           # Webhook management + deliveries
    monitoring/
      components/
        charts/         # SmokePing and multi-Agent chart components
        mtr/            # MTR result timeline, evidence workbench, hop table
        navigation/     # Target GEO sidebar tree
        target/         # Target-level ICMP/TCP/MTR monitoring panel
        time-range/     # Relative and absolute time range selectors
      lib/              # Monitoring normalizers, chart options, GEO tree, time range helpers
      pages/            # Monitoring route pages
  layouts/              # Responsive AppLayout with mobile menu
  stores/               # Zustand stores (auth, theme)
```

## Route Map

| Path | Access | Page |
|------|--------|------|
| `/monitoring` | Public | Target GEO tree and Target monitoring view |
| `/monitoring?target_uuid=<uuid>` | Public | ICMP, TCP, and MTR sections for one Target |
| `/monitoring/:taskUuid` | Public | Single-task ICMP/TCP chart + CSV export |
| `/monitoring/:taskUuid/mtr` | Public | MTR traceroute timeline |
| `/login` | Public | Login |
| `/dashboard` | Auth | Stats overview + Time Range Selector |
| `/system/health` | Admin | Middleware detailed health status |
| `/alerts` | Auth | Alert rules with Webhook assignments |
| `/users` | Admin | User management + Reset password |
| `/agents/releases` | Admin | Agent version & upgrade management |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | (empty) | API base URL. Leave empty for same-origin proxy. |

## Deployment

### Manual Deployment (Nginx)

The project is built using `npm run build` and produces static files in `dist/`.

**API Reverse Proxy:**
The frontend calls `/api/v1/...` endpoints. If `VITE_API_BASE_URL` is empty, proxy API requests from the frontend origin to the backend:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Docker

```bash
docker build -t netpulse-frontend .
docker run -d -p 80:80 netpulse-frontend
```
