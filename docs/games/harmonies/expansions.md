# Harmonies — optional modules and Solo

Implemented: boards A/B/C/D, Solo, ten Nature’s Spirits, optional T-rex, ten Crescendo Whispers, **four reviewed Sanctuaries**, and **one reviewed Pulse animal (tiger)**. Modules are independently selectable and combinable. Lobby labels disclose 4/10 and 1/10; missing entries are deliberately excluded, as requested by the user on 2026-10-21. Existing base-game snapshots remain valid. A/B rematches retain their previous random-side behavior; C/D rematches retain the chosen side.

**This is a reviewed subset, not complete Crescendo/Pulse.** Six Sanctuary stacks and nine Pulse patterns remain unreadable in available primary references. Camel and yak (จามรี, not buffalo) belong to Pulse and remain outside the live deck. Tiger uses water1–rock1–leaf1 in a bent chain, destination leaf, scores 3/10/16. Pulse patterns permit six rotations and their six reflections. Names for Sanctuaries are descriptive Thai labels, not official titles.

## C/D boards and Sanctuaries

Publisher [Crescendo English rules](https://cdn.svc.asmodee.net/production-libelludv2/uploads/2026/08/HARMONIES-CRESCENDO-RULES-EN.pdf), pp4–9, define these modules. Coordinates and dry-cell identities are transcribed from the board images in that PDF. C has 26 cells around an unplayable central hole; buildings need four distinct adjacent top colors and score eight. D has 25 cells, 18 initially dry. A dry cell is ordinary when adjacent to ordinary water. Trees on ordinary cells score 2/4/9, otherwise zero. Fields of two or more score six if at least one cell is ordinary, otherwise zero. C/D water uses the river rule. No invented Solo Sun thresholds are displayed for C/D.

The Sanctuary market has two side slots and the visible draw-pile top. Claim one per turn independently of the Animal claim. Incomplete tiles share the four-card capacity. A tile permits its exact four-token stack at one location; it binds at the first otherwise-illegal construction step. Complete it to free its capacity. Any ordinary Animal card's last remaining cube may move there without a habitat if its destination matches one of the tile's two colors. Multiple final cubes may coexist; Spirits and Whispers cannot use this action. Each completed Sanctuary scores three per adjacent cell whose actual top color matches either associated color. Its stack is excluded from ordinary landscape and Spirit terrain scoring; actual top color still helps buildings and neighboring Sanctuaries. Normal Animal cube counts, completion scores and T-rex chains include Sanctuary residents.

Reviewed stacks (bottom → top):

| ID | Stack | Associated colors |
|---|---|---|
| sanctuary-01 | rock / rock / water / water | water, rock |
| sanctuary-02 | wood / wood / building / leaf | leaf, building |
| sanctuary-04 | field / wood / wood / building | building, field |
| sanctuary-05 | building / rock / rock / rock | rock, building |

Per-face photo references are in `src/games/harmonies/sanctuaries.json`. The box reverse confirms the treehouse ordering; an enlarged final audit corrected it and excluded the obscured canyon tile. Remaining work is recorded in `crescendo-pending-data.json`. [Publisher Pulse rules](https://cdn.svc.asmodee.net/production-libelludv2/uploads/2026/07/HARMONIES_PULSE_RULES_ML.pdf) establish reflection and three-color habitats.

Original art generated with built-in image_gen: ten Pulse card scenes, ten paper sprites, ten sculpted sprites and ten Sanctuary scenes. Only verified entries enter play; all forty outputs are viewable at `/art/harmonies/crescendo-review/index.html`. Prompts/source paths: `crescendo-complete-v1-art-jobs.json`. Rebuild exports with `node scripts/build-harmonies-crescendo-art.mjs`; 3:4 full/small/lite backgrounds and 160×184 sprites (baseline 176). Previous 3D assets remain unchanged.

## References and transcription

- [Publisher base rules, current English PDF](https://cdn.svc.asmodee.net/production-libelludv2/uploads/2026/07/HARMONIES_Rules_EN_compressed-1.pdf), spread 10–11: Spirits and Solo, including Sun adjustments.
- [Publisher Harmonies FAQ](https://www.libellud.com/game/harmonies/): activated Spirit scoring is additive and based on the final landscape.
- User-provided `HC_RULES_TH_compressed.pdf`, matching [publisher Thai Crescendo rules](https://cdn.svc.asmodee.net/production-libelludv2/uploads/2026/08/HC_RULES_TH_compressed.pdf), pages 10–12: Whispers setup, coexistence, completion and scoring.
- [User-provided unboxing](https://www.youtube.com/watch?v=_3z2v0y2pmU), 01:08–01:25: the remaining Whisper faces and two-token forms. Read printed stack height as well as colors; a single ground red token differs from a completed two-token building.
- [Publisher Crescendo press kit](https://cdn.svc.asmodee.net/production-libelludv2/uploads/2026/08/EN.zip), `03_CONTENT/_CARDS/HC-CARDS`: first five Whisper habitats, used to cross-check the video. Published art is reference material only, not shipped.
- Spirit patterns: same printed-face/secondary-transcription cross-check as the base catalog (cards 33–42). Scoring values follow the current rulebook, especially the crane's **6 points** per connected group of at least two completed buildings.

Two-cell patterns can use any of six rotations. Offsets use the first cell as origin and an adjacent second cell; reflections of a two-cell layout do not add distinct matches. Names below are descriptive Thai UI names, not official card titles.

| ID | Cube destination | Adjacent stack | Physical tokens | Reference |
|---|---|---|---:|---|
| whisper-01 | rock ×1 | wood + leaf | 3 | press face / video |
| whisper-02 | completed building ×2 | leaf ×1 | 3 | press face / video |
| whisper-03 | field ×1 | wood ×1 | 2 | press face / video |
| whisper-04 | water ×1 | wood ×1 | 2 | press face / video |
| whisper-05 | wood + leaf | water ×1 | 3 | press face / video |
| whisper-06 | field ×1 | red ground token ×1 | 2 | video 01:08 |
| whisper-07 | completed building ×2 | wood ×1 | 3 | video 01:10 |
| whisper-08 | rock ×1 | water ×1 | 2 | video 01:12 |
| whisper-09 | leaf ×1 | rock ×1 | 2 | video 01:13 |
| whisper-10 | water ×1 | field ×1 | 2 | video 01:14 |

A completed building accepts a red, wood or rock base, just as in the base game. Whisper 06 explicitly requires one red ground token, not the building shorthand used in the old animal catalog. The matcher and diagram renderer distinguish both.

## Rules and state

Nature’s Spirits: deal two hidden cards per player. Every player's own private projection exposes their pair immediately at setup. Players choose independently and concurrently; normal turn actions wait until all pairs have been resolved. Choose one and remove the other; the selected card becomes public. This setup timing follows the user's requested online flow. One white cube; card occupies an incomplete slot until placed. Its bonus remains zero until activated, then is recomputed from the final landscape, including isolated mountains where specified. Group-based bonuses include isolated cells only where the card says so. During setup the shared-table manager can resolve pending players in roster order; after setup it receives the active controller projection. A public display never receives unchosen pairs. Each live-match draft action carries a match-bound epoch: different players may confirm from the same revision, while actor ownership, offered-card membership, duplicate receipts and match identity remain validated. Existing stored drafts remain valid and resume in the setup flow without resetting play state.

Whispers: shuffle ten cards into the normal deck. Claiming an Animal or a Whisper uses the same once-per-turn claim. Each Whisper has two purple cubes and occupies one of four incomplete slots until both are placed. Store `Cell.whisper` separately from `Cell.cube`; a cell holds at most one of each. Coexistence is legal in either order, also with a Spirit. Any cube blocks additional terrain. A Whisper cube scores 2 alone or 5 alongside an Animal/Spirit; scoring updates when its companion arrives. `points.length` defines its two cube slots, but `[2,5]` is not a cumulative animal score track; the UI labels both slots `2/5` and explains per-cube scoring.

Animal tie-break count includes ordinary Animal cubes, not Spirit or Whisper cubes. This follows the base rule's distinction between the cube types; it is recorded here rather than silently folding extra cube types into the tie-break.

Solo: three terrain triples and three visible cards. At turn end remove all six unused public tokens from play, then refill all three groups. Retain discarded identities for conservation and persistence; never return them to the bag. If no card was claimed, optionally discard and replace one public card at end of the turn; after that only ending the turn is legal. End if the board has at most two empty cells or the bag cannot supply nine refill tokens. Score Suns from the base thresholds plus A/B and Spirit adjustment. Crescendo does not provide an additional published Whisper Sun adjustment; the same base chart is used, so scores with different modules are not equivalent challenges.

Separate inventories account for all 120 terrain identities, 32 ordinary Animal cards, the optional ten Whispers, all ten base Spirits plus the optional T-rex (drafts/selected/discarded/unused), and every placed cube. Recovery rejects duplicate/lost cards or tokens and inconsistent progress. Legacy base snapshots need none of the optional fields. Storage accepts the known base `libellud-base-2024-A-B-v1` / schema 1 predecessor, validates its full state, and upgrades room metadata to the current rules version without changing game state, identities or revision. Unknown version mismatches remain quarantined.

## Artwork

Original generated illustrations, with code-rendered habitat diagrams, cubes and score tracks. No video/PDF/press illustrations are runtime assets. Full/small WebP files share the existing card geometry. Source prompts and generated paths are preserved in `spirits-art-jobs.json` and `whispers-art-jobs.json`. Five original Whisper scene illustrations each cover two mechanically different cards; the printed pattern is always rendered separately and authoritatively from the catalog.

### Spirit presentation update (2026-10-19)

All ten Spirits now have original translucent crystal figurines with distinct colors and a small glow, replacing the white cube representation on boards, trays and habitat examples. Draft and confirmation views use complete portrait cards. Persistent gold (Spirit) / violet (Whisper) star seals identify special cards in the owned collection; one-shot shimmer animation and sound follow accepted acquisition/activation events. Sound respects existing mute/volume settings and never repeats on reconnect; reduced motion keeps the static seals. Art sources and extraction manifest: `spirit-figurine-art-jobs.json`. Rules are unchanged.
