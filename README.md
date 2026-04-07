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

### 🚀 Real-time WebSocket Monitoring
Monitoring charts feature zero-refresh updates using **WebSocket** push. 
- **Direct Cache Patching**: When new data points arrive via WS, they are directly patched into the TanStack Query cache.
- **Visual Continuity**: Charts draw new segments instantly without making extra HTTP requests.
- **De-duplication**: Automatic timestamp-based de-duplication and sorting for data integrity.

### 📈 Intelligent Charts
- **SmokePing-style**: Supports both segment (Smoke) and smooth (Basic) interpolation styles.
- **Gap Detection**: Automatically visualizes data gaps > 5 minutes as line breaks.
- **Time Range Sync**: Global time range selector on the dashboard linked to all mini-charts.
- **Data Export**: Support exporting monitoring data to **CSV** or **JSON** for offline analysis.

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
    hooks/              # TanStack Query hooks (use-agents, use-alerts, use-monitoring-ws, etc.)
    client.ts           # API client config (interceptors, token refresh)
  components/ui/        # Shared UI primitives (shadcn/ui)
  features/
    auth/               # Login, register, password change dialog
    dashboard/          # Dashboard stats + time range + system health card
    tasks/              # Task CRUD + agent assignment
    agents/             # Agent management + release management
    alerts/             # Alert rules + Webhook assignment
    webhooks/           # Webhook management + deliveries
    monitoring/         # SmokePing charts + MTR + export logic
  layouts/              # Responsive AppLayout with mobile menu
  stores/               # Zustand stores (auth, theme)
```

## Route Map

| Path | Access | Page |
|------|--------|------|
| `/monitoring` | Public | Task selection grid |
| `/monitoring/:taskUuid` | Public | SmokePing chart + Data Export |
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

**WebSocket Nginx Configuration:**
To support real-time monitoring, ensure your Nginx config includes the following Upgrade headers:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;
}
```

### Docker

```bash
docker build -t netpulse-frontend .
docker run -d -p 80:80 netpulse-frontend
```
