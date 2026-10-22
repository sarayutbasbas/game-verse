# Harmonies cards v5 — Batch 1

Batch 1 review contains nine cards: `animal-01` through `animal-05`, dinosaur `spirit-11`, Nature's Spirit `spirit-09`, Crescendo `whisper-05`, and bat `animal-22`. Every other card keeps its current artwork as a fallback.

## Asset and rendering split

- `assets/source/harmonies/cards-v5/`: lossless ImageGen masters and generation manifest.
- `public/art/harmonies/cards-v5/`: 720×1280 full backgrounds plus 360×640 popup, 270×480 small, and 135×240 lightweight derivatives.
- `public/art/harmonies/tokens-v5/`: one reusable transparent master for each terrain face, the neutral hex base, and animal marker.
- Card backgrounds contain only the animal, habitat, rounded silhouette, and quiet composition space. They contain no score, text, rules, token stacks, placement marker, or baked score rail.
- `rails-v5/` supplies the independent 94×1280 right rail. CSS fixes it at 13.0556% of every card, so normal, Spirit, dinosaur, and Crescendo cards have exactly the same rail width.
- `harmonies-presentation.ts` projects `pattern.q/r` to the existing flat-top axial card plane and builds every stack bottom-to-top. The same token artwork is used by the board, small cards, owned cards, and popup.
- Small cards enlarge the coded habitat and score track. Stack multipliers are live HTML and appear only on small cards. Popup stacks show every physical layer without a multiplier.
- Score values stay live catalog text inside reusable SVG sockets. Track height follows `points.length` instead of stretching every card to one height.

## Theme interface

The renderer exposes `normal`, `spirit`, `dinosaur`, and `whisper` card kinds. This review batch includes all four treatments: five normal cards, one amber fossil dinosaur, one teal Nature's Spirit, and one violet Crescendo card. Score backgrounds, rails, seals, and live score labels follow each treatment while the catalog rules remain unchanged.

Master backgrounds are 720×1280. Derivatives are resized from that master without regenerating composition. Token masters are normalized to a shared transparent canvas so scale, camera angle, side depth, light, and shadow remain identical at every use site.

## Wider card revision

The illustrated UI uses width:height 300:430. Full artwork occupies the left 86.9444% so the separate score rail cannot cover the animal. The nine-card batch includes bat `animal-22`. Generated masters remain retained at their original resolution.

V5 habitat overlays use `harmonies-hex-layout.ts` with flat-top 66×56 bases. STEP_X is exactly 49.5 (three quarters of 66), STEP_Y is 56; adjacent bases share an edge. Catalog q/r are never rotated or mirrored. Board and all card views share this projection. Token width is 52, layer rise 17, crystal width 25 and height 28; sprites include transparent safety padding. Depth sorting is y then x.

Normal cards use gold crystals, Nature’s Spirits use amethyst, and T-Rex uses opal (ID checked first). Whisper keeps its existing object. Scores descend visually in both sizes: small tracks anchor 6% from bottom, popup tracks 4% from top. Small wrappers clip all four corners including the rail. Habitat placement is uniformly scaled with SVG meet, never stretched independently.

Review artifacts: `data/qa-harmonies-cards-v5/geometry-review.html`. Reproduce with the focused card-art browser test, then `node scripts/build-harmonies-cards-v5-qa.mjs` and `npx tsx scripts/build-harmonies-geometry-qa.ts`. Debug views are QA-only.
