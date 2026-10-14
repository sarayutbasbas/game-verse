# Vercel deployment

Production project: `sarayuths-projects/game-verse`; canonical origin `https://game-verse-psi.vercel.app`. Git remote `sarayutbasbas/game-verse`, branch main. Initially Git only held README and the deployment returned404. Source, assets and deployment configuration must be committed together.

## Runtime

Vite static assets on Vercel CDN; `api/gameverse.ts` exports the existing Node HTTP server (without listening on a local port). Rewrites preserve the original `/api/*`, `/ws`, `/avatars/*`, `/health` paths. Deep links use index.html. Vercel Fluid WebSockets beta, Node24, Singapore, max300s per connection; existing client reconnect/resume handles rotation.

SQLite remains the local dev/default test backend. Production uses **Neon Free** Postgres, provisioned explicitly with plan `free_v3`, region sin1, Neon Auth disabled (existing Better Auth retained). No Render/paid compute. PostgreSQL stores auth/users, profiles/avatars, room state/revisions/receipts and presence. Production starts a fresh database; existing localhost rooms/accounts are not copied or published.

The existing synchronous coordinator uses a bounded worker for Postgres I/O, preserving its commit-before-ACK contract. All room mutations acquire a PostgreSQL transaction advisory lock, reload/validate durable room state, reattach local sockets to their sessions, apply the same engine, save and commit before sending. Errors roll back and force resync/reconnect. This is a serialized MVP coordinator, not a high-throughput architecture.

Each session has one leased connection ID. Presence expires after15s, renews while connected; a transport on another instance replaces the old connection. Every active instance checks shared state about once per second and projects only each socket's permitted view. Revision/receipt handling, snapshot/gap sync and engines remain unchanged. Presence/room state are not trusted from clients. Room closure and auth revocation propagate across instances.

## Secrets and Google

Set **production only**: `GAMEVERSE_DATABASE_URL` (pooled Neon URL), `BETTER_AUTH_SECRET` (new stable random secret), `BETTER_AUTH_URL=https://game-verse-psi.vercel.app`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Neon also connects its provider environment values. Never set VITE-prefixed secrets, commit env files or copy private SQLite/backups into a deployment. Sensitive Vercel variables may pull as `[SENSITIVE]`; this is a redacted placeholder, not a usable credential. Preserve the actual configured production secret rather than generating it on every deployment.

Google Console:

- Authorized JavaScript origins: `https://game-verse-psi.vercel.app`
- Authorized redirect URIs: `https://game-verse-psi.vercel.app/api/auth/callback/google`

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
GAMEVERSE_E2E_URL=https://game-verse-psi.vercel.app GAMEVERSE_E2E_DATABASE_URL=<database-url> npx playwright test --config playwright.deploy.config.ts
```

Hosted fixture owner IDs are written privately under ignored `data/deploy-test-owners.jsonl` for scoped cleanup. They do not bypass Google via a production endpoint. No test/debug login API is shipped. See progress.md for actual executed results, not just build status.

## Limits and costs

Only free plan resources were authorized. Do not upgrade Neon/Vercel or enable paid overage. Free quotas can stop service when exhausted; this does not promise unlimited free hosting. Live WebSockets consume Vercel duration/memory allowance and keep database compute active. Public beta/platform time limits can disconnect transports; clients resume authenticated state. Snapshot/room loading is bounded and this coordinator targets small private groups. Large concurrency requires a separate design and budget approval. No SLA is implied.
