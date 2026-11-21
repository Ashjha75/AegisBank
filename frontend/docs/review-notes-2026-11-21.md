# Review notes - first run of the frontend (2026-11-21)

What was changed while first building and running the frontend, and why. Written so another reviewer
(human or AI) can judge each change on its own. The changes are split into separate commits.

## How it was tested

- `docker compose up -d --build web` (dev image) and `docker compose --profile prod up -d --build web-prod`
  (production image) - both build and start.
- `docker compose exec web pnpm check` - lint, typecheck, 54/54 tests and WCAG contrast all pass.
- Dev (http://localhost:3000): `/` 200, `/api/health` 200, unknown URL 404,
  `/v1/admin/docs-ui` 401 without login, 200 with `admin:admin`, 401 with a wrong password.
  `/api/gateway/v1/...` reaches the backend (returned the Spring gateway's own 404 JSON for an unknown route).
- Prod (http://localhost:3001): `/` 200, `/api/health` 200, `/v1/admin/docs-ui` 503 with the dev password
  (intended - see change 1).

## 1. Docs password: 12-character minimum only in production

Files: `src/proxy.ts`, `src/lib/env.ts`, `src/proxy.test.ts`

Problem: the owner wants `DOCS_AUTH_USER=admin` / `DOCS_AUTH_PASSWORD=admin` for local testing. With the
original code a password under 12 characters caused two problems in development:
- `src/proxy.ts` treated the short password as "not configured", so the docs were served with **no login
  at all** (the opposite of what the owner wanted).
- `src/lib/env.ts` (zod) rejected it, so `serverEnv()` threw and **every `/api/gateway/**` request failed
  with a 500**.

Change: the 12-character rule is now applied only when `NODE_ENV=production`. In development any non-empty
password is accepted and the browser asks for it. Production behaviour is unchanged: no or short
credentials -> docs answer 503 (never fail-open), and `serverEnv()` still rejects a short password.
New test: "accepts a short password in development (and still asks for it)".

To judge: is it acceptable that development allows weak passwords? The dev server is local only; the
production guard is untouched.

## 2. `.dockerignore`: keep `.gitignore` in the build context

File: `.dockerignore`

Problem: `biome.json` has `vcs.useIgnoreFile: true`, so Biome needs `.gitignore`. `.dockerignore`
excluded it, so `docker compose exec web pnpm check` (the documented check command) always failed with
"Biome couldn't find an ignore file in /app".

Change: `.gitignore` is no longer excluded. It holds no secrets (only ignore patterns), so the image
doesn't leak anything. `.env` files are still excluded.

## 3. `.gitattributes`: LF line endings for the frontend

File: `.gitattributes` (new)

Problem: git stores the files with LF, but on Windows `core.autocrlf=true` checks them out with CRLF.
The Docker image copies the working copy, so Biome (which formats with LF) reported a formatting error in
every file and `pnpm check` failed. With CRLF allowed, Biome found zero real problems.

Change: `* text=auto eol=lf` makes every checkout of `frontend/` use LF, on Windows too. The existing
working files were converted from CRLF to LF. File contents in git are unchanged (git already stored LF).
Note: right after this, `git status` may list many files as modified even though `git diff` is empty -
that's git noticing the new line-ending rule; staging them adds nothing.

## 4. Local `.env` (not committed)

`frontend/.env` was created (it is gitignored) with: `API_GATEWAY_URL=http://host.docker.internal:8080`,
`API_TIMEOUT_MS=15000`, `DOCS_AUTH_USER=admin`, `DOCS_AUTH_PASSWORD=admin`, `FRONTEND_PORT=3000`,
`FRONTEND_PROD_PORT=3001`.

## Not changed / recommendations for the owner

- Before production, set a docs password of at least 12 characters; with `admin` the production docs
  intentionally answer 503 and gateway calls would fail validation.
- `account-service/src/main/resources/application.yml` already had an uncommitted change before this
  work; it was left alone and not committed.
- The production build prints 2 CSS optimisation warnings (non-blocking); worth a look later.
