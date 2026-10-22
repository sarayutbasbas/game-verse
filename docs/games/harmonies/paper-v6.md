# Paper v6 — separate illustration and rules overlays

All 53 current cards receive newly generated textured flat vector/storybook screen-print art: 32 normal animals, 10 Nature’s Spirits, the T-Rex promo, and 10 Crescendo Whispers. Each image leaves a quiet dark foreground and right-side space. No scores, terrain pieces, cubes, or rails are baked into the art.

Sources and exact built-in ImageGen prompts are retained in `assets/source/harmonies/paper-v6/generation-manifest.json`. Runtime WebP variants are 900×1200, 300×400 and 150×200. Original sources and previous art families remain retained. Illustrated is still the default; Sculpted keeps its existing art.

Six reusable rail families derive from the TOP token at the catalog's `cube:true` cell, including Spirits and Whispers. Colors match the current terrain sprites, with a lighter left seam and a terrain motif. Small variants omit the lower motif. Right corners clip with the card. The current catalog uses five families; wood is available without assigning an invented destination to a card.

All illustrated habitats share one 192×192 viewBox, catalog q/r projection, a common baseline and uniform scale. Bases use the same flat-top geometry, reduced slightly within their cells for consistent gaps. Physical layer order, building-base substitutions and destination cells remain independent from illustration. Existing terrain PNGs are reused. Small height labels draw last, above neighboring bases. Crystal marker variants reuse the generated gold, rainbow, amethyst and opal set; animal models remain available in the detail/shelf presentation.

Normal scores remain cumulative, Whispers show two 2/5 slots, and each Spirit renders its own scoring scenario from the implemented rule. Track heights are explicit to avoid percentage/flex intrinsic-height clipping. Scoring, networking and game state are unchanged.

Build assets: `node scripts/build-harmonies-paper-v6.mjs`. Review via the card-art browser test, then `node scripts/build-harmonies-paper-v6-qa.mjs`. Gallery: `data/qa-harmonies-paper-v6/review.html`.

Validation completed: build/typecheck; nine focused unit tests covering all 53 cards, real WebP dimensions, crystal types, scoring scenarios and shared habitat scale; browser inspection of every small/popup pair with loaded-image checks, rail mapping, rounded clipping and score containment; mouse/touch layout and placement-confirmation flows. Legacy rendering assertions were migrated from removed CSS caps/shadows to the current image pieces and 3:4 ratio, with async board-fit settling measured before comparison.

Docker was rebuilt with its existing data/auth preserved and verified at localhost:5555 across 320×667, 390×844, 768×1024, 1024×768, 1180×820 and 1600×900. Supply, choice popup, tray and first board placement use the existing terrain image assets in both art modes. This turn applied the local Docker deployment; no Vercel target was selected.

## Token visibility and size revision — 2026-10-21

Board sprites pivot at their visible lower edge (86%, accounting for alpha padding) before counter-rotating against the board tilt. This keeps the complete cylinder above the tile plane instead of cutting its lower half. Terrain choices compensate sprite padding at 138% and remain centered in their slots.

Both art modes now use the canonical SVG habitat geometry, replacing the overlapping miniature CSS 3D bases in Sculpted. Habitat viewports grow from 37% to 47% of card height; small stack multipliers grow from 18 to 26 logical pixels. A lower-art gradient improves contrast without shading tokens or scores. Owned score rows stay fully opaque, including on completed cards; only completed illustrations dim. Detail and animal-confirmation popups show an animal model only in Sculpted mode.

Validation: build/typecheck, 10 focused unit tests, 7 browser tests (all 53 card pairs, both art-mode popups, score opacity, mouse/touch and responsive placement), then a local Docker rebuild preserving its data/auth and live checks of both modes at localhost:5555.

## Grounded board sprites and animal pieces — 2026-10-21

Terrain images now anchor at the bottom ellipse's center instead of the alpha-padded image bottom. Sprite depth clearance prevents tile intersection, counter-rotation follows the board camera, and the board fitter cancels the clearance's perspective parallax against a zero-area marker at each true axial center. It recomputes after fitting/resizing; bounding-box midpoints are not treated as projected hex centers. The right-hand terrain-slot image scale is reduced independently of supply and choice-popup art.

Shelf, board and placement preview use the same animal asset in both art modes. Crystal markers remain on the card habitat diagrams. The bat uses its existing animated asset rather than the missing paper-v4 path. Board fitting uses the fixed hex field; model bounds do not change the garden scale.

Regression coverage checks ground anchors within half a pixel in top/tilted cameras across responsive layouts, terrain ink inside the right-hand slots, matching shelf/preview/board animals during real mouse/touch placement, and model asset availability for all 53 cards in both art styles.

## Animal depth and shared whispers — 2026-10-21

Animal billboards now have independent depth clearance above terrain, with their visible feet fitted to the rendered uppermost token cap. This prevents a three-layer terrain stack from intersecting or hiding its animal. The same fit handles animal placement previews and finalized gardens.

Removed the shared-cell rules that reduced or shifted the main animal. A co-located Whisper uses half the main figure dimensions, sits in front of it and overlaps its lower-right quarter. The fitter derives that position from the main figure's actual bounds, including during a Whisper placement preview.

Browser regressions cover both art styles, three-layer visibility with image-pixel comparisons (excluding translucent glow), unchanged main-animal sizing, Whisper overlap/size across phone/tablet viewports, and normal mouse/touch placement flows.

## Stable garden scale — 2026-10-21

The responsive fitter measures only the fixed hex field. Adding terrain, a raised animal or a shared Whisper no longer shrinks the garden on phones. Right-hand slots reserve the same canonical terrain footprint before and after placement, so filling the board does not change the space available to it. Sprite contact-point alignment still runs after fitting; shared Whispers use half the main animal’s rendered dimensions.

Regression checks compare board width before/after the first terrain placement, an animal on a three-layer stack and a shared Whisper, in addition to camera, responsive layout and visibility coverage.

## Readable terrain layers — 2026-10-21

Board terrain uses the base sprite’s rendered dimensions for every disc in a stack. Each additional layer rises from the lower ellipse anchor (64% of image height) to the upper cap (38%), exposing a full cylinder wall in both top and tilted cameras. This replaces reliance on the fixed 12px depth increment for visible spacing; depth ordering remains intact. Animals still anchor to the newly positioned uppermost cap, and the fixed hex field continues to determine garden scale.

Browser regression coverage verifies matching dimensions and layer spacing for dense rock and wood/leaf stacks across phone, tablet and desktop sizes and both cameras, together with animal depth, shared Whispers, placement and finished gardens.

## Terrain placement and readable card categories — 2026-10-21

Board terrain is 90% of its previous sprite width/height and remains anchored to the same axial center. The visible preview is the real ghost cylinder with final opacity, dimensions and stack fit; confirmation adds only a check button. Stack multipliers are projected onto the uppermost cap and drawn ahead of neighboring terrain. Right-hand tokens center their entire alpha-padded image inside each frame. None of these pieces participate in garden-scale fitting.

Large card habitats now replace their crystal marker with the same animal model used on the board, in both art modes. Small card habitats retain their crystal marker. Detached card-detail models are removed. Miniature Paper score rows grow from 9% to 12.5% of card height, with wider sockets and special panels; dinosaur score panels are orange. Three generated transparent category badges distinguish rainbow Spirits, purple Whispers and white dinosaurs, accompanied by stronger category borders. Source/output paths and generation prompts: [category-badges-v1.json](category-badges-v1.json).

T-rex scoring was rechecked against Libellud’s official promo explanation: two bonus points per ordinary Animal cube connected to the Spirit through an Animal chain, rather than doubling the board total. Existing chain/branch/cycle/gap and complete-game tests cover the implemented calculation; it was not changed. The detail popup now includes the six Animals = twelve bonus points example.

## Shared-cell inspection and placement overlays — 2026-10-21

The persistent final-turn button now occupies the board’s lower message area, where placement errors appear, rather than the supply heading. Errors temporarily take priority. The final-round explanation remains available by tapping the button.

Tapping a cell containing both an Animal/Spirit and a Whisper opens two ordinary small card faces side by side, including current completion/score presentation. Selecting one opens its usual detail; inspection sends no game action. Completion ribbons now live inside the clipped card face, below the special border, on owned cards and details.

Animal previews render the same figure in the actual terrain stack at its final height. The extra painted confirmation cap is removed; only a separately projected green check remains. Tapping either the preview figure or check confirms. Board figure feet move down from 38% to 48% of the uppermost terrain image to sit nearer the cap’s center. Shared Whispers retain their lower-right overlap.

Browser checks cover both art modes, shared-cell selection without room revisions, special-frame/ribbon layering, final-turn notice placement at phone/tablet/desktop sizes, model grounding, and uncut confirmation buttons with real mouse/touch placement.

## Complete 2D storybook model family - 2026-10-21

All 53 catalog cards now have separately generated transparent sprites in `figurines/storybook-v1`: 32 ordinary Animals, 11 Spirits including the T-rex promo, and 10 Whispers. Each prompt uses the existing paper-v4 otter as an explicit style reference for expressive ink, flat gouache, warm print grain and an ivory cutout contour. Original model assets remain untouched; Sculpted continues to use the existing animated-v5 / sculpted-v1 mapping.

The new family shares a 160x184 canvas, a uniformly fitted 144x168 content box and bottom baseline 176. Species retain their own silhouettes without stretching their anatomy. Shelf, board, placement preview and large-card model select the same mode-specific asset. Normal board figures shrink by 25%, leaving the hex field, terrain, shelf/card sizing and ground anchors intact. Whispers share the figure box when alone and stay at half their companion's size when sharing a cell. The 2D family uses a short ground shadow rather than the former soft aura.

Prompts, sources, export hashes and preserved 3D hashes: [storybook-v1-model-jobs.json](storybook-v1-model-jobs.json). Rebuild normalized exports with `node scripts/build-harmonies-storybook-models.mjs`. Review gallery: `data/qa-harmonies-storybook-v1/review.html`; contact sheet: `data/qa-harmonies-storybook-v1/contact-sheet.png`. Regression checks require all 53 mode-specific paths, equal canvases/baselines, matching preview/board/card assets and unchanged original 3D file hashes.

### October 2026: paper tokens and special scenes

The 2D family now uses 21 newly generated art-only special scenes in `special-paper-v1`: rainbow Nature’s Spirits, radiant gold T-rex, epic purple Whispers. Full/small/lite exports retain 900×1200, 300×400 and 150×200 dimensions. Special rims were removed; category badges and terrain-derived rails remain separate layers. Raw images and complete built-in ImageGen prompts are preserved in `assets/source/harmonies/special-paper-v1` and `special-paper-v1-jobs.json`.

Six generated paper face textures are assembled into uniform transparent 256×224 cylinder sprites in `tokens-paper-v1`. They retain the original bottom-ellipse anchor (0.5,0.64), cap center (0.5,0.38) and 0.26-height layer step. Minimal cream motifs use the six rail colors. `tokens-v5` remains the sculpted family. Rebuild exports with `node scripts/build-harmonies-special-paper.mjs`; its review sheet is `data/qa-harmonies-special-paper-v1/contact-sheet.png`.

The hamburger opens a native modal with the 3D checkbox directly below reduced effects. This is a personal browser preference (`gameverse:harmonies:card-art`), persists after reload, and never sends a game action or changes another client. The common texture resolver covers board, supply, confirmation, hand, card diagrams, scoring and how-to examples. Board stack patch keys include art mode so preserved DOM cannot retain stale textures. Both families use the same legible score renderer: Whisper numerals retain normal-card height, and Spirit scenarios show diagrams on the left and points on the right. Miniature stack multipliers have dark backplates; board multipliers are smaller.

While a placement is pending, a click on visible preview sprite pixels confirms the same action as its green check. Transparent padding and other cells keep their normal behavior. Mouse/touch tests cover confirmation, cancelled selection, exact preview-to-placed geometry, modal switching, reload, independent clients, and unchanged game revision during view changes.

Verified this revision: 16 focused unit tests; 17 browser cases covering all 53 small/popup cards, both animal modes/depth, shared-card picker, placement with mouse/touch, T-rex, view preferences, leaderboards, final scoring/restart, and rail behavior. Rebuilt local Docker successfully. Live checks at `http://localhost:5555` cover both texture families, supply/choice/hand/placement/popups, local view switching, help and Solo rank UI, plus responsive sizes from 320×667 to 1600×900. Hash checks confirm all 63 new special-art exports and six paper textures are served exactly, along with all 53 storybook models and all 53 preserved 3D mappings. No data volume or authentication store was replaced.
