# Harmonies presentation and interaction

Warm oak/parchment (#f5e8bf/#e4d5ac), deep river teal (#236b72), moss (#82a342), rose buildings (#d34d65) and amber animal cubes. Bundled Noto Sans Thai supports player copy, numbers remain tabular. Original textured gouache wildlife art supplies the focal detail; surrounding controls stay compact and practical.

The app uses TypeScript and native DOM, not React/WebGL. A CSS3D hex scene provides actual cylindrical token surfaces (sixteen low-poly side facets and a circular cap), ordered layer heights and six-face translucent cubes. Token/cube geometry is code and shows each server stack. No new rendering dependency or physics. Shared CSS geometry keeps the scene small; no per-frame JS render loop. A-side/B-side generated mat textures are quiet decoration, not rule input.

HTML hit controls are separate from decorative surfaces; button labels expose complete bottom-to-top stacks and animal ownership. Some browsers retarget projected edge-hex clicks to the parent plane, so the parent resolves the nearest projected HTML cell only within a bounded hit radius. This selects a preview, never a committed placement. An explicit numbered HTML select supplies an alternative without 3D hit testing. Server legal intents remain decisive.

Mobile: compact public supply and animal row, tabs, bounded camera controls, current hand/actions, own board, animal progress. Select token → tap hex or choose its number → inspect ghost/height or illegal reason → confirm. Camera modes: tilted3D, overhead, flat2D. Rotation−25..25degrees, zoom0.85..1.2, reset explicit. No drag-release placement, physics, auto-scroll or per-revision camera resets. Gesture-free camera buttons are deliberate for touch precision. Opponent boards remain available via tabs; the shared screen shows all2–4and supports explicit expansion/overview.

Animal cards: generated artwork, coded SVG pattern with exact stacks/cube cell, printed score progression, and remaining/settled cube progress. Details use a native modal with close button, focus handling and scroll lock. Owned-card buttons explicitly highlight existing animals or server-validated candidate matches. Multiple matches require an origin/rotation choice; no strategic match is silently chosen. Pending optional actions can be interleaved with terrain placements, including before choosing a group.

Stable keyed DOM retains images, board controls, scroll anchors and camera across state/ACK/presence updates. Waiting-turn tint is separate from the command lock, avoiding transient supply flashes. Accepted sequence events drive short pickup/card/placement/cube/turn motions; snapshots and reduced motion skip replay. Existing independent BGM/SFX controls are reused. Wood/cube cues are original WebAudio synthesis; cheerful plucked nature music defaults off and follows normal browser gesture restrictions.

Results count authoritative scores, expose terrain and per-animal breakdown, winner/seat identifiers and cube tie-break counts. Skip/OK affects presentation only. Closing the modal retains score table and full boards; manager restart resets all components with original room and identities. No automatic reset.

All38illustrations are real optimized local WebP files:32separate animals, cover, card back, two board textures, table and result image. Manifest records each source output and prompt/status. No original publisher/BGA artwork is shipped, and diagrams never come from generated text/patterns. Thumbnail contact sheet is retained in ignored `data/qa-harmonies/` for review.

## Supply and habitat readability — 2026-10-15

Player-board tabs now precede the supply. All camera controls appear after the boards/results and before the rules at the bottom. The numbered HTML select is removed by request; accessible hex buttons and bounded projected-cell hit resolution remain, with server validation unchanged.

Each of the five supply groups shows only its three tokens, arranged one above two. The accessible group label still identifies the group and terrain types. Animal cards stretch within their row and keep equal-height claim buttons at the bottom. Habitat diagrams reuse the exact SVG terrain marks printed on supply tokens; separated stepped circles expose every layer's icon. Building bases show a neutral question mark instead of prescribing one of the permitted base materials. Detailed card text continues to explain valid bases. No game rules, randomness or public/private projections change.

## Board placement and animal dealing — 2026-10-15

Supersedes camera selectors: all landscapes use fixed tilted 3D (32 degrees, -5-degree orientation, scale 1). Player board frames include terrain/animal mode buttons and a local preview/confirm area outside the transformed plane. Terrain is selected from the hand, then a hex is tapped and confirmed in its board frame. Animal mode highlights all legal cube destinations; tapping a destination selects its unique match or presents explicit animal/orientation choices within the board frame. No strategic match is silently selected among multiple candidates. Existing per-card match entry remains as a shortcut. Shared displays retain their read-only role; player identity and legal actions remain authoritative server projections.

Details show the full 360×520 animal illustration instead of a cropped landscape window. Final summary winners use an explicit SVG crown; retained-board summary/restart actions are centered with a 16px gap.

Market positions remain stable in each connected client: taking an animal leaves a card-back placeholder, and the next authoritative end-turn refill occupies that position. Incoming cards animate from the visible deck marker to their slots. No future deck faces are exposed and refill timing remains the official end of turn. Reconnect rebuilds positions from the current public market; snapshots and reduced motion skip flights. Board action space is retained while waiting to avoid turn-related height changes.

## Terrain header, tile confirmation and animal figurines — 2026-10-15

Habitat diagrams again show compact isometric stacks, placed at the pattern's axial neighbor positions, with Thai terrain names and heights under each stack. The top terrain retains its supply icon. Building bases remain neutral because red/wood/rock bases are all legal; the animal destination is marked separately. Geometry never changes the pattern facts.

The separate current-turn action panel is removed. The active player's remaining terrain appears as selectable circular tokens before the score in the board header (read-only on shared displays and for other players). A legal terrain preview adds a 44px-minimum confirmation button directly on that tile, independent of its hit button and above the decorative stack. Animal confirmation stays in the board frame. A larger end-turn button is at the right edge of the same frame and still follows server legality.

Placed animal cubes are represented by original solid low-poly figurines for all 32 species, built from small CSS3D body/head/limb/ear/wing/tail parts, each with six shaded faces. `harmonies-animals.ts` defines the species palette and anatomy. They stand at the authoritative terrain height; translucent models preview animal placement. These are code-native volumetric figurines, with no external models, renderer dependency, generated raster substitutes or game-state changes. Cell labels and inspection retain the animal/card identity.

SFX: local selection cues for card inspection, hand selection, board mode, pattern choice and terrain previews; accepted group pickup uses the wooden cue, terrain confirmation the placement chime, card acquisition the card cue, animal placement its distinct cue, turn/finish their existing cues. Actual end-turn market refill adds one paper-deal sound per incoming card. Snapshot, duplicate and gap suppression remain, and independent BGM/SFX preferences are preserved.

## Larger card habitats and randomized rematch side — 2026-10-15

Card habitat patterns now use larger isometric cylinders with shaded side walls and layered caps, drawn back-to-front at the existing axial neighbor positions. Animal destination markers have three visible cube faces, as on the physical-card reference. Visible terrain-name/height captions are removed; accessible stack descriptions remain. Thumbnail habitat windows grow to 108px, and the score track uses smaller type and non-wrapping compact badges so up to five values fit on one row. Full portrait detail art and board animal models remain.

“ดูสัตว์ในสวน” is disabled when that player's board has no animal matching the card ID; merely holding an animal card does not enable it. Placed animals enable inspection/highlighting for that card.

Initial lobby setup retains the explicit common A/B selection (A default). The rematch button now omits a fixed side; an authorized server restart samples A/B afresh with equal probability before creating the next game. A repeat side is a valid random outcome. Explicit API board-side selection remains available to an authorized manager. This is a web rematch preference, not an official rule: the publisher says players collectively choose the same side, recommends A for early games, and does not determine personal-board side by player count. Duplicate command receipts never reroll the board.

## Animal tile confirmation and model markers — 2026-10-16

Both terrain and animal placement confirmations now appear directly on the destination tile. The animal button appears only after a unique legal pattern is selected (automatically only when exactly one match exists, otherwise after explicit animal/orientation choice). There is no second confirmation in the board footer. The same authenticated server action validates the selected origin/rotation.

Animal-card habitat markers use an orthographic projection of the exact solid animal geometry used on the landscape, replacing yellow cubes. `harmonies-animals.ts` shares body parts between CSS3D board models and cached SVG face projections, with visible faces depth-sorted and shaded. Card rendering requires no extra image files or SVG foreignObject/3D compatibility assumptions. The existing neutral terrain base, habitat axial positions and accessible stack descriptions remain. White perimeter strokes are removed from diagram token caps; side-wall shading distinguishes each real layer.

## Tile-style terrain in cards — 2026-10-16

Supersedes projected animal markers and the SVG cylinder approximation in habitat cards. Card diagrams now reuse the exact CSS3D `cylinder` renderer used by board tiles: sixteen side facets, round cap, and a 12-unit vertical step between physical layers. A small card scene scales the full geometry with container units and uses the same 32-degree tilt/-5-degree orientation as the board. Side facets overlap slightly to avoid seams at thumbnail sizes; white perimeter borders remain absent. The building-base illustration remains neutral and unmarked because multiple base materials are legal.

A six-face yellow cube again marks the animal's exact destination on each card, grounded on the top layer. Animal figurines on player boards and direct tile confirmation remain. Axial pattern positions and stack heights still come only from the card catalog. Details retain full portrait artwork and expand the same 3D habitat scene, with no new dependencies or images.

## Same-color seams and available-animal tray — 2026-10-16

An upper token whose terrain matches the token immediately below gains a thin dark base seam. This applies to board stacks, terrain previews and habitat-card stacks through the shared cylinder renderer; mixed-color neighbors do not gain this seam. Side-wall sizing keeps layer heights and contact geometry unchanged.

The player board footer automatically shows a horizontally scrollable tray between cancel and end turn whenever the server supplies legal animal habitats. Each card appears once as its existing solid 3D figurine, with a short Thai name and xN badge when more than one animal can currently be placed. N is the smaller of distinct legal destination cells and remaining animal spaces on that card, not the number of rotation/origin matches. The tray derives from all legal habitats even while another animal or terrain is selected. It updates after every accepted action and disappears for unavailable/completed animals or off-turn players.

Clicking a tray animal filters and highlights its legal destinations without committing a move; the player still chooses a tile and resolves any orientation ambiguity before confirming there. Existing per-card match shortcuts remain optional. Models in the tray have their own presentation class, so inspection/highlighting and placed-model counts remain scoped to actual board animals. Selection uses the existing local SFX cue. Footer space is reserved to avoid height changes as availability appears or disappears.

## Animal inspection spotlight and card dialog — 2026-10-16

Garden inspection darkens the map, all hex surfaces, terrain and nonmatching animal faces across the displayed boards. Only placed animal models matching the selected card retain their original colors. Individual surface colors are mixed with a dark tint; no parent filter/opacity flattens the 3D scene. Inspection toggles off via the same card button and clears when starting a terrain/animal placement selection. Cards without a matching placed animal remain disabled.

The native card-detail dialog has a stationary header/close button and a separately scrollable content region. A pointer gesture beginning and ending outside its bounds dismisses it; clicks inside and scroll drags do not. Native Escape/focus handling and modal scroll locking remain. Completed cards display the shorter “สำเร็จ”.

## Approved forest-reference redesign — 2026-10-16 (supersedes earlier presentation)

The attached reference now controls the visual composition: emerald forest and turquoise river, warm sand hex island, bright wooden cylinders, full-bleed animal art, vertical right-hand score/cube tracks, small habitat stacks over the artwork and an ivory bottom action tray. Opaque board animal figurines are replaced by six-face translucent amber cubes, as requested in this newer brief. Terrain, stack layers, legal habitats, cube heights and score progress continue to derive from the unchanged engine/catalog; mockup numbers and token positions are never imported.

All32animals have new original generated images, with a quiet lower28%/right edge, plus forest-river, sand, cardback and cover. The active36master inventory (with32small rail derivatives) is in `reference-redesign/asset-manifest.json`; previous art is retained as fallback. Exact source prompts/paths/hashes are recorded. `scripts/harmonies-reference-art.mjs` regenerates optimized derivatives/manifest from the generated master paths. Native `harmonies-presentation.ts` supplies the code-only cylinders, six-face cubes, catalog-based axial pattern projection and card face. No generated image contains rules, labels, scores or habitat pieces.

Harmonies previously had no two-mode selector; it now reuses the common Critter Kitchen/Locus DisplayMode preference helper. Full-mobile shows all public markets and owns all actions; shared-table replaces terrain faces with matching numbered group controls and omits the repeated large animal market on phones. Owned cards and current-turn pieces remain visible. Modes are device-only and keep selection, habitat choice and camera; they do not modify projections or engine state. Camera defaults to36-degree tilt, with top/reset buttons in the compact board/view menu. Board side A/B also lives in that menu. No automatic scrolling is introduced.

The renderer and scoped stylesheet lazy-load only in Harmonies gameplay; no WebGL, GPU frame loop, physics or new dependency. CSS3D has the existing flat fallback, finite shared geometry and reduced-motion handling. Device resize uses CSS container units. The keyed patch retains the landscape/controls; the fixed action tray has page space reserved and both it and the tile confirmation commit the same server-validated intent. Cards and miniatures keep variable two/three/four-cell patterns and building's neutral legal base, with no extra rule labels on the normal card. Detail dialog adds the exact bottom-to-top material descriptions. Existing inspection spotlight, explicit multi-match choice, read-only shared display, snapshot-safe events, music-off default and common sound settings remain.

## Compact A/B reference — 17 October 2026 (supersedes preceding layout)
Use the user's latest two-panel reference: compact Georgia Harmonies title / Noto Sans Thai copy, yellow turn chip, round audio/menu, five terrain pyramids, four-and-a-peek animal market before the continuous sandy landscape, four active owned cards in one row, compact hand/instruction/end-turn tray. Do not publish running score totals in the UI. All printed card scores, exact habitat coordinates, terrain heights and occupancy remain from the catalog. Completed cards remain reachable in an expandable rail.

Board animals are original code-native voxel figurines from the 32-species catalog, keyed by the original cube/card placements. Habitat diagrams continue to use amber cubes as readable destination markers. Shared terrain palette: water #008eb9, rock #7c817d, wood #995023, leaf #458b21, field #edba13, building #ce503d. The 16-facet cylinder radius follows the actual board container, including short viewports. The new generated riverbank-clearing environment joins the existing 36 generated assets; no UI or rule state is baked into artwork.

Only the active owner's selected preview produces a fixed HTML confirmation popover, anchored to the projected selected tile, clamped/flipped with visual viewport and safe-area bounds. Resizing, scrolling and changing cameras recompute position. The open view menu layers above the preview; the bottom tray never duplicates confirmation. End-turn appears only if the server's legal actions allow it and no preview remains; optional animal/card actions remain available. Both submit buttons guard repeat taps until the authoritative render arrives.

## Horizontal supply / board-side hand — 17 October 2026
The latest user revision replaces the pyramids with three horizontally overlapping disks per supply group. The bottom action tray is removed. Picked tokens run vertically on the right of the board, with their diameter calculated from the same board width, 23% hex width and 16% stack inset as the actual cylinders. Legal end-turn is below them at bottom-right; confirmation remains a private cell-anchored popover and is clamped away from this sidebar.

Owned cards now use the same horizontally scrollable market-style rail, including all completed cards; the engine's four unfinished-card rule is unchanged. The owned heading is above the board's stacking context. Thumbnail animal names and decorative undealt deck backs are removed; species names remain accessible in button labels and the expanded detail header. The remaining deck count is in the menu. Claim buttons occupy a dedicated row underneath card artwork, and claimed slots preserve market position without pretending to be face-down cards. The recovered vertical space increases the landscape area.

## Lightweight markers / compact waiting hand — 17 October 2026
User reported animal-model lag. Runtime board placements and private previews now use the original six-face amber cubes; the renderer no longer imports the voxel species catalog. Animal-placement shortcuts use existing small card thumbnails, not 3D figurines. Card diagrams, placement IDs, scoring and state remain unchanged.

Right-side hand frames are fixed at 42×38px, with 26px disks kept inside their content area. Waiting players see three empty dashed frames rather than the active opponent's hand. An active hand that has been fully placed releases its frame space. Available animals form larger 60×44px scrollable buttons directly below the hand, with a “วาง” label and counts. Legal end-turn remains at bottom-right only when no terrain/animal preview is pending; optional animal actions remain optional. Score digits use centered flex boxes in both thumbnail and expanded score tracks.

## Matching cards / add icon / green progress — 17 October 2026
Market and owned cards share explicit card dimensions at each viewport size. Market headings match owned-heading typography and color, and the decorative horizontal-scroll arrow is removed. The market claim control is a green circular white-plus button over the top-right corner, with the full animal name retained in its accessible label; its score track fits beneath the button.

Owned cards show a separate green progress tube beneath the artwork. Fill and text are the server-confirmed placed count divided by that animal card's catalog capacity, rather than a hard-coded four. Completed cards remain in the same scrollable rail. The old “ดูสัตว์/จุดวาง” buttons are removed; all legal animal placement still starts from the larger right-hand shortcuts, and tapping card artwork still opens its details. No rule, score or permission change.

## Waiting-turn cue / header settings / default audio — 17 October 2026
Waiting player phones dim the public terrain-supply group buttons; the neutral shared display keeps the supply vivid. The visible top turn chip is hidden for Harmonies. Server turn validation and screen-reader status remain intact.

Hamburger and audio controls are both 36px circles, aligned to the header on phones and centered desktop layouts. Settings are organized into an ivory popover with a room/join block, QR, device mode, camera and player-board controls, a close button and a scrollable short-screen body. Both header popovers close on outside pointer or Escape, with mute/volume preferences unchanged by dismissal. Clicking between header controls closes the previous popover.

With no saved audio preference, Harmonies defaults music on along with the existing default-on effects. Explicit saved mute choices are retained across reloads; other games retain their existing background-music defaults. Starting a game attempts audio activation, and browser gesture restrictions still apply. Music remains inactive in the lobby/hidden document as before.

## Cube shortcuts / persistent hand / matching score rails — 17 October 2026
Animal placement shortcuts now contain only a lightweight three-face amber cube, with xN for multiple legal placements. Species names remain in accessible labels; artwork thumbnails and visible names are removed. The right-hand terrain tray keeps all three frames while playing, including after the hand empties and while waiting after ending a turn.

Market score tracks now use the same centered, vertical icon/number cells as owned cards, positioned at the top-right. The green add control sits immediately to their left so it does not cover the scores. This supersedes the compact horizontal market score rows and the empty-hand hiding behavior described earlier. Rules, catalog values, permissions and server state are unchanged.

## Heading, progress fill and header scroll polish — 17 October 2026
Market and owned animal headings explicitly use no text shadow. Progress fill has square corners; clipping by the rounded outer tube provides the only rounded ends, including when complete. Audio and hamburger controls share the same viewport-fixed top edge, safe-area inset and desktop container offset, so scrolling cannot separate their vertical positions. Existing outside-click/Escape dismissal and audio preferences remain intact.

## Equal animal shortcut frames / add above score / rendering cost — 17 October 2026
Animal shortcut frames are 42×38px, matching the three terrain frames, with a proportionate 26×29px amber cube. Market add controls are again at the top-right, above the score rail. The rail reserves the button's height; its icons adapt to available row height while point values stay centered and readable, including cards with five score steps.

Unchanged card artwork and habitat diagrams use the existing DOM patcher's preserve-content boundary; habitat markup is cached per catalog card. Board stack geometry has a content-derived key that includes stack contents, committed cube and preview token/animal, preserving it during selection changes and replacing it when those visuals change. Cylinder side markup is built once. No new dependencies or global DOM patcher changes. Popover repositioning from scroll/resize is coalesced to one animation frame and pending frames are cancelled on rerender/cleanup. Board tilt, sixteen terrain facets, stack seams, server actions and scoring remain unchanged.

## Tile checkmarks and quiet scrolling — 17 October 2026
The extra riverbank-clearing/masked backdrop beneath each board is removed. The original fixed page background remains; each tile uses one sand-texture layer rather than a second textured pseudo-element. Removed hover filters, backdrop blur and blurred token highlights; disabled CSS transitions/animations in the Harmonies UI. Incoming market cards retain a short 140ms opacity fade, replacing long position/scale/rotation travel and per-token/cube reveal effects.

Placement confirmation is now an accessible green checkmark button inside the selected hex for both terrain and animals. The existing server-validated preview and single-submit guard remain. Tap the selected hex outside the checkmark again, choose another tile/token, or press Escape to cancel/change a preview. All viewport popover markup, positioning calculations and scroll/resize listeners are removed. Invalid placements continue to show their reason in the board status. Multiple valid habitat orientations retain the existing explicit selection.

The empty supply group label is centered in both axes for every viewer. Market plus buttons straddle the upper-right edge of cards, with 10px of rail padding to avoid clipping; score rails start 3px lower. This supersedes the in-card add control and confirmation popover layout described earlier.

## Thumbnail-only rails and on-demand details — 17 October 2026
Market and owned card rails use 240px WebP thumbnails directly, without a srcset that can select a 720px image on high-density phones. Thumbnails retain lazy loading and asynchronous decoding. Opening the card detail creates an eager 720px image; the independent detail dialog does not replace the preserved rail artwork with a large image.

The 32 thumbnail assets are regenerated at WebP quality 76, totaling 728,524 bytes, compared with 5,896,710 bytes for the unchanged masters (about 88% less). Previous 360px thumbnails totaled 1,799,066 bytes. The asset optimizer now reproduces the 240px thumbnails. Native habitat/score overlays remain separate from the artwork. Existing error fallback is retained for missing/broken images.

## Hex joints and one sidebar column — 17 October 2026
Hex surfaces and their shallow edge walls are inset2px on each side, leaving a narrow joint while retaining the existing cell centers, stack positions and server adjacency. Board surfaces are now smooth ivory with no wood/sand texture; valid placements remain pale cream, and selected/habitat cells keep a teal highlight.

Available-animal frames are centered within the same sidebar column as the three terrain slots, with matching42×38px bounds,2px borders and10px corners. Their scroll container preserves that alignment and uses the same3px vertical spacing.

## Thick boards and a separate landscape display - 17 October 2026
Board edges use the existing shallow side plane with a 10px downward/7px depth offset and a sand-colored edge gradient; the phone board grows slightly. No extra facets or heavy model assets are introduced. Shared displays use a separate responsive composition: supply/animal market across the top, then two player gardens side by side at 800px+, each with a named header, thick board and visible owned animals. Three/four players occupy additional rows. Owned animal cards wrap into four to six columns as their count grows, rather than being hidden or confined to an offscreen horizontal rail. Portrait display views stack these panels. Board height is constrained so its lower edge stays above owned-card headings.

The previous device-only mode selector is replaced by the manager-only room mode described in architecture.md. Read-only is the default. Shared mode gives the authenticated creator display the current player's standard tile/animal controls; phone controls remain fully usable. The display retains every garden rather than becoming a phone layout or claiming a player seat. Visitors opening the public display URL remain read-only. Server state, legal actions and revision checks govern both input surfaces.

## Forest score plaques and larger habitat examples - 17 October 2026
Score tracks now use a dark emerald, double-gold pointed plaque frame and floral/paw seals. Earned seals contain the existing completion check; catalog point values and row order are unchanged. Decorative SVGs are lightweight native geometry with preserved static descendants, without raster artwork or animation.

Score digits use a renamed digit-only WOFF2 subset, Harmonies Score, derived from Averia Serif Libre Bold (Google Fonts), selected for the rounded storybook shapes in the reference. The subset is 1,868 bytes, self-hosted and limited to digits; the OFL license and source credit are distributed alongside it. This approximates the reference lettering rather than identifying an exact font from a raster image.

Habitat diagrams have a larger scale/height allowance on compact cards and enlarged details. Their drawing region leaves the right score rail clear. Exact axial cells, stack heights, cube destinations, 16-sided cylinders and earned counts are retained; the small240px versus detail720px image policy stays unchanged.

The enlarged detail scene also reserves a lower margin so projected hex bases remain inside the card artwork. Compact and enlarged views retain separate scale settings; short compact cards prioritize readable point values while the detail view has full-size ornamental seals.

## Completed cards, consistent dynamic plaques and readable tile interactions - 17 October 2026
Owned card rendering uses a stable partition: unfinished cards in original order, then completed cards. Completed cards carry a gray artwork treatment, gray progress fill and a visible completion ribbon; inspect/details still works, while server legality continues to prevent further placements. The rail does not anchor horizontal scrolling to reordered cards.

Market and owned score plaques now share one bottom anchor, step height and count-driven height; only the add control and external progress bar differ. Two through five steps produce different plaque heights. Detail plaques are count-driven too.

Confirmation buttons counter-rotate the board tilt, remain circular, and size themselves below the token diameter. Their center is aligned with the selected stack; existing server validation, privacy, cancel and duplicate-submit protections are unchanged. Cylinders shift backward2px per level (proportionate em offset in card examples); cube centers follow their top layer. Multi-layer stacks display a small count badge. Selected/habitat, hover and keyboard rings trace the actual hex silhouette with an SVG polygon instead of an inset rectangular shadow.

The original Minecraft-style animal model uses36-90 six-face-renderer surfaces per animal versus6 for the amber cube. As the user's replacement was conditional on no extra resource cost, the cube remains. This is a geometry comparison, not a measured physical-phone FPS or resource multiplier.

## Lightweight animal figurines and stable result scrolling — 17 October 2026
Replaced board/placement-preview amber cubes and right-side animal choices with transparent144×168 WebP figurines baked from the existing voxel geometry (32 species). Each animal uses one image instead of dozens of CSS3D faces; no runtime animal geometry import. Reproduce assets with `npx tsx scripts/harmonies-figurines.mts`. Card habitat destination markers remain amber to keep the patterns readable. Camera-facing sprites stand at the authoritative stack height, retain inspection dimming and private preview behavior.

Replaced dynamic viewport height units in Harmonies CSS with stable small-viewport units, including board/card geometry and result dialog limits, so mobile browser-toolbar expansion does not continuously rescale the scene while scrolling. Rotation/window resizing still adapts the layout. Finished gardens keep the same three empty token frames on phones and shared displays; no stale controls or waiting instruction after completion.

## Figurine contact, market containment and fixed forest — 17 October 2026
Baked all32 figurines facing down-right (135-degree model heading), trimmed transparent image margins, reduced board sprite width to22–34px with a48px height ceiling, and anchored their feet at the uppermost cap plane (12×stack height+1px) instead of9px above it. Still one image per animal, no runtime model faces. Market panels now reserve heading, add-button clearance, full card height and bottom padding consistently on phones and shared displays. Updated matching grid rows to prevent card overflow.

Moved the forest image from root fixed-attachment painting to one fixed pseudo-element with stable100lvh height, independent of document scrolling and mobile toolbar expansion. No blur, animations, filters or additional repeating geometry.

## Face-forward down-right animals and angled card cubes — 17 October 2026
Rebaked figurines with150-degree heading/30-degree projection tilt so their eyes, snouts and beaks visibly face down-right rather than up-right. Kept trimmed single-image rendering, small dimensions and cap contact; updated the sprite URL revision so previously loaded artwork is refreshed. Habitat destination cubes rotate32 degrees on their terrain plane with distinct top/side shading, shared by market, owned and enlarged cards. No added geometry or gameplay changes.

Build and Docker rebuild passed;5555 health ok with existing volume. Dense fixture passed three phone sizes, contact/containment/private placement and inspection checks. Actual Docker all32-card test passed exact patterns/scores and enlarged-example containment extended to all cube faces. Inspected compact board/tray and enlarged card screenshots: down-right faces and three visible cube faces. Logs /tmp/hm-facing-dense.log, /tmp/hm-facing-cards.log, /tmp/hm-facing-docker.log. No main push or Vercel deployment.

## Animal markers in expanded cards — 17 October 2026
Expanded animal cards now show their own baked animal figurine at the exact habitat destination instead of the yellow cube. Compact market/owned cards retain their tilted cubes. Habitat markup caches distinguish compact/detail markers; the sprite counter-rotates the habitat plane and rests at the top cap. Preserve-3D on the single-image wrapper prevents the token cap from occluding it; no model faces are added.

Build, presentation unit test and Docker rebuild passed;5555 health ok with existing volume. Dense browser fixture passed, and actual Docker all32-card test passed compact patterns/cubes plus enlarged figurine presence, image decoding and bounds containment. Inspected the refreshed crocodile detail screenshot and example pair. Logs /tmp/hm-detail-model-unit.log, /tmp/hm-detail-model-dense.log, /tmp/hm-detail-model-cards.log and /tmp/hm-detail-model-docker.log. No main push or Vercel deployment.

## Centered animals, straight board and empty collection — 17 October 2026
Moved board figurines8px forward along the terrain plane and detail-card figurines7em forward, retaining their cap height so their bodies sit closer to the center without sinking through the token. The board sprite wrapper now preserves the single image's3D transform, preventing cap occlusion. Set board Z rotation to0 while retaining36-degree perspective tilt and stacked terrain depth; camera controls and tile confirmation still work.

Empty owned-card rails now show a centered card/paw icon with “ยังไม่มีการ์ดสัตว์” directly beneath it, instead of an instructional paragraph. Collection dimensions are retained to avoid layout changes when the first card arrives. No rules or network changes.

## Earned-score emphasis, persistent end turn and deliberate garden reveal — 17 October 2026
Owned animal cards now emphasize the current earned milestone with a green filled score, strong pale border and checked seal; passed milestones are softer and unreached scores are dimmed. The current tier is exposed in title/accessible copy. Detail cards share the current-score highlight.

End-turn stays in the board sidebar throughout play, including waiting turns. It is disabled until the server legal actions permit ending and any placement preview is resolved; pending requests also disable it. The click handler checks readiness before sending. Finished boards retain empty token slots as before.

Replaced automatic result counting with a local per-viewer reveal. A one-shot leaf intro waits for “เปิดสวนเพื่อดูผล”; no totals/winners are rendered in the result dialog, retained result table or board headers yet. Opening a garden reveals each placed animal one at a time with its incremental card points (cumulative tier difference), then shows that player's terrain scores. The viewer explicitly advances to the next player's garden and finally opens totals/crowns. Server scoring/room state is unchanged; other clients wait for their own input. Reduced motion reveals a garden's animals immediately while keeping the player/final progression manual. Dialog close/unmount cancels timers; reopening can replay an unfinished reveal or show an already completed summary. Modal scrolling uses stable viewport limits, and the animation is scoped to newly revealed items.

## Expanded animal card fit and readability — 17 October 2026
Detail close controls are explicit44px circles with28px SVG crosses, kept in the non-scrolling header. Detail habitat bases are smaller ivory hexes with clear joints, matching the board spacing direction while preserving all axial positions and stack facts. Requirements now occupy equal columns by pattern cell count, with each layer on its own line and a separate animal-placement label.

The full uncropped card scales to the stable viewport height, reserving room for the header, short rule note and column legend. Detail score plaques are wider (44–64px), and digit boxes use available width with a bounded font so two-digit scores fit, including earned-border styling. Overflow remains available as a fallback for unusually enlarged text.

Build, presentation unit test and Docker rebuild passed; localhost5555 health ok with existing volume. Dense browser fixture passed no inner scroll at390×844,390×620 and320×568, circular close geometry/28px cross, equal column alignment, two-digit score fit and unchanged outside-dismiss/placement flows. Actual Docker all32-card check passed with enlarged examples, figurine/base containment and score digits inside their boxes. Inspected refreshed full-card screenshot. Logs /tmp/hm-modal-fit-build.log, /tmp/hm-modal-fit-unit.log, /tmp/hm-modal-fit-dense.log, /tmp/hm-modal-fit-cards.log, /tmp/hm-modal-fit-docker.log. No main push or Vercel deployment.

## Confirm pickups, matching rails/slots and habitat tile edges — 17 October 2026
Supply-group pickup and animal-card acquisition now open a modal showing the chosen tokens/card, with explicit cancel/confirm actions. No command is sent until confirmation. Cancel receives initial focus; Escape/outside dismissal cancels. A settled guard prevents repeated confirmation, and any changed room revision/control availability closes and invalidates an outdated choice. Room switch/unmount removes it. Server legality/identity remain authoritative; no protocol/rule changes.

Market and owned rails now share the same effective leading inset and scroll padding, including owned collections longer than four cards. Terrain and available-animal controls share42×38px frames, identical border/radius/background, aligned44px tracks and3px gaps. Empty terrain frames retain dashed borders. Compact and detail habitat bases now use the same modest ivory hex gap with one shallow shaded edge pseudo-element per cell; cylinder walls remain disabled, with no blurred shadows.

Verification: build, presentation unit and Docker rebuild passed;5555 health ok with existing volume. Browser4/4 passed: full2A113 actions, group cancel/card Escape without revision changes, repeated confirm applied once, normal scoring/reconnect/reveal/rematch; dense mobile/tablet checks match rail leading insets (owned5 cards), equal token/animal frame size and alignment, private previews and modal fit; all32-card/large-example geometry/artwork checks; shared display/phone flow including a pending phone choice invalidated when the host confirmed on the same turn. Reviewed confirmation and compact-card screenshots. Synthetic Chromium DPR3 scroll repeated1x/4x CPU: median16.7ms/p9516.7–16.8ms, one33.3ms interval in the first1x sample and none >25ms in repeats/4x;372 drawing layers versus previous322, no state updates/DOM mutations/long tasks during samples. Not a physical-phone guarantee. Logs /tmp/hm-confirm-pick-build.log, /tmp/hm-confirm-pick-unit.log, /tmp/hm-confirm-pick-browser.log, /tmp/hm-confirm-pick-scroll.log and /tmp/hm-confirm-pick-docker.log. No main push or Vercel deployment.

## Habitat stack counts, picked-group fill and result skip — 17 October 2026
Compact and expanded habitat diagrams now label every multi-layer stack with×2/×3 and an accessible height description; building patterns count their neutral foundation as part of the two-layer height. Labels use a counter-rotated plane and minimum8px compact text, without adding terrain wall faces. Picked supply groups use a light-green filled background and transparent border instead of the selection outline; keyboard focus remains available on enabled controls.

Added “ข้ามไปผลรวม” to the sticky result header, usable from the invitation or during animal reveals. Skipping cancels the pending reveal timer and opens authoritative totals/crowns immediately, only on that viewer's screen. The skip control hides on final totals. Removed the old result header-image pseudo-element and its image reference.

Build, presentation unit and Docker rebuild passed;5555 health ok with existing volume. Dense browser fixture passed card/label rendering and mobile modal/placement checks. Actual Docker full2A passed111 actions with picked-group background/no-outline assertions, normal sequential results, immediate skip from the invitation, skip mid-reveal followed by850ms without stray animals, independent phone/reduced-motion replay, scoring/reconnect/rematch. All32-card checks passed exact×2/×3 display-stack counts plus expanded-label/figurine/base containment and digit fit. Final browser2/2; inspected expanded count and banner-free mobile result screenshots. Logs /tmp/hm-height-skip-build.log, /tmp/hm-height-skip-unit.log, /tmp/hm-height-skip-dense.log, /tmp/hm-height-skip-browser.log, /tmp/hm-height-skip-docker.log. No main push or Vercel deployment.

## Clearer compact stack-height labels — 17 October 2026
Moved compact×2/×3 labels outward and above the highest cap plane, increased text to10–11px, and switched to cream text on a dark-green badge with a pale border. Right-side stacks place the badge on the left to stay clear of score plaques; narrow screens add a small extra inset for right-column stacks. Expanded card styling is unchanged. The marker receives the real display-stack height, including building foundations.

Build, presentation unit and Docker rebuild passed;5555 healthy with existing data volume. Dense browser fixture passed at390×844,390×620 and320×568 with every compact badge contained by its card and clear of its score plaque. Actual Docker all32-card test passed both normal and59.75px narrow-card layouts with exact height counts, containment/no score overlap, minimum10px text and unchanged enlarged examples. The added phone check caught score overlaps in the first placement; side-aware/narrow positioning corrected them. Inspected compact screenshot. Logs /tmp/hm-badge-visible-build.log, /tmp/hm-badge-visible-unit.log, /tmp/hm-badge-visible-mobile.log, /tmp/hm-badge-visible-cards.log, /tmp/hm-badge-visible-docker.log. No main push or Vercel deployment.

## Complete pickup previews and growing owned collections — 17 October 2026
Animal-acquisition confirmation now renders the same complete compact card face (240px artwork, exact habitat tokens, height badges and score plaque) inside the confirm dialog instead of artwork alone. It has no interactive acquire/inspect control inside the preview; cancel/confirm behavior and stale-choice invalidation remain unchanged.

Empty collections show a large paw and the empty message over the fixed forest, with no large cream panel/header. The empty row is100px high, returning room to the board. Phone owned-card containers grow with1–4 cards, center the single card and keep matching card dimensions; the fifth card fills the rail and enables horizontal scrolling. Heading is a small centered label. Public-display populated collections retain their full overview layout; empty gardens also use the compact transparent state.

Build, presentation unit and Docker rebuild passed;5555 health ok with existing data volume. Dense browser fixture passed the five-card scroll layout at three phone sizes and tablet placement/details checks. Actual Docker full2A passed101 actions with complete confirmation token/score presence, cancel/retry, centered single card and no overflow for1–4 cards, transparent100px empty state, reconnect/scoring/manual-and-skip results/rematch. Shared-display/phone alternating flow and stale confirmation invalidation passed. Browser final2/2 plus dense1/1; inspected complete confirmation, empty and single-card screenshots. Logs /tmp/hm-owned-dynamic-build.log, /tmp/hm-owned-dynamic-unit.log, /tmp/hm-owned-dynamic-dense.log, /tmp/hm-owned-dynamic-browser.log and /tmp/hm-owned-dynamic-docker.log. Fixed a preexisting test Node.remove typing error caught by the build. No main push or Vercel deployment.

## Face-down market slots and calmer pickup confirmation — 17 October 2026
Taken animal slots now render the existing generic card back with a centered “หยิบแล้ว” divider instead of the refill placeholder. The slot stays face-down until the authoritative end-turn refill; no future card data is exposed. Token confirmation shows the original ordered overlapping row at64px per token, with the same front-to-back layering, instead of three separated disks.

Removed cancel-button autofocus. The dialog itself receives neutral focus after opening, leaving both action buttons unselected while retaining keyboard trapping and accessible labeling. Compact count badges were reduced to9–10px with tighter padding and shifted slightly right/down so the lowest terrain remains clearer; side-aware placement still avoids score plaques.

Build, presentation unit and Docker rebuild passed;5555 health ok with existing volume. Dense browser fixture passed badges inside card bounds and clear of scores at three phone sizes. Actual Docker browser3/3 passed full2A109 actions with64px overlapping token preview, neither confirmation button focused, taken-slot card-back/divider checks, cancel/confirm and refill; all32 compact/narrow badge checks plus enlarged cards; shared-display/phone actions including stale confirmation closure. Normal/reduced-motion/skip result flow, reconnect/scoring/rematch remained valid. Inspected token confirmation/back-slot and compact badges screenshots. Logs /tmp/hm-back-preview-build.log, /tmp/hm-back-preview-unit.log, /tmp/hm-back-preview-dense.log, /tmp/hm-back-preview-browser.log, /tmp/hm-back-preview-docker.log. No main push or Vercel deployment.

## Centered collections with stable empty height — 17 October 2026
Removed owned-animal progress markup and its styles; the score plaque remains the single source of earned-tier feedback. Owned heading and cards now share one centered panel, growing through four cards and scrolling from the fifth on phones. Public displays retain the full-card overview. The transparent empty paw state reserves the same card-height-plus31px collection area as populated phone collections, so first acquisition does not resize or shift the board. Terrain-supply and animal-market headings are centered too.

The animal pickup confirmation now uses a180×260px card with an86%-width habitat and140px diagram room, enlarging the exact tokens while retaining scores, cube and count badges. Compact count badges are7px and consistently anchored on the right of every stack; the habitat shifts slightly left to keep badges clear of score plaques even at59.75px card width. This supersedes the earlier side-aware badge positions and100px empty row.

Verification: build and presentation unit1/1 passed; Docker rebuilt with the existing data volume and5555 health ok. Dense fixture plus all32-card compact/narrow/enlarged checks passed2/2 across390×844,390×620 and320×568. Actual Docker browser2/2 passed a full2A game111 actions and shared-display/phone flow, including first-card board/collection height and position stability, centered1–4 card panels, fifth-card scrolling, no progress markup, earned score tiers, confirmation cancel/confirm, reconnect, results and rematch. Inspected compact, single-card and enlarged pickup screenshots. Logs /tmp/hm-centered-build.log, /tmp/hm-centered-unit.log, /tmp/hm-centered-dense3.log, /tmp/hm-centered-browser.log, /tmp/hm-centered-docker.log. No main push or Vercel deployment.

## Tight owned-card panels and clear headings — 17 October 2026
Removed the owned-card count suffix; the local heading now reads only “สัตว์ของคุณ”. Phone collection width follows the actual one-to-four cards plus8px padding on each side, with no140px minimum; fifth-card scrolling remains. Heading and cards stay centered together. The owned panel has its own stacking order, and the board sits8px higher with extra height allowance on short screens so the lower board edge stays clear of the heading. Empty/populated collection height remains stable.

Build and Docker rebuild passed;5555 health ok, existing data volume preserved. Dense browser fixture passed390×844,390×620,320×568 plus tablet interactions; inspected320px and single-card screenshots. Actual Docker full2A passed100 actions, including exact heading copy, centered1–4 cards, fifth-card scrolling, stable first-acquisition geometry, reconnect/results/rematch. Logs /tmp/hm-tight-owned-build.log, /tmp/hm-tight-owned-dense.log, /tmp/hm-tight-owned-docker.log, /tmp/hm-tight-owned-browser.log. No main push or Vercel deployment.

## Completed ribbon at the card top — 17 October 2026
Moved “ครบแล้ว” from the middle of completed owned cards to the top edge with rounded top corners and tighter padding, leaving score plaques unobstructed. Build and Docker rebuild passed with existing data preserved;5555 health ok. Dense browser fixture passed phone/tablet layouts, and actual5555 shared-display flow passed. Inspected the completed gray card in the display screenshot: ribbon is above the artwork and clear of both score tiers. Logs /tmp/hm-top-ribbon-build.log, /tmp/hm-top-ribbon-docker.log, /tmp/hm-top-ribbon-browser.log, /tmp/hm-top-ribbon-shared.log.


## Watch another garden, scoring guide and staged winners — 18 October 2026
Phone and read-only shared-display gardens now render a consistent right tray for every player. The active friend's tray mirrors the remaining public hand and shows the same available-animal species/counts as the actor, using the existing habitat matcher on public board/card state with a cached key. Token slots remain present between turns. Observer animal buttons inspect cards; observers receive no placement/end-turn controls or additional network privileges. Local unconfirmed cursor/placement previews remain local; committed hand/card/board updates are already public.

A turn transition to the local player while viewing another garden opens “เพื่อนเล่นเสร็จแล้ว ถึงตาคุณ”. Returning home is explicit, with an option to keep watching; there is no automatic scroll or forced tab switch. Reminder/guide dialogs participate in normal cleanup and modal scroll locking.

Added a fixed question-mark button beside audio/settings. Its Thai guide covers turn order, every terrain/color and legal stacking, tree height1/2/3 =1/3/7, visible gray mountains and their required neighbor, field components, building height/color diversity, the A-side river shortest-path table and B-side islands including empty land, animal latest-tier scoring, end conditions and tied winners. Examples reuse the actual cylinder caps. Content follows the existing2024 base rules and scoring implementation; rules/projections/protocol are unchanged.

Results retain manual reveal and individual animals per garden, now placing each baked animal figurine on its actual board terrain stack. Rounded sand panels, static forest frame and shallow token dioramas match the playing board; per-category scores also use the same token renderer. After the last garden, a1200ms quiet pause precedes one winner spotlight. Shared winners appear one at a time before an explicit table button. Skip bypasses animal reveals and the pause, but still presents the winner before the comparison table. The table has actual per-player totals/categories plus detailed terrain/animal cards; underlying board totals remain gated until that viewer opens the table. Timers cancel on close/unmount/skip; no continuous animation, mesh renderer or new model assets.

Verification: build and presentation unit passed. Actual Docker suite3/3 passed full2A88 actions, dense phone/tablet interactions and shared-display/phone turns with live3→2 token counts, no observer placement controls and return-home reminder. The strengthened dense fixture subsequently passed an engine-legal finish with populated animals, exact reveal counts/subtotals/models, pause/winner/table ordering, and a separate legal seed23 shared victory (35 points each) with sequential winner spotlights. Guide lock/content/model checks passed; inspected guide, observer tray, reminder, populated reveal, winner and table screenshots. Final Docker rebuild healthy at5555 with existing data volume; final shared-display browser check passed. Logs /tmp/hm-oct18-build.log, /tmp/hm-oct18-unit.log, /tmp/hm-oct18-browser.log, /tmp/hm-oct18-populated.log, /tmp/hm-oct18-local.log, /tmp/hm-oct18-docker.log. No physical-device FPS claim; no main push or Vercel deployment.


## Final-round announcement before the game can finish — 18 October 2026
Added a one-shot650ms token-pop animation in a gold “เข้าสู่รอบสุดท้ายแล้ว” modal on all surfaces. The active player's copy says “นี่คือตาสุดท้ายของคุณ”; the modal explains the actual space/bag condition and lists only the seats still playing in the current equal-turn round. A player's own final-turn transition receives its own reminder, merging the return-home action when they are watching another garden. Waiting players are told when their last turn is already over. Remaining-seat queues update on turn changes without replaying the animation. Reduced motion presents the same notice without animation; there are no looping effects or timers that end the game.

The client anticipates the boundary from public board empties/bag count before an end command, because the final seat can end and settle immediately without a subsequent playing-state endAt snapshot. Once endAt exists it uses that authoritative value. This is presentation only: server rules/state/projections are unchanged. The supply heading stays gold with final-round/remaining-turn text, can reopen the queue, and keeps its existing height. Announcement-seen state resets for rematches; dialogs are removed when the game finishes or the renderer unmounts.

Verification: build passed;4/4 presentation-boundary unit tests covered normal/finished states, space/bag warnings, rotated starter ordering, and a warning before every actual legal game-ending action in2/3/4-player games. Dense browser fixture passed warning visibility on display and both phones, exact remaining-seat count, manual dismissal/reopen without a state mutation, reduced-motion behavior and legal populated/tied results afterwards. Actual5555 browser2/2 passed full2A100 actions (animals and stacks included), reconnect/container recreation, warning dismissal, complete results/rematch, and shared-display actions. Docker rebuilt healthy with existing volume/data retained. Inspected active/waiting/display announcement screenshots. Logs /tmp/hm-last-round-build.log, /tmp/hm-last-round-unit.log, /tmp/hm-last-round-dense.log, /tmp/hm-last-round-local.log, /tmp/hm-last-round-docker.log. No main push or Vercel deployment.

### 2026-10-19 — Luminous Nature's Spirits and complete draft cards

Nature's Spirits now use ten original baked crystal figurines instead of the white cube/point renderer. Each has its own recognizable animal silhouette, jewel color and restrained rim glow: lion, butterfly, stag, owl, bat, crane, mountain goat, marmot, dragonfly and turtle. Transparent 160×184 WebP assets use the same billboard projection as ordinary animals, including board height, camera counter-rotation, preview, tray and habitat examples. The board model is slightly larger than an ordinary animal for clarity. Whispers retain their distinct purple cube and separate coexistence position. No rule, score or server projection changed.

The first-turn draft now wraps each portrait in the ordinary inspect-card structure; it no longer applies the card container and inspect classes to the same button. Both the two-card choice and its confirmation popup preserve the full 720:1040 picture with contain sizing and correctly scaled habitat overlays at narrow phone widths.

Spirit cards have a gold star seal and warm edge; Whispers have a violet seal and edge. Both stay identifiable in “สัตว์ของคุณ”. Newly accepted acquisition/activation events pulse the seal once and play a short ascending shimmer through the existing effects bus. Existing mute and effects-volume controls apply. Snapshot, presence, duplicate sequence and revision-gap updates do not replay the sound. Reduced motion suppresses the visual pulse; there is no repeating sound or constant flashing.

Exact prompts, original and revised atlas paths, extraction rectangles and runtime outputs are in `spirit-figurine-art-jobs.json`. The generated atlas was revised for separated silhouettes before extraction; final transparent WebPs were inspected together on a dark green background. Rules and expansion scope remain as documented in `expansions.md`.

## Sculpted animals and luminous Whispers — 19 October 2026
All live normal animals now use 32 original smooth, hand-painted sculpted miniature sprites instead of voxel animals. Board pieces, placement previews, available-piece trays, results and small/large card habitat diagrams share the same resolver and projection. Normal pieces use natural opaque colors with only a dark contact shadow. The earlier cube/voxel presentation is superseded.

All ten Whisper cards now use five luminous object models matching their printed categories: crystals, forest statuettes, flowers, coral and mushrooms. Each category serves its two cards. When sharing a cell, the animal and Whisper shift slightly apart; the Spirit is compacted to keep both silhouettes on the cap. This also applies to previews. Cell accessibility labels name the Whisper and identify Spirits.

Spirits retain their original ten crystal sprites, with stronger colored core/rim glow and a wider halo in both board and habitat diagrams. Whispers have a softer violet/aqua glow; normal animals have no emissive effect. Glow is static, with no new animation, meshes or timers.

The 37 new sprites are transparent 160×184 WebPs, normalized with safe margins. Total compressed size is approximately 369 KiB, maximum 13 KiB per sprite. Versioned `figurines/sculpted-v1` paths avoid the old voxel cache. Exact generation prompts, source files, processing format and Whisper mapping are recorded in `sculpted-figurine-art-jobs.json`. Existing sprites remain available for old clients. Game state, placement rules, scoring and network projection are unchanged.

## Friendly storybook animal pieces — 19 October 2026

User feedback: the first sculpted animal set looked too realistic and frightening. All 32 ordinary species and all 10 Nature Spirits now use original, transparent chibi storybook illustrations: oversized rounded heads, friendly eyes, compact bodies, broad colors and simplified fur/scales. No sharp teeth, realistic skin or photographic miniature rendering. The 42 sprites share a crocodile style reference and remain 160×184 WebP with an 8px transparent margin, 376 KiB total.

Board placements, trays, confirmation previews and both habitat-diagram sizes resolve the same `figurines/cartoon-v2` assets. Ordinary animals keep only the contact shadow. Spirits retain the stronger existing glow; the five Whisper object sprites and their softer glow remain in use. Anchors, scale, camera transforms, stacking and rules are unchanged. The habitat cache key now includes cartoon-v2.

Built-in image_gen prompts, source paths and final workspace paths: [cartoon-figurine-art-jobs.json](cartoon-figurine-art-jobs.json). Source renders were normalized with Sharp (alpha trim, contain bottom-aligned within 144×168, 8px transparent margins), preserving generated transparency. The earlier sculpted files remain as source history; only Whisper objects still use sculpted-v1 at runtime.

## Solo market change button — 19 October 2026

The solo card-change action shares the market's green 28px circular claim-button style and 18px SVG sizing. Two opposing arrows replace the text glyph; the change button sits 4px below the plus button in the same column. It retains the existing confirmation and solo-discard legal action and is disabled while an action is pending.

### 2026-10-20 — cinematic animal figurines and scoring reference
- Normal and Nature Spirit board/tray/pattern sprites now use `figurines/animated-v3/`: dimensional 3D animation rendering with warm key light, cool rim light and friendly natural proportions. Normal animals retain only contact shadows; nature spirits receive a colored multi-layer aura and a soft light pool in the selection tray. Whisper objects retain their existing sculpted sprites.
- Available-animal frames allow the figurines to overflow. The scrolling shelf reserves transparent padding for tall silhouettes and aura, preserving access to all choices and End Turn on small screens.
- A circular calculator button immediately left of help opens an illustrated scoring reference. Terrain/animal examples share the existing help content; enabled modules add all ten spirit bonus descriptions, Whisper examples and Solo sun thresholds. This changes explanations and rendering only.
- Prompts and sources: `animated-figurine-art-jobs.json`. Runtime assets are transparent WebP at160×184; the visible body is fitted within144×168 and bottom-aligned. No new rendering dependency.

### 2026-10-20 — uniform protruding portraits and animated spirit light
- Current board/tray/pattern sprite source is `figurines/animated-v4/`, tightly alpha-trimmed without internal letterboxing. All sidebar portraits share a48×56px top-aligned image stage; frame fill exactly matches the semi-transparent terrain-token slots. Selection changes only the border. Shelf padding accommodates protruding portraits, light and scrolling choices.
- Board animals now use34–48px width /40–58px height (previously22–34px width), preserving the terrain-cap anchor and both cameras. Whispers remain smaller where sharing a tile.
- Nature Spirits have stronger colored bloom, a breathing light pool and four offset twinkling stars. Only these decorative particles override the historical global animation-disable rule. Reduced-motion disables both star movement and aura breathing; the animal body does not move off its tile.
- Replaced the crocodile with a smoother, compact upright animated-film character generated using built-in imagegen. Full prompts/source and crop output paths are recorded in `animated-v4-art-jobs.json`; other species reuse the previous3D sources.

### 2026-10-20 — in-game help and finished-board controls
- Help now composes the actual board token caps, stacked terrain, habitat pattern and animal sprites through `harmonies-how-to.ts`; no separate generic guide art. The scoring shortcut uses a trophy SVG.
- Informational/results/detail popup crosses use geometric SVGs centered in44px circles. End is a52px raised circular button with End text and unchanged server legality gates.
- After finish, the selected board sidebar replaces End with raised circular summary/replay controls. Summary opens the score table directly in a popup; no inline score table or return-to-board button. Replay remains owner-only. Existing automatic reveal invitation remains available immediately at game end.
- Finished terrain caps are dimmed to72% brightness and animal sprites to62% opacity; special light is static/dim. Board camera navigation and animal/Whisper inspection remain usable.

### 2026-10-20 — Android lightweight effects and clearer shared tiles
- Hamburger checkbox selects a persistent per-browser lightweight mode; Android/initial OS reduced-motion defaults on. Normal mode remains available. Phone lightweight views instantiate only the selected garden, with friend tabs unchanged; shared displays retain all boards.
- Lightweight cards use120x174background art plus64px figures in flat SVG habitat diagrams with real terrain symbols/heights. Large detail popups keep full resolution. Derived assets rebuild with `node scripts/build-harmonies-lite.mjs`. See `performance.md` for measurements and physical-device limits.
- Board animals now max40px; paired figures use29px/24px caps and distinct anchors. Board aura uses silhouette light and dimension-matched particles, with broad pools removed. Special detail/confirmation cards have static gold/purple light borders. Finished circular controls have static bright backlighting. Draft buttons separate the small select label and the animal name.

### 2026-10-20 — Finished board controls replace token slots
- Finished sidebars omit all three empty token slots. Summary and owner restart circles replace the slots, centered vertically in the existing sidebar. Finished phones reuse the playing grid: obsolete fixed480px garden and extra score row removed to avoid page scrolling. Verified at320x667/390x844/1100x844 with summary, inspection and restart.

- Finished restart opens the shared accessible confirmation dialog, with cancel/Escape preserving the finished board and confirmation invoking the original replay action. Owner permission and revision guards remain in effect.

### 2026-10-20 — Card names and taken garden slots
- Small Spirit cards omit the overlaid animal name. Full-size detail cards display names for every animal type, in addition to the accessible popup heading. Taken garden slots retain their hidden card back and pickup label with grayscale applied to the entire slot.

### 2026-10-20 — Uniform figurines and2+1 placement tray
- New built-in imagegen set `figurines/animated-v5`:41 freshly generated normal/Spirit figures plus normalized existing boar, whose generation was rejected repeatedly. Every image is RGBA160x184, fitted144x168 and bottom-aligned to y176; prompts/provenance are in `animated-v5-art-jobs.json`. Rebuild with `node scripts/build-harmonies-figurines-v5.mjs`, then `node scripts/build-harmonies-lite.mjs`. Existing runtime Spirit aura and lightweight preference remain.
- Terrain hand uses two frames above one centered frame. Selected terrain has a bright inset fill, cyan border and double outline. Animal frames share dimensions with terrain, use a distinct dark teal fill, have portrait headroom and spacing, and show two candidates with scrolling for more. Slot size responds to board viewport height; End retains its bottom anchor and finished controls retain their centered placement.
- Mouse/touch pointer dragging previews only server-provided legal placements on the player's own board. Dropping outside only selects the token; confirmation remains required. Re-render/reconnect cancels any active drag; a dropped pointer's synthetic click cannot clear the preview.
- Group confirmation uses the same terrain discs, perspective, icon ratio, order and source-relative overlap/shadow, enlarged to64px with a fixed flex basis to prevent stretching.

- Validation: all42 alpha images have160x184canvas and opaque baseline y175; presentation unit check and9 targeted browser checks passed, including mouse/touch drag, two visible animal slots/scroll, aura, summary/restart and lightweight mode. Actual rebuilt Docker5555 verified group popup, drag preview/commit and no page scroll at320x667 and390x844; temporary room closed unfinished.

### 2026-10-20 — Landscape workstation and final garden portraits
- Personal controllers and interactive shared controllers at900px+ width,600px+ height and landscape orientation place the selected garden on the left. Supply, market and owned cards form aligned rows on the right. CSS grid uses display:contents on the existing selected player wrappers, preserving DOM identity, click/drag listeners and friend navigation. Public multi-garden displays keep their overview. Draft selection remains unchanged.
- Wide screens use proportional219–270px card faces,54–72px terrain/animal frames,64px End/result controls,44px header controls and increased board figure size. A longer1800px perspective keeps large lower-edge terrain caps within the board viewport. Both card rails scroll horizontally when needed and keep complete card faces visible vertically.
- Portrait screens retain supply/market/board/collection ordering, with matching card aspect ratios and heights;4-card collections can scroll rather than clip the last card.
- Results show a score-labelled plaque and one full figurine per type actually present on the final board (including Spirits/Whispers). Multiple cubes of one type do not duplicate the portrait, and unplaced cards are omitted. The reveal narrative groups the same types and aggregates their existing card scores; scoring rules are unchanged.

- Verified: build and9 targeted browser checks pass; landscape1024x768/1180x820/1366x1024/1600x900 keeps full terrain caps and full-height cards in view; portrait390x844/768x1024 preserves the stack and access to all4 owned cards. Mouse drag confirmation and friend-tab navigation work across orientation changes. Results tests use2 placed crocodiles plus an unplaced card and show1 model type in reveal, winner and summary. Rebuilt Docker5555 independently checked five viewport sizes and interactive shared controller; temporary room closed unfinished.

### 2026-10-20 — Compact drafting panel and horizontal placement shelf
- Supply and animal market share one compact panel. Personal/interactive controllers keep the garden centered with three adjacent terrain frames beneath it, followed by a separate horizontal animal shelf and End. The shelf reserves three empty frames, displays every available animal, and scrolls independently when space is tight. Landscape retains the larger board-left/cards-right arrangement.
- Solo market reserves all three visual positions. Public card-ID slot history is stored per room in sessionStorage so a claimed card remains a face-down “เลือกแล้ว” placeholder in its original position after reload. No private deck data or authentication tokens are stored. Completed owned cards retain softly faded color and their ribbon.
- Removed routine placement instruction copy; actual errors and alternative habitat choices remain accessible. Animal previews use a green map pin behind the upright figurine; either the figurine or pin confirms the server-provided legal habitat. Mouse/touch dragging supports both terrain and animals, previews without mutation, and clears on rerender/cancel. Horizontal touch gestures scroll the animal shelf; upward gestures drag.
- Verified TypeScript/build, presentation unit test and ten browser scenarios covering original Solo positions/reload, terrain/animal mouse and touch dragging, compact/wide/portrait layouts, overflow, completed color, reduced effects, help/scoring and finished/restart flows. Rebuilt Docker with existing data/auth preserved and independently checked localhost:5555 at five sizes plus interactive shared controller; temporary room closed unfinished. Touch testing used Chromium emulation, not a physical device.

### 2026-10-20 — Right placement rail and consistent taken-card treatment
- Returned the active placement controls to a vertical right rail: three terrain frames, then an animal shelf with two reserved frames, then End. The shelf consumes remaining board height, exposes additional animals on taller screens and scrolls vertically only when needed. The board regains its full vertical area. Finished controls retain their centered layout.
- Taken market slots keep their original positions and colored card backs, softly faded with the same saturation/opacity treatment as completed owned faces. Both use the shared top ribbon component; “เลือกแล้ว” replaces the former middle label. No grayscale filter remains on taken cards.
- Added headroom/padding inside the market's horizontal scroller so plus buttons visibly extend beyond card tops without clipping, including mobile screens. Vertical touch swipes scroll the animal rail; sideways gestures drag an animal onto the garden with the existing preview/confirmation flow.
- Verified build/TypeScript, presentation unit and ten browser scenarios. Coverage includes mouse/touch dragging, preserved Solo positions and reload, colored top-ribbon placeholders, overhanging plus hit targets, five animals fitting a tall rail and scrolling on a short rail, End positioning, finished controls and lightweight mode. Docker rebuilt preserving existing data/auth; actual5555 checked at six viewport sizes and shared controller, with the temporary room closed unfinished. No physical-device or deployment verification claimed.

### 2026-10-20 — Quiet confirmation and themed startup
- Animal drops now show the same green circular check used for terrain, with opacity.58 (.9 on hover/focus), instead of a large animal/pin overlay. No animal is added until confirmation; mouse/touch preview and authoritative legal-habitat commands are unchanged.
- Lazy game-module loading and authenticated reconnect loading use a fixed centered sprout icon, subtle rotating ring and Thai status. Reduced motion disables the ring rotation.
- Harmonies room links, lobby/share QR, copied links and recent-room links use `/harmonies/play/<code>` or `/harmonies/display/<code>`. The router accepts game-qualified room surfaces and normalizes them to the original internal role/code. Legacy URLs still work and resume with identical authentication/pending-command keys. An authorized server snapshot determines the actual game and canonical URL even if the supplied game prefix is wrong.
- The previous brown flash came from the platform/base theme before the room snapshot and lazy Harmonies CSS arrived. An inline head bootstrap now paints/preloads the existing river background before the main module executes, based on the explicit Harmonies path or a public per-room theme hint for legacy links. The hint contains no credentials, private state or permissions. Normal lobby/platform/invalid-room rendering clears the startup theme.
- Verified build, eleven distinct browser scenarios (including all-game owner creation and profile flow). The startup test holds the main module to inspect the pre-app background, delays the game module to inspect the centered loader, checks legacy/new/mismatched-prefix resume identity/state, public display and invalid-room recovery. Docker5555 is rebuilt and independently checked with the same delayed-module startup and legacy/new paths, preserving data/auth and closing the unfinished QA room. No deployment requested.

### 2026-10-20 — Animal-on-token confirmation and five-frame rail
- Animal placement previews now render the actual figurine upright on a green checked terrain-sized cap. The green cap shares the real stack plane; the figurine uses board-model sizing rather than a large map pin. Both cap and figurine confirm through the same server-authorized placement action. The preview alone leaves the game state unchanged.
- The right rail fits three terrain frames and two animal frames contiguously, sizing all five from board viewport height. Terrain discs and animal art grow with their frames. Animal models fit within the frames, avoiding overlaps between adjacent slots. Extra animals extend into the remaining bottom area behind a floating End control; their exposed edges/top indicate overflow. Vertical scrolling, with bottom padding, brings the last animal fully above End without moving the control.
- Validation: build, presentation unit and eleven browser scenarios passed, including mouse drag/model click, touch drag/cap tap, contiguous hand frames, green preview before mutation, matching terrain/animal frame sizes, three-plus animals visible behind End, scrolling the final animal clear of End, layout sizes, startup, finished/restart and lightweight effects. Docker5555 rebuilt with existing data/auth preserved and verified at six viewport sizes plus interactive shared controller; fresh QA room closed unfinished. No deployment requested.

### 2026-10-20 — Larger confirmation model, expanded board and optional animals
- Awaiting-confirmation figurines render35% larger in both dimensions than placed models, without the old image max-height constraint. The cap retains its original terrain color, with a strong static green halo and a small check badge. Clicking the cap/model commits; a separate circular cancel control clears the local preview without a server action.
- The board expands partially behind the foreground right rail. The rail begins six pixels below the drafting panel on portrait screens, with six-pixel gaps between frames. Animal figures project slightly above their frames with enough shelf headroom. End returns to52px on phones/64px on wide layouts and can overlap the scrollable animal shelf; bottom scroll padding keeps the last animal reachable.
- Official rules, current English PDF pp.4/6: all three selected terrain tokens are mandatory; animal-cube placement is optional. Existing server legality already implements this correctly. End remains usable after terrain is complete even if valid animal habitats remain. Canceling a preview re-enables End. Once terrain is complete and there are no available animals, empty placement frames disappear, leaving End. Optional card acquisition remains available through the market.
- Verified build, presentation unit and eleven browser scenarios. The extended finished-flow test preserves a valid animal habitat while legally placing all terrain, cancels its preview and ends without placing the animal; server progress stays unchanged. Other checks cover original terrain colors/halo, larger preview dimensions, mouse/touch drag and confirmation, enlarged terrain bounds, rail scrolling/spacing, startup and lightweight effects. Docker5555 rebuilt preserving data/auth and checked at six sizes plus shared controller; unfinished QA room closed. No push/deployment requested.

### 2026-10-20 — Measured board clearance and bounded controls
- Added `harmonies-board-fit.ts`: measures projected hex/cap rectangles against the actual control frame, recenters the usable garden area and reduces its width when necessary. Horizontal intrusion is limited to10% of one frame width, with a one-pixel margin; viewport top/left/bottom stay clear too. Fitting runs on render/viewport resize, with observer/frame cleanup when leaving the game; it does not run an animation loop or alter rules/state.
- Terrain/animal frames now cap at64px, preserving the smaller responsive size on short phones. End is horizontally centered on the same rail. Both market and owned card dimensions decrease10% together, including wide controllers; small-card aspect ratios and horizontal overflow behavior are preserved.
- Available animal slots now use a wrapper with sibling choose/cancel buttons. The cancel cross appears only in the selected animal's slot during a pending habitat preview, uses a circle and never starts a source drag. Terrain preview cancellation remains beside the board. Existing optional-animal End behavior is unchanged.
- Verified build/presentation unit and eleven browser scenarios. Layout checks measure the10% clearance,64px size cap, End alignment and exact90% wide card height across landscape/portrait320–1600px, both cameras, mouse/touch drag, slot-local cancel and confirmation. Docker5555 rebuilt with data/auth preserved and independently checked at six sizes plus shared controller; unfinished QA room closed. No physical-device or deployment claim.

### Tap placement and drafting order — 2026-10-20

- Removed terrain/animal drag bindings and the obsolete drag helper. Tap a hand token or available animal, tap a legal board cell, then confirm; swipes do not preview or commit placements. Animal controls retain native vertical scrolling and figurine images remain non-draggable.
- Market cards precede supply groups in DOM and visual order. Existing panel/board heights stay unchanged. Supply groups retain44px height with2px vertical padding; terrain discs grow within each group's available width while preserving their proportions.
- Garden/owned headings align left on phone and landscape layouts; owned-heading bottom padding is0. Solo exchange controls use white faces and green icons. End uses a cream/gold raised face with green lettering and a muted disabled treatment. Animal hand frames share the terrain frame's translucent cream background.
- Verification covers mouse/touch swipes producing no placement, tap preview/cancel/confirmation, actual server mutation only on confirmation, Solo placeholder persistence, matching frame colors, heading alignment, overflow/scrolling and unchanged finished/optional-animal behavior. Local Docker5555 rebuild preserves data/auth. No deployment is included.

### Compact card spacing and placement confirmation — 2026-10-20

- Both card rails grow5% relative to their previous sizes. Market faces begin4px below the heading, retaining internal scroller headroom for the overhanging plus controls. Removed decorative icons from both card headings.
- Only Solo supply discs are capped at36px, with a2px cylinder edge, to stay inside their40px buttons. Competitive five-group sizing is unchanged. Solo exchange controls gain a thin green border.
- Pending terrain uses its original terrain paint, the same green halo as an animal preview, and a centered check. Terrain and animal cancellation each appear in the center of the selected hand frame; both are sibling buttons, never nested controls. Preview/cancel remains local; confirmation alone sends the server action.
- Enabled End has a leaf-green face and soft static glow. On narrow/portrait screens it extends into the owned-card heading area, stopping before the card face; board stacking keeps the complete circular control visible and clickable. Disabled End stays muted. No animation loop was added.
- Board fitting starts3.5% larger, then clamps measured terrain bounds to the existing10% rail overlap limit and viewport bounds. Detail popups retain names in their header and omit duplicate card-face names while preserving special-card aura.
- Verified build/typecheck, presentation unit and eleven browser checks, including centered cancels, terrain preview/cancel/confirm, popup names,5% card sizes, heading gap, Solo containment and End hit testing over the owned panel. Rebuilt Docker5555 with data/auth preserved and checked six sizes plus the interactive shared controller. Touch is Chromium emulation. No push or deployment.

### Printed token faces and board-sized hand pieces — 2026-10-20

- Generated a six-motif transparent sprite atlas with the built-in image_gen tool: water lines, leaves, mountain chips, flowers, village houses and growth rings. Selected source and six96px alpha-preserving warm-ink derivatives live under `public/art/harmonies/tokens/printed-v1/`; the selected prompt and paths are in `token-print-prompts.json`. `scripts/build-harmonies-token-prints.mjs` rebuilds the cropped/padded/tinted derivatives. Runtime assets total about20KB; the original atlas is not requested by the UI.
- Native SVG wrappers embed the PNG prints in board caps, hand/supply discs, help/popups and card miniatures, including flat lightweight diagrams. Terrain colors, accessible names and all server state remain unchanged.
- Hand and animal frames now size from the median projected board-cap diameter, with12px extra room for the painted cylinder edge and padding. Hand faces use that diameter and the measured board-face aspect ratio. Empty gardens derive the face size from projected cell geometry. The fitter settles board/control widths together, retains the10% maximum board intrusion, and caches hand measurements per viewport using a WeakMap. No continuous animation or layout loop.
- Board, hand and supply now use the same8px painted edge and38% darkened terrain shadow color. Supply faces cap at34px and shift upward to fit the full thick edge within the existing40px button; Solo and competitive row heights are unchanged. Animal shelves scroll when larger matched frames need additional space.
- Validation: build/typecheck, presentation unit and eleven browser checks passed. Checks compare actual hand/board widths, matching8px edges, generated print references, supply face-plus-shadow containment, both cameras, mouse/touch preview/cancel/confirm, responsive layout, scroll access, lightweight effects, startup and finished/restart. Alpha/dimension inspection confirmed all six96px PNGs retain transparent backgrounds. Docker5555 rebuilt preserving data/auth and verified at six viewport sizes plus interactive shared-controller mode; temporary room closed unfinished. No physical-device or deployment claim.

### Animal selection feedback and owned-heading inset — 2026-10-20

- Selected available-animal frames now share the terrain hand's cyan border, pale mint face, outline and soft cyan glow. The existing pressed state remains the interaction source.
- Legal animal destinations gain an upward cyan drop-shadow on the hex surface. The glow is static, scoped to destination cells, and smaller in lightweight mode; previews, cancellation and server legality are unchanged.
- The existing resize fitter aligns each owned heading with its first card's unscrolled position, accounting for centered short rails, scrolling full rails and wide-layout padding. Collection resize observations share the same scheduled frame and cleanup as board fitting.
- Validated build/typecheck, browser mouse/touch selection and responsive heading alignment, finished/inspection/restart and lightweight mode. Rebuilt Docker5555 with existing data/auth preserved; checked six viewport sizes and shared-controller mode, including one-card heading alignment. No deployment.

### Larger garden and bottom-anchored cards — 2026-10-20

- Printed terrain motifs use82% of their cap/disc face, reduced from90%; flat lightweight diagrams also use smaller22px prints.
- The fitted board gains an additional5% scale. The full viewport bounds still constrain it, but the foreground command rail may overlap the enlarged garden; this supersedes the previous10% intrusion restriction for the final enlarged board. Native controls retain their foreground layer and hit areas.
- Terrain/animal frame width now matches the median projected board token diameter, replacing the previous12px frame allowance. Hand discs fit inside that frame with room for their unchanged8px edge, including top-camera projection. Animal overflow remains scrollable.
- Owned cards anchor at the bottom with4px spacing. Wide collections use content height instead of stretching a large empty panel through the remaining row. Portrait gardens keep the remaining middle row. End returns to the bottom of its board rail and no longer extends into or dictates the owned-card section.
- Verification covers viewport containment after orientation settling, frame/board face size agreement, header/card alignment, bottom anchoring, End independence, preview/cancel/confirmation and finished controls. Docker rebuild preserves existing data/auth. No deployment.
- Final checks passed: presentation unit and eleven browser scenarios. Docker5555 verified six viewport sizes plus shared controller after waiting for resize rendering to settle; no body scroll. Existing data/auth retained and unfinished QA rooms closed.

### Hex auroras, model halos and content-sized animal rail — 2026-10-20

- Legal animal destinations render three upright translucent cyan/mint/violet curtains emerging from the hex. CSS transform/opacity motion is enabled specifically for these curtains, overriding the older global motion reset only when OS reduced motion and lightweight mode are both off. Curtains never intercept clicks; those modes retain static light.
- Board/shelf models and ordinary/special card pattern figurines have a white silhouette halo. Nature's Spirits retain colored aura, Whispers retain their tint, and confirmation retains green light. Lightweight SVG model thumbnails also have a small white shadow; lightweight normal models use a single2px white shadow.
- End participates in the placement rail's vertical flow immediately after animal slots. The animal shelf keeps its natural height when everything fits, and flexes/scrolls only when End reaches the lower boundary. On portrait/narrow screens that boundary stops before the actual owned card faces. This supersedes the earlier always-expanded shelf and floating End overlay.
- Animal scrollports reserve14px horizontal padding and12px vertical padding so selected cyan outlines and glows are fully visible. Terrain/animal highlights share their border, face, outline and glow. Margin compensation retains6px visible gaps between frames and End.
- Drafting-panel bottom padding accounts for the supply row's own2px inset, matching the visible side spacing. The root row follows this content height instead of leaving extra empty panel space; final-round headers retain their extra height.
- Passed build/typecheck, presentation unit and eleven browser scenarios, including normal-height versus constrained-height rail scrolling, all five animals accessible, selected-frame glow room, white model halos in detail view, animated/static aurora modes, and preview/cancel/confirmation. Docker5555 rebuilt preserving data/auth and checked six sizes plus shared controller with no body scroll; temporary room closed unfinished. No physical-device or deployment claim.

### Printed pending terrain and larger End — 2026-10-20

- Pending terrain keeps its generated print, original terrain paint,8px darkened wooden edge and a soft glow tinted to that terrain. The green confirmation check is a separate pale-backed badge with white/mint glow so it does not replace the print. Its protruding edge remains clickable/tappable through the confirmation button. Removed the old dashed ghost outline while that preview is active.
- Terrain print coverage is74% of the face, reduced from82%; flat lightweight diagram prints are20px, reduced from22px.
- End grows to64px on compact screens and76px on wide landscape screens, with larger text. Its existing natural rail flow and conditional shelf scrolling remain.
- Picked supply groups use an opaque green fill with a1px darker green border, matching ordinary group border thickness.
- Validation covers generated print/colored-edge presence, green check/glow, confirmation by mouse and touch at the protruding badge edge, picked-group border, responsive End sizing, natural-height versus constrained-height rails, and finished/inspection/restart. Build/typecheck passed. Docker data/auth retained; no deployment.
- Final verification passed: seven relevant browser scenarios, including screen-coordinate mouse/touch hits on the protruding HTML check badge. Docker5555 rebuilt with data/auth preserved and checked at six sizes plus shared controller; larger End remains fully inside the browser viewport. Temporary QA rooms closed unfinished.

### Precise animal destinations and shared selection frames — 2026-10-20

- Removed legal-destination aurora markup and light filters. Legal animal cells use a crisp cyan hex edge with a dark outer stroke, keeping each destination unambiguous. Model halos and special-animal effects remain.
- Terrain and animal source buttons share one selected-style rule: cyan border, dark-blue inset, blue outer ring and dark outline. There is no pale/white ring unique to animals.
- Pending terrain confirmation uses a green badge with a white check; its existing soft glow and protruding-edge hit area remain. The round turn action reads “จบ”.

### Completed details and consistent supply depth — 2026-10-20

- Full-card details now read completion from the same owned-card progress as the thumbnail. A completed face shares saturation .8 / opacity .65 with the owned card, while the green “ครบแล้ว” ribbon stays clear above it. Incomplete/unowned cards remain undimmed; the popup title remains the only animal-name label.
- The round turn action now reads “จบตา”. Supply-confirmation tokens retain enlarged faces/overlap but use the source group's exact 8px colored edge and shade, rather than scaling an outdated 4px shadow.

### Solo lobby follows roster — 2026-10-20

- When a second player joins, clear the host's Solo draft and disable the Solo checkbox while more than one player remains in the roster. Spectators do not count; disconnected players retain their seat, so reconnect does not re-enable Solo. Nature’s Spirits, Whispers and board-side selections remain untouched. Server start validation stays authoritative.

### Simultaneous Spirit setup and persistent placement trays — 2026-10-20

- Each player sees their private two-card Spirit offer at game start and may choose without waiting for the turn owner. Confirmations remain open when another player's independent choice arrives. Once selected, a waiting panel shows the remaining player count; normal turns unlock when everyone chooses.
- The placement rail no longer disappears when all three terrain pieces have been placed. Three empty terrain frames and the animal shelf remain, with “จบตา” enabled when legal. Pending placement confirmation still must be confirmed/cancelled; animal placement remains optional.

### Centered garden load failure — 2026-10-20

- Failed game-module downloads use the full-viewport garden status layout: a stationary leaf/alert icon, “ยังเปิดสวนไม่ได้”, short recovery copy, and a round-ended “ลองอีกครั้ง” button. All content is centered over the river theme and the status is announced as an alert.
- Retry still reloads the existing authenticated room; it does not create a new player or reset game state. Keyboard focus remains visible and the failure icon does not spin.

### Full-size glowing finished actions — 2026-10-20

- Summary and restart buttons now share the enabled End button's green radial face, cream rim, raised edge and soft green glow. Both match End's 64px diameter on compact screens and 76px on wide landscape; their existing icons grow to 30/36px.
- Finished board controls render above the owned garden panel and allow overflow, preserving the centered row and viewport height. Existing summary popup and restart confirmation behavior remain.

### Center the finished hex field — 2026-10-20

- The board fitter now observes finished viewports as well. Finished boards center the projected left/right tile edges within their full viewport, without reserving room for the former placement rail. This corrects the hex field's offset inside its square CSS container across camera and viewport changes.
- Playing-board fitting, finished action placement, board inspection and page height remain unchanged.

### T-rex promo option and original assets — 2026-10-21

- Added an opt-in promo checkbox beside the existing lobby modules. It adds one T-rex to the Spirit pool and includes Nature’s Spirits, preserving simultaneous private setup. The label explains random inclusion rather than promising T-rex every game.
- Newly generated feathered gold/teal T-rex art has full/small/lite card variants and a transparent160×184 figurine. Existing card geometry, completion UI, paired-animal layout and gold aura are reused. The board/tray has a subtle foot-anchored breathing idle, disabled by lightweight mode or OS Reduce Motion.
- Scoring/help include the exact habitat and connected-animal bonus example. The game menu names the active promo. See trex-promo.md and trex-art-jobs.json for source rules and asset provenance.

### Reviewed expansion UI (2026-10-21)

The host may select A/B/C/D and independently enable the reviewed Sanctuary (4/10) and Pulse (1/10) subsets. The Sanctuary market button opens a native dialog with the visible pile top and two side offers; owned wave-top landscape faces occupy the existing garden rail, preserving mobile/desktop grid placement. Four-layer token diagrams are SVG compositions of the selected mode's terrain assets. Board maps and hit regions share axial coordinates; dry D cells have a distinct cracked-ground pattern. Completed Sanctuary stacks can carry several final Animal residents and expose the list on inspection. Results include Sanctuary totals; C/D Solo results show the numerical score without inventing a Sun chart.

### Board figures, shared popup shell and finished overlay — 2026-10-22

Board figures are about one third larger (mobile 30–40px wide; desktop 38–60px). Ordinary Animals/Spirits and co-located Whispers retain identical image boxes and share a cap baseline; pairing shifts them left/right with permitted overlap, never scales either down. Standalone figures remain centered. Previews use the same anchoring logic. Existing models and game rules are unchanged.

Settings uses a gear inside the same circular toolbar treatment as help/scoring. The button no longer inherits obsolete `details`/`summary` styling. Help, scoring, settings and rankings share `harmonies-dialog.css`: green sticky header, ivory body, gold border, matching close button, width, scroll limits and backdrop. Ranking mode selection/data loading remain unchanged; its shell is also available on the entry page.

The end-of-game message remains an absolute overlay within each board viewport. The finished fitter ignores its dimensions, maximizes the board in the available viewport and reserves only the fixed terrain-stack depth used during play. Enlarging or wrapping the message cannot shrink the board. Animals remain opaque after game end.

### In-game card library — 2026-10-22

A circular card-library button sits immediately right of help. Its shared-shell dialog includes all 54 supported Animal cards independently of the room's selected modules: 33 ordinary Animals (including reviewed Pulse tiger), ten Whispers, ten Spirits and one T-rex. Sanctuaries and unverified expansion cards are not Animal entries. Each category keeps exactly three columns at phone/tablet/desktop widths. Sorting uses the actual cube destination terrain (the same `cardRailTerrain` as the right rail): field, rock, leaf, wood, water, building, then Thai name.

Thumbnails and full cards reuse the live `cardFace` renderer in the device's current 2D/3D style. Selecting a thumbnail replaces the dialog body with a viewport-fitted full card; the in-dialog Back button restores the original grid, scroll and focused thumbnail. Escape/close/outside click dismiss the library and return focus to its toolbar trigger. It is entirely read-only and never consumes a game action or reveals deck order/draft membership.

### Result captions and Sanctuary inspection (2026-10-22)

Result model captions and player names remain a single line with ellipsis; full text is retained in titles. Default score illustrations include the four-layer Sanctuary model and Whisper crystal. Completed Sanctuaries and their resident animal types also appear in the final garden models. Owned Sanctuary thumbnails omit their title and open a dedicated large-card info dialog with the existing placement/inspection actions. The shared Sanctuary market trigger is centered above the market. All cards whose terrain rail is field/yellow use grey score numerals, across both sizes and art modes.

### Sanctuary badge and finished-board visibility (2026-10-22)

Generated a new transparent teal-and-gold Sanctuary medallion using the built-in image tool. Original: `assets/source/harmonies/badges-v1/sanctuary.png`; runtime: `public/art/harmonies/badges-v1/sanctuary.webp`; exact prompt/provenance: `sanctuary-badge-v1.json`. Every Sanctuary face displays it at the upper left. Completed Sanctuary faces show the animal-style completion ribbon with `ครบแล้ว · 1 แห่ง` (each distinct tile represents one site).

Animals and Whispers sharing a cap retain equal sizes and their existing left/right anchors, with the animal's depth in front of the Whisper. This also applies to placement previews. The finished message floats over the terrain supply, while results/restart coins float within the owned-card collection. Neither overlay reserves layout height or shrinks the board.

### Full card library and legendary score frames (2026-10-22)

The menu and dialog are now named `คลังการ์ด`. The library includes the four verified Sanctuary tiles in a fifth category, for 58 supported cards total, retaining three columns and large/back navigation. Sanctuaries are read-only references in this popup; no market or placement actions are exposed. Unverified expansion tiles remain excluded.

Legendary Spirits (excluding T-rex) now have a shared rainbow rail with vine and sparkle motifs in both art modes and sizes. Scoring panels still use the terrain-based fill. T-rex keeps its gold rail and orange scoring fill. Spirit and T-rex panels use a curved ornamental silhouette, inset border accents and a decorative foot, with an expanded footer below the final score. Ordinary animal and Whisper score frames remain unchanged.

### Top camera and wide-board controls (2026-10-22)

Entering or re-entering a game, reloading, switching rooms and resetting the camera use the top view. Tilt remains an explicit setting. Boards whose mat is wider than tall (C/D) place their terrain hand and animal choices in a horizontal row underneath the mat. Slots retain fixed footprints; animal choices scroll horizontally if necessary. The fitter uses the full viewport width and reserves only the bottom control strip and normal stack headroom. A/B retain the right-hand controls. Finished-game controls retain their owned-card placement.

Illustrated board models use a white outline shadow; Spirits and T-rex instead use a multicolored rainbow shadow. The effect is scoped to board models, preserving sculpted-mode rendering and tray/card artwork. T-rex score numerals are white in both sizes/modes. Fixed finished-game frames clip off-screen layout overflow from the top-view CSS 3D canvas without changing the board scale.

### Boundary overlays and muted green market actions (2026-10-22)

The Sanctuary market tab sits 6px higher to leave a visible gap above the card tops without changing board size. Claim (+) uses muted forest green with cream details; Solo swap uses pale sage with darker green details. Disabled states remain distinct.

After finishing, the message floats at the centered boundary between the drafting panel and the board viewport. Summary/restart coins float at the midpoint between the mat's bottom and the owned collection's top. On desktop where cards sit beside the board, the label stays inside the board's upper edge and coins sit above the owned cards. These positions follow resize and camera fitting without reserving layout height. The finished drafting panel allows the label to cross its boundary without clipping.

### Compact statistics, first tally and settings (2026-10-22)

Statistics show all players in a compact five-column comparison (player, total, terrain, animals, special categories combined). Details below show one selected player at a time; avatar buttons switch players without changing game state. All individual Spirit/Whisper/Sanctuary totals remain visible in that player's category scores. Garden models occupy one centered row, allowing overlap; captions stay on one line. Category numerals overlay their pieces with a diffuse white text shadow, category names sit below, and hex bases are hidden. Expanded per-card text remains available on demand.

The initial tally uses a single model row with per-type points and compact terrain totals, retaining reveal sequencing, skip/winner flow and timer cleanup. Intro/winner stages use the same compact dialog. Verified six model types and nine category totals without vertical scrolling at 320×667 and 390×844; comparison tables fit horizontally.

Settings groups have internal padding. All three camera buttons fill equal grid cells. Player tabs are omitted for Solo; multiplayer tabs include avatars in two equal columns. Public room code, join link, QR, deck count, expansion modes and board identity are centered inside the collapsed `รายละเอียดห้อง` section. Display-role controls, personal effects/art preferences and access checks remain unchanged.

### Winner summary order (2026-10-22)

The skipped-to/final winner spotlight puts total score and Solo suns together above the model row. Garden models remain centered on a single overlapping row with compact captions. The full-width comparison-table action is the final element, below all models. Co-winner navigation and official Solo sun values remain unchanged. Verified six model types fit without scrolling at 320×667, 390×844 and desktop sizes.

### Full-art Sanctuary cards and low temple miniatures (2026-10-22)

All four verified Sanctuary types use newly generated temple artwork, with separate full-size/small exports and transparent miniature sprites. Original assets remain available. Source images and generation prompts/exports are recorded in `sanctuaries-v2-jobs.json`. Cards use normal rounded rectangular corners, an upper-left special badge, a patterned temple rail and a centered lower token pattern. Names and instructions are outside the card; detail dialogs and the library show descriptions below the artwork.

The central Sanctuary picker shows three garden-sized small cards in one row. Each preview opens its full-size detail; the separate claim action reads `เลือก`. The central trigger has equal top/bottom spacing. Completed Sanctuaries hide their four token sprites visually while retaining geometry anchors, then display the corresponding low miniature. Resident animals anchor to the temple roof; game state, token costs and scoring remain unchanged.

Animal detail models use the same white/rainbow shadow treatment as the board. Earned scores on yellow-rail cards are white over green score sockets, while unearned yellow-rail values retain gray text.

### Sanctuary stack restoration and wide-board trays (2026-10-22)

Completed Sanctuaries on the board now retain the visible four-layer token stack; resident animals anchor to its top cap. Generated temple miniatures remain available for summary displays. Sanctuary card patterns use the same flat-top hex geometry, side depth, token scale and layer spacing as animal cards. The detail claim action is centered, and the market's construction help is always visible rather than collapsed.

Bottom token/animal slots on wide C/D boards are enlarged to 44–60px on compact screens and 64–84px on desktop. Animal trays keep horizontal overflow and horizontal touch scrolling, including the individual animal buttons. Regular-board rails are unchanged.

### Wide-mat height and Sanctuary score panels (2026-10-22)

Active wide C/D mats fill the available height between the drafting panel and bottom trays with only a small gap. Ground cell heights follow the longer mat; terrain and animal billboards retain their original proportions and stacking anchors. Regular boards and completed-board fitting keep their existing behavior.

Every Sanctuary card now has an ornamental score panel showing its two qualifying terrain icons and `3 ต่อช่องติดกัน`. Owned cards additionally show the authoritative current total (`รวม …`); completed cards use a green panel. The same panel appears in small market/garden/library cards and large details. The full wording remains available below the large image and in the panel's accessible label. Scoring rules and state remain unchanged.

### Clear board surface, aligned Spirit draft and tilted default (2026-10-22)

Removed the board's ambient radial haze and raised the drafting panel above the board canvas so wide-board geometry cannot intercept token-group controls. Regular boards center their visible mat vertically in the available board region rather than shifting downward to reserve asymmetric headroom.

New game entry, room changes and camera reset use the tilted camera again. Overhead remains an explicit setting. The Spirit draft has no separate model below the card in either art mode. Card names appear below the image, followed by their descriptions; shared content rows keep `เลือก` buttons aligned even when one name wraps. Transparent, borderless portrait wrappers remove the green strip above 2D draft images. Sanctuary completion ribbons now read `ครบแล้ว(1)`.

### Illustrated first paint and crisp picker textures (2026-10-22)

The early HTML room theme now defaults to the same 2D water background as the running game and preloads that image. A saved explicit 3D preference selects/preloads the forest instead. Base Harmonies CSS also defaults to 2D; only explicit `sculpted` mode enables the forest. Preparing the garden no longer clears its early art preference while waiting for the lazy module.

Picker token images use lossless precolored 256×224 PNG exports from the same color-transferred sources as the SVG card tokens. Pixel colors, alpha and geometry are identical to the card textures; filters no longer rasterize at small picker sizes. Cards and board patterns retain their existing SVG assets, and 3D retains the original PNGs. Removed duplicate squashing and cylinder borders/shadows on image-based selection tokens while preserving hand centering.

### ORIGINAL image mode and board explanations (2026-10-22)

Settings replace the 3D checkbox with three equal, active-state buttons: `2D`, `3D`, `ORIGINAL`. The preference remains local to the device and persists across reloads; it does not change room state, scoring or other players' views. The early loading shell recognizes ORIGINAL and uses the illustrated background.

ORIGINAL draws 43 live card fronts from user-provided PDFs/photo: 32 ordinary animals, ten Spirits and T-rex. One native-resolution PNG is used at every size; printed illustrations, scoring and token patterns are not regenerated or overlaid with new patterns/score boxes. The renderer removes its usual art gradient and preserves the original portrait proportions. Whispers, the reviewed Pulse tiger and Sanctuaries retain their 2D art where no original is supplied. Their rules/decks remain unchanged.

The manifest `original-art-manifest.json` records source hashes, image references, crop rectangles, orientation transforms, native dimensions and output paths. `scripts/extract-harmonies-original.py` recreates the exports with PyMuPDF. The Spirit reference PDF places embedded JPEGs with a negative Y scale; extraction flips image rows to match the displayed PDF, preserving right-side scores and readable digits. The Melodies PDF is used as an image source, without enabling its optional campaign rules.

Source quality is retained rather than invented: 30 ordinary faces are approximately 231×400px crops, two matching ordinary faces have 823×1418px standalone images, ten Spirits are 322×555px, and the supplied T-rex photograph is 970×1680px. Large display cannot recover detail absent from these source images; no AI repainting or upscaling is claimed.

Room details now explain the selected A/B/C/D board. D explicitly allows normal token placement and habitats on brown hatched dry cells, explains adjacent-water irrigation and end-game 2/4/9 tree / 6-point field conditions. C explains the central hole and 8-point buildings requiring four distinct adjacent top colors. A explains river scoring; B explains 5-point islands, including connected empty land. C/D wording was checked against the publisher's Crescendo rules, printed pages 8–9.

### ORIGINAL redrawn card set and cube board markers (2026-10-22)

Replaced the 43 active Original card files with new reference-based imagegen artwork. Each scene follows the supplied card's animals, poses, habitat and palette. Scores, native-style six-terrain rails, token motifs, hex bases and cube destinations are composed deterministically from the catalog into one lossless 900×1550 WebP per card. Small and large cards use that same file. Score numbers and habitat geometry are never taken from AI-generated lettering. Native PDF/photo extractions remain archived as references; 2D/3D sets and unsupported-original 2D fallbacks are preserved.

`original-redrawn-v1-jobs.json` records all 43 built-in image_gen prompts, reference paths, generated-source paths/dimensions, output hashes, scores and patterns. Rebuild vector tokens with `scripts/build-harmonies-original-tokens.mjs`, bake with `npx tsx scripts/build-harmonies-original-redrawn.ts`, and activate only the complete set with `scripts/activate-harmonies-original-redrawn.mjs`. PDF extraction now updates a separate reference map, avoiding accidental replacement of the generated set.

Original board cells, placement previews and animal trays render cubes: gold ordinary animals, white Spirits/T-rex, purple Whispers. Shared occupants retain the existing side-by-side and front/back arrangement. The fitter anchors each cube's actual SVG foot (64/70 of its image height) to the top cap, including three-layer stacks and both cameras. Results still use animal models; other art modes retain their models. Rules, legal actions, server state and scoring are unchanged.

### Individual statistics cells and Sanctuary visibility (2026-10-22)

The full statistics sheet removes the decorative animal row and aggregate animal/Spirit/Whisper cells. A shared four-column grid shows five landscape scores followed by each owned Animal, Spirit, Whisper and Sanctuary with its actual server-calculated points, including zero-point cards. Token images share a bottom baseline in fixed-height frames; names sit beneath the pieces and scores retain the white reading glow. The grid scrolls internally only when its rows exceed the available viewport allowance. The comparison table retains every player and the compact player buttons switch a single visible detail panel. Winner/tally stages retain their own existing presentation.

Owned Sanctuaries appear between unfinished and finished Animal cards. Sanctuary selection uses a brighter jade fill, cream text, gold edge and distinct disabled appearance; its market states the one-tile-per-turn limit. Confirmed the existing server rule independently allows one Animal and one Sanctuary claim per turn; no rule change was necessary. Serialization/reconnect preserves the consumed allowance, and a successful end-turn resets it.
