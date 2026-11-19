# Friday and Tiny Towns compact tabletop UI — 2026-11-03

The requested visual reference is Harmonies: one slim top rail, game title at left, circular illustrated-guide/library/audio/settings tools at right, and secondary content in dialogs. Keep the existing island/woodland illustrations and Thai typography. Shared colors are forest `#245b48`, pale gold `#fff4ce`, border gold `#ddc58e`, Friday ink `#254333` and Tiny Towns ink `#28493d`.

`compact-game-ui.ts/.css` supplies common SVG tools, circular centered close controls, scoped game chrome and resize rendering. Chrome changes apply only while Friday or Tiny Towns is active. Lobby/account/platform layouts retain their existing behavior; leaving a game stops its resize callback from rendering into another screen. Existing audio controls retain their independent effect/music settings.

Friday:

- Remove the row of twenty individual hearts. Keep the current/max life total with one heart icon.
- Keep journey, deck counts, opponent, combat total, visible fighting cards and draw/finish decisions within the viewport.
- Fighting cards use explicit pages rather than vertical scrolling. Capacity adapts to viewport and pending choices; drawing a new card opens its page. Every card remains inspectable and its legal abilities/targets remain reachable.
- Private sorting stays on the player's controller. Pile inspection and restart are in settings; detailed cards and long rules open dialogs.

Tiny Towns:

- Put blueprints above the town. Short phone viewports use blueprint pages; larger phones show two rows and desktops one row.
- Resource choices are compact. Town size derives from the remaining viewport with CSS size containers, keeping the 4×4 board and action controls on the main screen.
- Settings contains player/avatar selectors. Viewing another town is read-only and provides a direct return to the owner's town. Shared displays retain all public towns.
- Alternate construction matches, free-building types, Watch selection and Warehouse choices open bounded dialogs. End-game score details and the final town also open a dialog rather than extending the main page.

No rule, server ownership, private projection, score or randomization behavior changes. Main-page document scrolling is disabled only for these two in-game themes; dialogs remain scrollable for long reference material. Native dialogs preserve focus and Escape close. Close tools use a square border box, circular border, grid centering, and a centered SVG.

## Verification

- `npx tsx --test tests/friday.test.ts tests/friday-integration.test.ts tests/tiny-towns.test.ts tests/tiny-towns-integration.test.ts`: 28 passed.
- `compact-layout.spec.ts`: actual authenticated Friday and two-player Tiny Towns rooms at 390×844, 320×568, 844×390; document bounds and controls/board bounds; paginated fighting cards; centered circle/SVG geometry; blueprint order; menu town switching and read-only denial.
- Existing Friday browser scenario exercises a complete legal game, sorting/reload, score, rematch and pile inspection. Tiny Towns browser scenarios exercise a complete Solo, construction matches, reload/rematch, two-player private monument drafts, and six real phones sharing one display.
- `npm run docker:rebuild`: rebuilt with the existing isolated Docker volume and health check at port 5555. Browser screenshots are retained under ignored `data/compact-ui/` and game-specific data directories.

No main push or Vercel deployment was requested or performed for this UI change.

Final Docker verification: `COMPACT_LIVE=1 FR_LIVE=1 TINY_LIVE=1 GAMEVERSE_E2E_DOCKER=1 npx playwright test --config playwright.docker.config.ts tests/browser/compact-layout.spec.ts tests/browser/friday.spec.ts tests/browser/tiny-towns.spec.ts` — **4 passed**. Friday completed 318 UI decisions with private-sort recovery, scoring and rematch; the earlier seeded isolated run completed a win in 346 UI decisions. Tiny Towns completed Solo and the six-controller display scenario. Both game routes return HTTP 200. Final Docker health is healthy; TypeScript and production compilation pass. `git diff --check` passes.
