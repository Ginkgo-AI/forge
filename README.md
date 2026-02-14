# Forge

**AI-powered work management platform.** Boards, agents, automations, and a built-in AI assistant — all in one place.

Forge combines the structured project management of tools like Monday.com with deeply integrated AI capabilities. Create boards to track work, chat with an AI that can read and modify your data, build autonomous agents that respond to events, and set up automations that run when conditions are met.

---

## Features

- **Boards** — Table and Kanban views with inline editing, drag-and-drop, groups, and multiple column types (status, person, date, text)
- **AI Chat** — Conversational assistant with full read/write access to your workspace. Generate boards from descriptions, extract items from meeting notes, or ask questions about your data
- **AI Agent Builder** — Describe what you want an agent to do in plain English; the AI generates a full configuration (tools, triggers, guardrails) that you can review and edit before creating
- **Agents** — Persistent AI agents that run on triggers (manual or event-based) with configurable tools, system prompts, and guardrails
- **Automations** — Rule engine with triggers (status change, item created, etc.), conditions, and actions (change column, create item, move item, AI step)
- **Dashboard** — Workspace overview with stats, activity timeline, board breakdown charts, and AI-generated reports
- **Documents** — Markdown knowledge base with a split-pane editor for team documentation
- **Settings** — Workspace management, AI provider configuration (with per-model selection), user profile, and notification preferences
- **Onboarding Tour** — Interactive guided walkthrough that highlights key UI areas on first visit, with a restart button in the sidebar

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, Zustand, TanStack React Query |
| Backend | Hono, TypeScript, Node.js 20 |
| Database | PostgreSQL 16 (pgvector), Redis |
| ORM | Drizzle |
| Auth | Better Auth (email/password) |
| AI | Anthropic Claude, OpenAI-compatible providers (OpenRouter, OpenAI, etc.) |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL and Redis)

### 1. Clone and install

```bash
git clone https://github.com/Ginkgo-AI/forge.git
cd forge
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up postgres redis -d
```

This starts PostgreSQL on port **5435** and Redis on port **6382**.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Create database tables

```bash
pnpm db:push
```

### 5. Seed demo data (optional)

```bash
pnpm db:seed
```

### 6. Start development servers

```bash
pnpm dev
```

This starts:
- **API** at http://localhost:3001
- **Web** at http://localhost:5173

Open http://localhost:5173 in your browser. In development mode, auth is bypassed with automatic login.

## Project Structure

```
forge/
  apps/
    api/              # Hono REST API
      src/
        routes/       # Route handlers (thin)
        services/     # Business logic
        middleware/    # Auth, error handling
        lib/          # Utilities (auth, AI, IDs, activity logging)
    web/              # React SPA
      src/
        pages/        # Page components
        components/   # UI components (agents/, board/, layout/, settings/, tour/, ui/)
        hooks/        # React Query hooks
        stores/       # Zustand stores
        lib/          # API client, auth client
  packages/
    db/               # Drizzle schema, migrations, seed
    shared/           # Shared types and utilities
```

## Scripts

```bash
pnpm dev              # Start all dev servers
pnpm dev:api          # Start API only
pnpm dev:web          # Start frontend only
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
pnpm db:push          # Create/update database tables
pnpm db:seed          # Seed demo data
pnpm db:studio        # Open Drizzle Studio (DB browser)
```

## Self-Hosting with Docker

See [SELFHOST.md](./SELFHOST.md) for full instructions.

```bash
cp .env.example .env
# Edit .env with your AUTH_SECRET and API keys
docker compose up -d
```

The app will be available at http://localhost.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `postgresql://forge:forge@localhost:5435/forge` | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6382` | Redis connection string |
| `AUTH_SECRET` | Prod | - | Secret key for session encryption |
| `ANTHROPIC_API_KEY` | No | - | Anthropic API key for Claude |
| `OPENAI_API_KEY` | No | - | OpenAI or compatible API key (OpenRouter, Groq, Ollama, etc.) |
| `OPENAI_BASE_URL` | No | - | Custom base URL (e.g. `https://openrouter.ai/api/v1`) |
| `OPENAI_PROVIDER_NAME` | No | `OpenAI` | Display name shown in the UI for this provider |
| `OPENAI_MODELS` | No | `gpt-4o,gpt-4o-mini` | Comma-separated list of available models |
| `AI_DEFAULT_PROVIDER` | No | `anthropic` | Default AI provider (`anthropic` or `openai`) |
| `AI_DEFAULT_MODEL` | No | `claude-sonnet-4-5-20250929` | Default model |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |

## License

MIT
