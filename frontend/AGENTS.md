# AGENTS.md - AegisBank frontend

Read this before changing anything in `frontend/`. It applies to every AI coding agent (Claude Code,
Codex, Copilot, ...). The repository root `../AGENTS.md` (git workflow, backend rules) also applies -
especially: work on `dev_v1` in the main checkout, no worktrees or new branches, **do not commit or push
unless asked**, never run destructive git commands, re-read a file right before editing it.

Why things are the way they are: `docs/plan.md`.

## Boundaries

- Work **only inside `frontend/`**. Everything outside it is the Spring Boot backend - don't touch it
  for frontend work. The frontend is not a Maven module.
- The frontend talks to the backend **only through the api-gateway**, and only via the server-side
  proxy (`/api/gateway/v1/**`). Never call a service port (8081, 8082, ...) directly, never call
  `/internal/**`, never add `NEXT_PUBLIC_*` variables.
- The customer app lives under `/app` (overview, transfers, add money, transactions, accounts) and is
  wired to the three client-facing services. Only add a nav entry for a page that exists. The docs UI
  (`/v1/admin/docs-ui`) is private: never link to it from the site.
- `/app` has no authentication: the active account comes from `localStorage`
  (`src/lib/accounts/`), not a session. Read it with `useKnownAccounts()`, never with an effect -
  see `/v1/admin/docs-ui/frontend/banking-app`.

## Run it (Docker - no local Node needed)

```bash
cp .env.example .env                                  # once
docker compose up --watch                             # dev, hot reload  -> http://localhost:3000
docker compose --profile prod up --build web-prod     # production image -> http://localhost:3001
docker compose exec web pnpm check                    # lint + typecheck + tests + contrast (dev container running)
```

With local Node 26 + pnpm 12 instead: `pnpm install`, `pnpm dev`, `pnpm check`, `pnpm build`.

| Script | Does |
| --- | --- |
| `pnpm dev` | Dev server on 0.0.0.0:3000 |
| `pnpm build` / `pnpm start` | Production build / run it |
| `pnpm lint` / `pnpm lint:fix` | Biome lint + format check / fix |
| `pnpm typecheck` | `next typegen` + `tsc --noEmit` |
| `pnpm test` | Vitest (unit + component) |
| `pnpm tokens:check` | WCAG AA contrast of every colour token pair, site and docs (paper) theme |
| `pnpm check` | All four checks above - **run before reporting work as done** |
| `pnpm api:types` | Generate API types from the backend's OpenAPI docs (backend must be running) |

## Layout

```
src/
  app/
    layout.tsx                 single root layout: <html>, fonts
    (site)/                    customer site (site.css, AppProviders)
    v1/admin/docs-ui/          private docs UI (Fumadocs, docs.css) + search API
    api/gateway/[...path]/     BFF proxy to the api-gateway
    api/health/                container health check
    not-found.tsx, global-error.tsx, robots.ts
  proxy.ts                     Basic auth for /v1/admin/** (Next 16 "proxy" = old middleware)
  components/
    ui/                        design-system components (button, input, field, card, badge, table, amount, ...)
    brand/ site/ feedback/ motion/ providers/
    docs/                      MDX-only components: diagrams/ (Diagram, SequenceDiagram, SystemMap), api/, code/, gallery
  lib/
    api/                       client.ts (browser fetch), gateway-proxy.ts, problem.ts (ApiError), error-messages.ts
    auth/basic-auth.ts  env.ts (server-only, runtime config)  fonts.ts  format.ts  cn.ts
    docs/source.ts             Fumadocs source (content/docs)
  styles/                      tokens.css -> theme.css -> base.css; site.css and docs.css entry points
content/docs/                  docs pages (MDX) + meta.json (sidebar order)
docs/plan.md                   decisions and roadmap
```

## Rules

**Next.js 16** - newer than most training data; check `node_modules/next/dist/docs/` before using an API.
- `cacheComponents` is on: no `dynamic`, `dynamicParams`, `revalidate` exports. Read request data
  (`headers()`, `connection()`, uncached fetches) only in Route Handlers or inside `<Suspense>`.
  Don't call `new Date()` / `Math.random()` while prerendering a server component.
- `src/proxy.ts` replaces `middleware.ts` and runs on the Node.js runtime.
- Route props: use the global `PageProps<"/route">`, `LayoutProps`, `RouteContext` types.

**Styling and design**
- Use semantic tokens only: `bg-surface`, `text-muted-foreground`, `border-border`, `text-money-credit`.
  Never raw colours (`#fff`, `bg-blue-500`, `oklch(...)` in components) - the default Tailwind palette is
  switched off for the site on purpose.
- One light theme, no dark mode. Brand green is `text-brand` / `bg-brand`; `bg-accent` means a hover
  background (shadcn/ui meaning). shadcn component class names (`bg-popover`, `bg-muted` ...) are mapped.
- New colour → add primitive + semantic token in `tokens.css` (and `docs-theme.css` if it is a surface), map it in
  `theme.css`, add the pair to `scripts/check-contrast.mjs`, run `pnpm tokens:check`.
- Text sizes from the scale: `text-display`, `text-h1..h4`, `text-body(-lg|-sm)`, `text-label`,
  `text-caption`, `text-overline`, `text-amount(-xl)`.
- Fonts: IBM Plex Sans (`font-sans`, `font-display`; headings at weight 500), IBM Plex Mono (`font-mono`) only for
  IDs/references. Don't add fonts.
- Money: always `<Amount>` (or `formatMoney` + `numeric`). Debits stay neutral; never colour without a sign.
  Never do arithmetic on money in the browser - display what the backend sends.
- Transaction status: `<TransactionStatus>`. Icons: lucide in the product UI, Phosphor (`<Ph name="..." />`) in docs; `aria-hidden` when decorative,
  `aria-label` on icon-only buttons.
- Merge classes with `cn()` from `@/lib/cn` (knows the custom text sizes).
- Tailwind v4 syntax: important is a **trailing** `!` (`size-1!`), CSS variables as `h-(--header-height)`.
- Avoid gradients, glassmorphism, glows, big colourful cards, decorative illustrations.

**Data and errors**
- Browser code calls the backend with `apiFetch("/v1/...")` from `@/lib/api/client` (through TanStack
  Query for reads). It throws `ApiError`; branch on `error.errorCode`, show `userMessageFor(error)`,
  show `error.fieldErrors` under form fields. Never show backend `detail` text raw to customers.
- Money-moving requests pass `idempotencyKey: newIdempotencyKey()`; mutations never auto-retry.
- Server config only through `serverEnv()` from `@/lib/env` (validated with zod). A new variable →
  add it to the schema, `.env.example` (with a comment) and the owner's local `.env`.
- Backend error codes live in `BACKEND_ERROR_CODES` (`problem.ts`) and must match the services'
  `ErrorCode` enums; every code needs a message in `error-messages.ts` (a test enforces this).

**Docs UI**
- Add a page: `content/docs/<section>/<name>.mdx` with `title`, `description`, `icon` (lucide name)
  frontmatter, then list it in that folder's `meta.json`. Details: `/v1/admin/docs-ui/frontend/writing-docs`.
- Diagrams: **never Mermaid** (owner's rule - its output doesn't fit the design). Use `<SequenceDiagram>`
  (participants + steps, laid out for you) or `<Diagram>` with `<Box>` / `<Arrow>` (hand-drawn SVG, `flow` = the
  animated main path). The system map is `<SystemMap />` in `src/components/docs/diagrams/library.tsx` -
  update it when a service or connection changes.
- Markdown must render properly: tables, inline code and code fences are checked in the browser (and on a
  ~390 px wide screen) before a docs change is done.
- Links between pages: relative file links in markdown (`[x](./other.mdx)`); in JSX props such as
  `<Card href>` use the full path (`/v1/admin/docs-ui/...`).
- Facts about the backend must be checked against the backend code before writing them.
- Unknown docs URLs render the 404 page but may answer HTTP 200 (documented Next.js streaming
  behaviour; the page is still `noindex`).

**Tests** - Vitest, files next to the code (`*.test.ts(x)`). Pure logic in `node` environment;
components add `// @vitest-environment jsdom` at the top. Add or update tests for behaviour you change.

**Never**
- Commit `.env` or put secrets in code, `next.config.ts` or the Dockerfile.
- Remove the docs auth or make it fail-open in production.
- Forward `/internal/**` or cookies through the proxy.
- Claim something works without running `pnpm check` (and `pnpm build` for config/route changes).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
