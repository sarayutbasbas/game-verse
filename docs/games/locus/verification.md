# Locus verification — 2026-10-16

Ready locally at http://localhost:5555/games/locus. Tucker base multiplayer2–5, rules version `tucker-base-2024-en-v1`, schema1. No Solo. No push or Vercel deployment performed.

## Executed checks

- `npm run build`: TypeScript client/server and Vite production build pass.
- `npm test`:229 tests,227 pass,2 optional external-PostgreSQL checks skipped,0 failures. Includes every existing game engine/room suite.
- Final focused rerun `npx tsx --test tests/locus.test.ts tests/locus-rooms.test.ts tests/turn-sound.test.ts`:23/23 pass after final sound/UI changes.
- `PLAYWRIGHT_PORT=3001 npx playwright test tests/browser/locus.spec.ts`:4 pass, Docker-only case intentionally skipped in this isolated run. Complete actual2-phone game including both modes, preserved preview while opponent picks, rotate/mirror/ghost/confirmation, coins, bonuses, reload during combo, finished score dialog, independent close, reduced motion, rematch. Separate3/4/5-player setup+draft+next-deal cycle verifies all market slots on360px phones. Desktop1440, shared display1024×768, phones390×844 and360×780 inspected via screenshots.
- Critter Kitchen browser regression: full2-player122action and3-player159action games pass after extracting the shared presentation contract/preferences. Docker-only case separately executed below.
- `npm run docker:rebuild`: image rebuild and container healthy. `/health` returns `{ "ok": true }`. Mount remains `gameverse-local_local-data:/app/data`; no volume replaced or deleted; port3000 app not changed.
- `GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts --grep 'Locus Docker5555|Critter Kitchen actual Docker'`:2/2 pass against actual localhost5555 container. Locus host+2 independent phone contexts created/joined/ready/started, chose a card, confirmed a real shape and observed identical committed marks on display. Critter Kitchen real Docker secret planning and stable market flow also pass.

## Rule and reliability evidence

13 Locus unit cases cover exact48cards/12coin/208shapecells,213sheetcells/35bonuses, D4 rotation/mirror, irregular red/green holes, bold start/orthogonal adjacency/no overlap, allfive scoring functions and320point fully-marked reference, malformed/foreign/stale intents, coin budgets, no double bonus, connected double blocks, optional skips, original card discard+2, remaining-card timing/shared ownership/once limit, multi-hop wild→yellow→purple(recolor)→red→green, final pending/coin opportunities and a complete additional tied round.

Complete deterministic games for2/3/4/5 players verify all16/15/16/15deals, first-player rotation, reshuffle,48physical-card conservation, invariant validation after every action and final score storage.

Actual WebSocket3-player full game verifies authenticated turn enforcement, read-only host/spectator, own epoch commuting while others act, rejected old own intent, duplicate receipt/payment, restart with two purchased single blocks pending, restart during a bonus, final-score recovery and manager rematch. Public payloads inspected for deck/session leaks. Same names remain distinct by player IDs and numbered score rows.

## Presentation and assets

Five original generated WebP assets are linked at runtime; exact prompts, actual source paths, dimensions and SHA256 hashes in `asset-manifest.json`. Rulebook/sheet scans live only under /tmp research; none shipped. SVG reads the exact engine catalog/sheet data. Shared display retains small sheets for every player alongside the selected larger sheet. Paper marks animate accepted new cell events only. Snapshot/retry/presence does not replay strokes or sounds; mode switches keep local preview and never send a game action.

Fresh Web Interface Guidelines fetched before review. Fixed control labels/names, native checkbox dimensions, focus-visible SVG cell outlines, Enter/Space support, a modal focus trap/Escape, body scroll lock, modal overscroll containment, numeric alignment, long-name handling, image dimensions, touch manipulation, safe-area padding and reduced motion. Original pencil grain and deterministic tiny stroke variation preserve readable cells.

Screenshots (local QA, ignored from Git) are in `data/qa-locus/`: desktop/ipad/phone overview, preview, combo,3/4/5-player phone layouts, final desktop/phone and actual Docker display/phone. Browser pageerror list empty; no horizontal page overflow at tested widths.

## Limits

Chromium browser/touch emulation was executed; physical Safari/iPhone and external Postgres were not exercised. Test creator accounts are fresh server-side fixtures, not evidence of a Google provider sign-in. Audio is synthesized through the existing manager, not recorded pencil/coin files; music/effects retain independent device settings and user-gesture unlock. Phones suppress other players' personal Locus effect cues; shared display can play public action cues. Exact edition choices and optional-bonus timing are documented in `rules.md`.
