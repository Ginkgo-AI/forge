# Self-Hosting Forge

## Prerequisites

- Docker and Docker Compose
- An Anthropic API key (for AI features) or OpenAI-compatible API key

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/forge.git
   cd forge
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set your values:
   ```bash
   AUTH_SECRET=<generate-a-random-secret>
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. Start all services:
   ```bash
   docker compose up -d
   ```

5. Open http://localhost in your browser.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_SECRET` | Yes | - | Secret key for session encryption |
| `ANTHROPIC_API_KEY` | No | - | Anthropic API key for Claude |
| `OPENAI_API_KEY` | No | - | OpenAI or compatible API key |
| `OPENAI_BASE_URL` | No | - | Custom base URL for OpenAI-compatible APIs |
| `OPENAI_PROVIDER_NAME` | No | OpenAI | Display name for the provider |
| `OPENAI_MODELS` | No | gpt-4o,gpt-4o-mini | Comma-separated model list |
| `AI_DEFAULT_PROVIDER` | No | anthropic | Default AI provider |
| `AI_DEFAULT_MODEL` | No | claude-sonnet-4-5-20250929 | Default model |
| `CORS_ORIGINS` | No | http://localhost | Comma-separated allowed origins |

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web | 80 | Frontend (nginx) |
| API | 3001 | Backend API |
| PostgreSQL | 5435 | Database |
| Redis | 6382 | Cache |

## Updating

```bash
git pull
docker compose build
docker compose up -d
```

## Backup & Restore

### Backup PostgreSQL
```bash
docker exec forge-postgres pg_dump -U forge forge > backup.sql
```

### Restore PostgreSQL
```bash
docker exec -i forge-postgres psql -U forge forge < backup.sql
```

## Troubleshooting

Check service logs:
```bash
docker compose logs api
docker compose logs web
```

Verify services are healthy:
```bash
docker compose ps
```
