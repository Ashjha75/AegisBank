# AegisBank frontend - plan

The decisions behind the frontend, and what comes next. Agents: read `../AGENTS.md` first; this file
explains *why*, AGENTS.md explains *how*.

## 1. Scope

One Next.js app inside `frontend/`, fully separate from the Spring Boot backend (not a Maven module,
own `.env`, own Docker setup). Two UIs in it:

| UI | Path | Audience | Status |
| --- | --- | --- | --- |
| Customer site | `/` | Customers | Placeholder home page. Real screens are built **after all backend services are done**. |
| Docs UI | `/v1/admin/docs-ui` | The owner only (learning notes, diagrams) | Built: architecture, account-service, transaction-service, frontend design system, API layer, how to write docs. |

The docs UI is never linked from the customer site, is password-protected, and is `noindex`.

## 2. Stack (versions as installed)

| Area | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack, Cache Components, `output: "standalone"`) | Latest stable; standalone output gives a small Docker image |
| Language | TypeScript 5.9, `strict` + `noUncheckedIndexedAccess` | Catch mistakes around money and API data |
| UI runtime | React 19.3 | Ships with Next 16 |
| Styling | Tailwind CSS 4.3, CSS-first `@theme`, OKLCH design tokens | Tokens are the single source of colour, type and motion |
| Components | Own shadcn-style components on `radix-ui`, `class-variance-authority`, `tailwind-merge` | Accessible primitives, our own look, no copied template styling |
| Icons | `lucide-react` (product UI), `@phosphor-icons/react` (docs, illustrations) | One outline set in the app; Phosphor's banking/engineering coverage and weights for docs |
| Motion | `motion` (`motion/react`), respects reduced motion | Small, meaningful transitions only |
| Data | TanStack Query, `react-hook-form` + `zod` | Caching/retries for reads, typed validated forms |
| Docs | Fumadocs (`fumadocs-ui`, `fumadocs-mdx`), hand-drawn SVG diagram components (no Mermaid) | MDX pages with search, diagrams, an interactive architecture map |
| Quality | Biome (lint + format), Vitest + Testing Library, contrast checker | One fast tool per job |
| Runtime | Node 26 (LTS) on Alpine, pnpm 12 | Current LTS; pnpm pinned in `package.json` |

## 3. Design system

**Direction:** premium, understated banking. Calm, accessible, dependable. One light theme (no dark mode).
Reference for the feel: Render.com - white space, ink buttons, hairline grids.

- **Colour:** pure white pages and surfaces; near-black ink for text and primary buttons; hairline grey
  borders; one deep green brand colour (`brand`) used sparingly for links, focus, selected states and the
  logo. The docs UI uses a warm "paper" variant of the surfaces for long reading (`docs-theme.css`).
  Borders instead of heavy shadows; crisp radii (6 px for buttons, inputs, cards).
- **Money and status:** green = success / money in; amber = pending; red = failure; **a normal debit is
  neutral**. The sign (+ / −) is always text, so colour is never the only signal.
- **Avoid:** gradients, glassmorphism, glows, oversized colourful cards, decorative illustrations,
  generic AI-dashboard patterns.
- **Typography:** IBM Plex Sans 400/500/600 for everything (`font-sans`; `font-display` is the same
  family - headings at 500 with tight tracking; `numeric` = tabular figures for amounts), IBM Plex Mono
  400/500 for references, IDs and code (`font-mono`). Loaded once with `next/font/google` (self-hosted at build time) in
  `src/lib/fonts.ts`. No other fonts.
- **Tokens:** three layers in `src/styles/` - primitives → semantic (`tokens.css`, docs overrides in
  `docs-theme.css`) → Tailwind mapping (`theme.css`, which also maps shadcn/ui names). Components use
  semantic names only (`bg-surface`, `text-money-credit`). `pnpm tokens:check` verifies WCAG AA contrast
  for every text/background pair in the site and docs themes.
- **Motion:** quiet and precise, 80-260 ms (420 ms page reveals), deceleration in / acceleration out, zero under `prefers-reduced-motion`.

Live reference: `/v1/admin/docs-ui/frontend/design-system`.

## 4. Architecture

```
Browser ──/api/gateway/v1/**──▶ Next.js server (BFF proxy) ──/api/v1/**──▶ api-gateway :8080 ──▶ services
```

- The browser only talks to the Next.js server (same origin, no CORS). The gateway URL is server-side
  config (`API_GATEWAY_URL`), read **at request time**, so one image runs in every environment.
- The proxy forwards only `/v1/**`; `/internal/**` is refused (service-to-service money endpoints must
  never be reachable from a browser).
- Every backend error is RFC 9457 Problem Details. The frontend turns it - and network, timeout and
  rate-limit failures - into one `ApiError` with a stable `errorCode`. UI branches on the code, never on
  message text; customer-facing wording lives in `src/lib/api/error-messages.ts`.
- Writes send an `Idempotency-Key` and are never retried automatically; reads retry at most twice.
- No `NEXT_PUBLIC_*` variables: nothing environment-specific is frozen into the JS bundle.

## 5. Security

- Docs UI: HTTP Basic auth in `src/proxy.ts` (`DOCS_AUTH_USER` / `DOCS_AUTH_PASSWORD`, password ≥ 12
  chars, constant-time compare). **Fail-closed:** without credentials it answers 503 in production
  (open in development only).
- Security headers on every response (`nosniff`, `X-Frame-Options: DENY`, referrer and permissions
  policy); no `X-Powered-By`; `robots.txt` disallows `/v1/admin/` and `/api/`.
- Container runs as the non-root `node` user; `.env` files never enter the image or git.

## 6. Docker and deployment

- `Dockerfile` targets: `dev` (hot reload) and `runner` (standalone production server with a
  `/api/health` HEALTHCHECK).
- `compose.yaml`: `docker compose up --watch` for development (file sync, works the same on macOS,
  Windows and Linux); `docker compose --profile prod up --build web-prod` to try the production image.
- ECS / Render: build the `runner` target, expose port 3000, health check `GET /api/health`, set the
  variables from `.env.example` in the service's environment (docs password from a secrets store).
- `next build` downloads the three fonts from Google once; the build machine needs internet access.

## 7. Roadmap

1. ✅ Foundation: tokens, fonts, components, BFF proxy, error model, Docker, docs UI, tests.
2. Docs pages for each new backend service as it lands (payment, fraud-detection, notification, gateway).
3. Generate API types from the services' OpenAPI documents (`pnpm api:types`) once the gateway serves them.
4. ✅ Customer app at `/app`: open account, dashboard, transfer flow with the OTP step, transaction
   history and detail, Razorpay top-up, accounts on this device. Authentication still follows whatever
   the backend adopts (`PENDING.md` item 3); until then the active account is a `localStorage` value.
5. End-to-end tests (Playwright) for the transfer flow once it exists.

## 8. Open questions

- Gateway rate limiter: keep the servlet gateway with Bucket4j, or move to the reactive gateway
  (Redis `RequestRateLimiter`)? Affects which rate-limit headers the proxy passes back.
- Authentication model for customers (session vs. tokens, Keycloak or not) - decide with the backend.
