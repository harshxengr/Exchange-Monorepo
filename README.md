# Exchange Monorepo

A real-time cryptocurrency exchange platform with order matching, WebSocket market data, and user authentication.

## Architecture

```
Web (Next.js :3002) ──► API Gateway (Express :3000) ──► Redis Queue
                                                              │
                         WebSocket (:8080) ◄── Redis Pub/Sub ◄┤
                                                              │
                         Matching Engine ◄────────────────────┘
                                                              │
                         DB Worker ──► PostgreSQL
```

| Service | Port | Description |
|---------|------|-------------|
| `web` | 3002 | Next.js trading UI + auth |
| `@exchange/api` | 3000 | REST API for order submission |
| `@exchange/ws` | 8080 | WebSocket market data stream |
| `@exchange/engine` | — | Order matching engine |
| `@exchange/db-worker` | — | Persists trades to PostgreSQL |

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for PostgreSQL and Redis)

## Setup

1. **Clone and install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your values. Set `NEXTAUTH_SECRET` to a random string in production.

3. **Start infrastructure**

   ```bash
   pnpm infra:up
   ```

4. **Run database migrations**

   ```bash
   pnpm db:deploy
   ```

5. **Build all packages**

   ```bash
   pnpm build
   ```

6. **Start development servers**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3002](http://localhost:3002) to access the exchange.

## Production

1. Set `NODE_ENV=production` and configure all env vars from `.env.example`.
2. Run `pnpm build` then start each service with its compiled output:
   - `node apps/api/dist/index.js`
   - `node apps/ws/dist/index.js`
   - `node apps/engine/dist/index.js`
   - `node apps/db-worker/dist/index.js`
   - `pnpm --filter web start`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in development mode |
| `pnpm build` | Build all packages |
| `pnpm infra:up` | Start PostgreSQL and Redis via Docker |
| `pnpm infra:down` | Stop Docker services |
| `pnpm db:migrate` | Create and apply a new migration |
| `pnpm db:deploy` | Apply pending migrations (production) |
| `pnpm db:generate` | Regenerate Prisma client |
