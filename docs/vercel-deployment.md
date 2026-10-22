# Vercel deployment

Production project: `sarayuths-projects/game-verse`; canonical origin `https://games.basnana.com`. Git remote `sarayutbasbas/game-verse`, branch main. Initially Git only held README and the deployment returned404. Source, assets and deployment configuration must be committed together.

## Runtime

Vite static assets on Vercel CDN; `api/gameverse.ts` exports the existing Node HTTP server (without listening on a local port). Rewrites preserve the original `/api/*`, `/ws`, `/avatars/*`, `/health` paths. Deep links use index.html. Vercel Fluid WebSockets beta, Node24, Singapore, max300s per connection; existing client reconnect/resume handles rotation.

SQLite remains the local dev/default test backend. Production uses **Neon Free** Postgres, provisioned explicitly with plan `free_v3`, region sin1, Neon Auth disabled (existing Better Auth retained). No Render/paid compute. PostgreSQL stores auth/users, profiles/avatars, room state/revisions/receipts and presence. Production starts a fresh database; existing localhost rooms/accounts are not copied or published.

The existing synchronous coordinator uses a bounded worker for Postgres I/O, preserving its commit-before-ACK contract. All room mutations acquire a PostgreSQL transaction advisory lock, reload/validate durable room state, reattach local sockets to their sessions, apply the same engine, save and commit before sending. Errors roll back and force resync/reconnect. This is a serialized MVP coordinator, not a high-throughput architecture.

Each session has one leased connection ID. Presence expires after15s, renews while connected; a transport on another instance replaces the old connection. Every active instance checks shared state about once per second and projects only each socket's permitted view. Revision/receipt handling, snapshot/gap sync and engines remain unchanged. Presence/room state are not trusted from clients. Room closure and auth revocation propagate across instances.

## Secrets and Google

Set **production only**: `GAMEVERSE_DATABASE_URL` (pooled Neon URL), `BETTER_AUTH_SECRET` (new stable random secret), `BETTER_AUTH_URL=https://games.basnana.com`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Neon also connects its provider environment values. Never set VITE-prefixed secrets, commit env files or copy private SQLite/backups into a deployment. Sensitive Vercel variables may pull as `[SENSITIVE]`; this is a redacted placeholder, not a usable credential. Preserve the actual configured production secret rather than generating it on every deployment.

Google Console:

- Authorized JavaScript origins: `https://games.basnana.com`
- Authorized redirect URIs: `https://games.basnana.com/api/auth/callback/google`

The user confirmed adding these. Localhost entries can stay. Use the canonical URL for login and room QR, not generated deployment aliases.

## Deploy and migration

```sh
npm ci
npm test
npm run build
# Run once with securely injected direct database URL + production origin/secret:
npx tsx scripts/migrate-postgres.ts
# Stage a production deployment, inspect its health, then promote that exact URL:
vercel deploy --prod --skip-domain
vercel promote <staged-production-url>
```

`GAMEVERSE_DATABASE_URL` should be the direct URL for migration and pooled URL for normal runtime. `scripts/migrate-postgres.ts` applies checked-in platform SQL and Better Auth's PostgreSQL schema. Runtime does not run auth migrations on each request. No destructive migration from local SQLite.

## Tests

```sh
# Isolated Postgres only, never use the production database for this rule/room suite:
GAMEVERSE_TEST_POSTGRES=postgres://... BETTER_AUTH_SECRET=<test-secret> npx tsx --test tests/postgres-rooms.test.ts
# Explicit deployed URL and its database; fixtures only upgrade newly-created test Guests:
GAMEVERSE_E2E_URL=https://games.basnana.com GAMEVERSE_E2E_DATABASE_URL=<database-url> npx playwright test --config playwright.deploy.config.ts
```

Hosted fixture owner IDs are written privately under ignored `data/deploy-test-owners.jsonl` for scoped cleanup. They do not bypass Google via a production endpoint. No test/debug login API is shipped. See progress.md for actual executed results, not just build status.

## Limits and costs

Only free plan resources were authorized. Do not upgrade Neon/Vercel or enable paid overage. Free quotas can stop service when exhausted; this does not promise unlimited free hosting. Live WebSockets consume Vercel duration/memory allowance and keep database compute active. Public beta/platform time limits can disconnect transports; clients resume authenticated state. Snapshot/room loading is bounded and this coordinator targets small private groups. Large concurrency requires a separate design and budget approval. No SLA is implied.

Trusted ingress: Vercel runtime uses validated `X-Forwarded-For` only when `VERCEL=1`; other runtimes use the socket peer. [Vercel request headers](https://vercel.com/docs/headers/request-headers). Platform capability references: [WebSockets beta](https://vercel.com/docs/functions/websockets), [SQLite storage constraints](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel).

After a hosted test run, `scripts/cleanup-deploy-fixtures.ts` removes only rooms owned by the recorded fresh fixture users and their non-provider test accounts. It never selects rooms by display name and preserves accounts with real provider records. Requires `GAMEVERSE_E2E_DATABASE_URL` injected securely.

## Custom domain (2026-10-14)

`games.basnana.com` is attached to this project. Cloudflare CNAME `games` → `6e168d1d386e77a8.vercel-dns-017.com`, DNS only, TTL Auto (project-specific recommendation). Previous CNAME to `game-verse-psi.vercel.app` was also valid; HTTPS and API200 verified before switching auth. Nameservers stay with Cloudflare.

Production `BETTER_AUTH_URL` and `GAMEVERSE_JOIN_ORIGIN` use `https://games.basnana.com`. `GAMEVERSE_TRUSTED_ORIGINS` retains `https://game-verse-psi.vercel.app` for existing tabs. Production auth secret, database and memberships are unchanged. Login on the new domain to establish its own cookie; browser storage/cookies are origin-scoped. Existing Google members can return to their seats with the same account. Keep previous Google OAuth entries alongside the new ones. User confirmed adding the custom-domain Google origin and callback before switching.

### Database timeout recovery

A timed-out synchronous DB worker is discarded. Its transaction must be abandoned before the next request creates a worker with a fresh reply buffer; uncertain queries are never replayed. Client reconnect plus durable receipts resolve command outcomes. Isolated Postgres tests force both connection termination and worker wait timeout. `/health` checks HTTP liveness; use `/api/platform` and an actual room action to check database-backed behavior. Hosted test budgets allow the bounded 15s DB failure plus reconnect, and public-view assertions wait for presence convergence across instances.

Release assets: generated high-resolution Harmonies masters remain local under ignored `assets/source/harmonies/`. Checked-in `public/art/harmonies/` contains all runtime exports, including both older mode assets and the 43 new ORIGINAL cards; scripts and prompt/provenance manifests are committed. Neither private `.env*` files nor ignored QA databases/logs are part of the release.
