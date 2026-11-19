# Spirit Island verification — 2026-11-03

Implemented scope is the non-adversary base game described in `rules.md`. All eight base Spirits, 90 Powers (32 Unique/36 Minor/22 Major), 15 Fear cards, two optional Blighted Island cards, one-to-four Spirits including true Solo, and the physical balanced-board adjacency facts are included. No Adversary, Scenario, expansion, thematic-board or event content is advertised as supported.

## Rule and transport checks

`npx tsx --test tests/spirit-island.test.ts tests/spirit-island-integration.test.ts` passes **19 tests**. Coverage includes:

- Exact setup, active progression reservations, map/corner/cross-board adjacency, secret projections, paid plays and elements, growth/income, strict atomic rejection.
- Ravage damage to land/Dahan, efficient Dahan allocation, counterattacks, skips, cascades, Presence loss, healthy-to-blighted conversion with the additional-one erratum.
- Fear overflow and immediate Terror changes, destruction versus removal/replacement, inherited damage, sacrifice victory, Bringer virtual damage and Ocean drowning.
- Support-Power recipient identity throughout nested choices; Vengeance grouped triggered damage, Bringer ownership, Living Energy's Sacred Sites, Harbingers origin Fear, stacking Dread Apparitions, and recovery of destroyed Presence.
- Synthetic stress resolutions for all 90 Power scripts, all 14 innates at lower/highest optional ceilings, and all 45 Fear-card tiers. These tests check instruction support and terminating legal decisions; they are not a claim of exhaustive testing of every pairwise card interaction.
- **32 complete seeded legal games**, Solo through four players, all eight Spirits, both Blight options and progression on/off, checking persistent-state invariants after each action and final settlement/score. Victory/sacrifice behavior is covered separately by focused rule fixtures.
- Four actual authenticated WebSocket controllers, read-only watcher/display, cap enforcement, private hands and four-card offers, hostile actor fields, duplicate receipt, stale-revision race, account-bound reconnect, cold process restore in the middle of a private gain, and host-only rematch.

## Browser / Docker checks

`SPIRIT_LIVE=1 GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/spirit-island.spec.ts` passes **two browser scenarios** against the rebuilt Docker application at `http://localhost:5555`:

1. Actual 390px phone and 1440px display: illustrated library, Solo setup, growth/income, paid cards and targeting, complete game and score, in-game reload/reconnect, rematch. No horizontal document overflow at 320px or 390px. No browser errors.
2. Four independent phone contexts plus a public display: distinct private hands, all four boards public, and a complete coordinated first Invader cycle into round two. No browser errors.

Screenshots are retained locally under ignored `data/spirit-island/docker-*.png`. The generated cover has true transparency. All **124 WebP assets** return HTTP 200 with the expected image content type from Docker. Runtime illustrations total **5,722,510 bytes**. Source masters and prompt manifest remain preserved.

The local rebuild uses `npm run docker:rebuild` and the existing isolated port-5555 Docker storage. No data volume was removed, no port-3000 database was replaced, and no main-branch push or Vercel deployment was performed.

Final repository regression: `npm test` reports **595 tests, 591 passed, zero failed, four existing skips**. TypeScript and production compilation pass as part of the final Docker rebuild. `git diff --check` passes. The Vite bundle-size advisory remains a warning, not a build error; this change introduces no new runtime dependency.
