# AegisBank frontend

Next.js web app for AegisBank. Separate from the Spring Boot services: its own `.env`, its own Docker
setup, and it talks to the backend only through the api-gateway.

| URL | What |
| --- | --- |
| `/` | Customer site (placeholder until the backend services are complete) |
| `/v1/admin/docs-ui` | Private engineering notes with diagrams (password-protected) |
| `/api/health` | Health check for Docker / ECS / Render |

## Run

Requires only Docker.

```bash
cp .env.example .env        # set DOCS_AUTH_USER / DOCS_AUTH_PASSWORD (12+ chars) for the docs
docker compose up --watch   # http://localhost:3000, reloads on save
```

Start the backend (`docker compose up -d` and the services, from the repository root) so the gateway
is reachable on `http://localhost:8080`; the container reaches it as `host.docker.internal:8080`.

Production image, locally:

```bash
docker compose --profile prod up --build web-prod   # http://localhost:3001
```

Checks (in the running dev container): `docker compose exec web pnpm check`.

## Deploy (ECS, Render, any container host)

1. Build the production target: `docker build --target runner -t aegisbank-frontend .`
   (the build downloads the fonts from Google Fonts once, so it needs internet access).
2. Run it on port `3000` with the variables from `.env.example` set in the service's environment.
   Keep `DOCS_AUTH_PASSWORD` in the platform's secrets store. Without it the docs answer `503`.
3. Health check: `GET /api/health` (the image also has a Docker `HEALTHCHECK`).

The same image works in every environment - all configuration is read at runtime.

## More

- [`AGENTS.md`](AGENTS.md) - how the code is organised and the rules for changing it
- [`docs/plan.md`](docs/plan.md) - decisions, design system, roadmap
