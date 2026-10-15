# Dracula UI — presentation upgrade

Core engine/generic rooms/projectionsเดิม. หน้าเลือกเกม/เข้าห้อง/ใส่ชื่อ/QR/lobby ใช้ `platform.ts` / neutralplatformtokensร่วมกับCamel. หลังเริ่มจึงเข้าสู่ gothic game theme. ไม่เปลี่ยนบทบาท/abilities/scoring

Reference กระดาน กล่อง และการ์ดที่แนบถูกตรวจแล้ว. Palette midnight/teal/wine/violet/ochre, etched painted gothic figures, city roads and tactile printed cards. ใช้ artworkใหม่ทั้งหมด ไม่มีโลโก้หรือ scanต้นฉบับ. ไทย/ตัวเลข/สัญลักษณ์/ค่ากติกาเป็นDOM

Map fixed5districts, Draculaบน/Helsingล่าง, tokens4คนกลาง, countแวมไพร์อ่านได้โดยไม่พึ่งสี. Publichead round/turn/HP/trump. มือถือcontrolsอยู่ก่อนmap เลือกการ์ด/targets→preview→confirm ไม่บังคับdrag. แต่ละการ์ดมีสี+ชื่อ+glyphและeffecticon, 8illustrationsตามvalues1–8. Hiddenทุกใบใช้backเดียวไม่มีtype/suitmetadata

Persistent board DOM และ WAAPI แยกจาก latest model. Server ส่งการ์ดและผลครบใน revision เดียว แต่ภาพเปิดทีละคู่ตามเขต 1–5: flip 500ms แล้วแสดงผู้ชนะ/ผู้แพ้ เหตุผล และผลต่อ HP/แวมไพร์ 2100ms ก่อนคู่ถัดไป. อ่านผลจาก server เท่านั้น. Ready acknowledgement ของผลรอบเดิมไม่ตัด sequence. Initial/snapshot/reconnect snap; duplicates ignore; gap resync; reduced motion cancel/snap.

การ์ด 2: public draw panel แสดงใบที่เปิดจากกองจั่วต่อทุกจอเมื่ออีกฝ่ายจั่ว. เมื่อวางแทนที่ ไพ่ยังเปิดเผยใน rack และ lastAction ระบุสี/เลข/เขต เฉพาะใบที่เปิดแล้ว. ไพ่ปิดยังไม่เผยข้อมูลเพิ่ม.

จอคอมใหญ่มีแผงคู่ไพ่ข้างเมือง มือถือ/iPad มีแผงคู่ไพ่เหนือเมือง. เขตที่ยังไม่เฉลยซ่อนหน้าการ์ดและผลจากภาพ/assistive technology. ป้ายผู้ชนะเกมแสดงหลัง sequence จบ. ปุ่มพร้อมรอบถัดไป/เล่นอีกครั้งพักเฉพาะ presentation; กด “แสดงผลทั้งหมด” เพื่อข้ามได้. Server ไม่รอ animation. เมื่อชนะก่อนครบ 5 เขต เฉลยเฉพาะเขตที่ server ตัดสินจริง.

ไฟล์: `src/client/dracula.ts`, `dracula.css`, `dracula-motion.ts`, `dracula-assets.ts`; runtimeart `public/art/dracula/` และcovers `public/art/covers/`. Plan/prompt/manifest: `docs/presentation/`, `public/art/presentation-manifest.json`. ผลทดสอบ/screenshotและข้อจำกัดในprogress

## Mobile five-card stands — 2026-10-15

Player views put the board before action controls. Opponent rack stays above the five district columns; own rack stays below, according to the authenticated role. CSS places existing district children in a shared five-column grid, retaining every `data-district`/`data-side` anchor for reveal, swap and resync. At320/390px five cards fit one row with values/effect icons; verbose effects remain in action choices/help. Card aria-labels retain suit/value/effect.

Both racks sit on continuous dark rails with a highlighted lip, recessed front and shadow, following the user's stand reference. Rails are CSS artwork with no pointer events and do not alter hit targets or rules.

During an own discard step, the five own rack cards are native buttons using the existing legal discard-slot actions. Select directly on the stand, then use the fixed confirmation bar. Only the incoming-card discard option is separate below; the old duplicate five-card choice list is removed. Pending commands disable rack buttons and the action panel together; selection is local until confirmation, and server validation is unchanged.

Four painted SVG files in `public/art/dracula/suits/` replace Unicode suit glyphs in card headers, rankings, discard pile, public draws and trump choices. Explicit colors and diamond/sun/clover/star silhouettes avoid platform glyph substitution. Assets preload with existing art. These are code-authored vectors, not raster image-generation output.

Successful own `draw` acknowledgement suppresses only its success toast. Errors/other commands retain feedback. Cards have55% opacity only in a player view while server phase isplaying and turn belongs to the opponent; results/public display remain clear. Reduced motion skips the transition. Engine, protocol, private projections and storage are unchanged.

## City districts and central draw — 2026-10-15 follow-up

The latest reference supersedes the stand rails: remove both overlay bars so card art and compact effect captions remain visible. Five card slots per side retain their original district IDs. A new code-authored `districts.svg` supplies five curved regions with unequal areas and a central opening over the existing city artwork. Labels and four inhabitant tokens per district remain live DOM; clusters use distinct mapped positions around the opening. This is a presentation map, not a change to district order, population or scoring.

Both public and player boards use the same city layout. Players see opponent above/own below; display retains Dracula above/Helsing below. `data-trump` on the board selects an explicit red/yellow/green/purple border from authoritative ranking[0]. No client rules or random outcomes.

The draw button now sits on the central deck. The player's projected `me.drawn` is displayed there only for its owner; otherwise only public `drawn`/`deckTop` can appear, falling back to a shared card back. Effect2 remains public, including on the display. Ordinary opponent draws remain secret. The central incoming-card button selects discard slot-1; own rack buttons select slots0–4, and confirmation uses the existing pending-command/legality path. No extra duplicate incoming card is shown under the board.

Fresh action controls attach before pile information inside the retained motion table, including on same-revision renders. Remove stale controls before attaching so ACK/presence/reconnect cannot duplicate IDs or buttons. Draw and discard handlers/disabled state are rebound for retained nodes. Reveal still targets existing district/card anchors and keeps its dedup/gap/reduced-motion behavior. Center spacing is tested so district labels and tokens do not collide with the deck at320/390px.

## Exposed-card cues and round header — 2026-10-15 follow-up

During play, each own rack card whose server-supplied `revealed` flag is true has a gold frame and an “เปิดแล้ว” badge. The badge sits outside the card's opacity layer, above the effect caption, and stays clear while waiting cards dim. A live summary above the city lists count/5 and exact district numbers. Flags follow authoritative cards through swaps/replacements and reconnect; no new server data or rules are introduced. Results hide this play-only summary, and a fresh deal/rematch clears badges from the new card state.

Round result headers and reveal text explicitly use the existing bundled Noto Sans Thai. The previous Georgia shorthand in the result heading caused a different Thai fallback. The results header now groups title/cause left and ready/skip/status right. Fresh controls attach to the header on every results render, including acknowledgement updates. Keep this header visible during reveal and insert the pair reveal after it; readiness remains gated by the existing motion controller until reveal completes or is skipped. Finished-game controls keep their normal placement before piles.

Desktop reveal grid now gives direct finished-game controls a distinct row after the city and before piles. This corrects the overlapping grid row found while testing skip/rematch after moving the results header. No animation timing, results, readiness protocol or scoring changes.

## Direct board actions and stable rendering — 2026-10-15 follow-up

Playing views no longer have a separate action panel. Reveal-own/reveal-opponent actions target the corresponding legal card buttons. Swap-own selects two own cards and matches their sorted indices against the server's offered action; exchange selects one district on either side and raises both matching cards. Selection toggles locally, cards lift10px, and a floating confirmation bar shows the intent. Confirmation is disabled until the selection exactly matches a server offer. Trump choices sit in the board's ranking row. End-round stays a compact separate button below the city with its legality hint. No effect or target rule was reimplemented in the client.

The Dracula shell now retains the main/header/content nodes like Jaipur. `patchHTML` updates the game headings and preserves the mounted board. Motion also patches its children instead of clearing the table. Stable keyed button wrappers keep card/image DOM mounted when a rack becomes actionable; readonly wrappers stay disabled. Controls use keyed preserved placeholders in their playing/results locations. Pending notices no longer insert a row above the board; disabled controls provide pending protection. Disable scroll anchoring for this theme, retain preventScroll focus behavior, and do not call scrollIntoView/scrollTo in gameplay code.

Draw animation is detected from contiguous authoritative draw-to-discard state plus a one-card decrease in deck count. It slides/lifts the central card for520ms even if effect2 had already exposed the same face. A persistent held/deck label distinguishes “จั่วแล้ว” from an exposed top card that has not been drawn. Duplicate/snapshot/gap/reduced-motion delivery retains the existing animation policy; no client random outcomes, delays to state, or replay of past draws. Opening a newly public rack/deck card uses a transform flip. Reserve verdict space to reduce height changes between round-reveal pairs.

Four token positions per district now use authored percentages across that district's whole mapped area, rather than a small cluster. Coordinates remain deterministic presentation data and keep labels/counts and the central opening separate. No population, district mapping, private data, state storage or networking changes.

## Stationary phone results and readable locked eights — 2026-10-15

Remove the remaining state-message scrollIntoView callback (discard/rematch). On player screens the result header and its single ready control float at the bottom; paired reveals float above the board, without adding/removing height above it. Finished-game controls also float at the bottom. Keep the previous table height through results to prevent browser scroll clamping when action controls disappear. Retain the exposure-summary row through results. Readiness remains gated until the reveal finishes or the player skips it; authoritative acknowledgements and restart permissions are unchanged. Shared displays retain their existing result layout.

Disabled discard choices retain full card opacity and saturation. An own-turn eight blocked by the six-discard prerequisite shows a small “ทิ้งไม่ได้” badge on the rack, or an explicit explanation below the central card. Native controls remain disabled and only server-offered actions can be confirmed. Out-of-turn cards still dim as before; blocked network/pending actions are not mislabeled as an eight restriction.

Browser regression checks cover both incoming and rack eights, unchanged scrollY through round/game completion, visible ready controls, sequential reveals, reconnect, reduced motion and fresh rematch state. Phone layouts are tested in Chromium, not physical Safari or TV hardware.

## Default effect targets and centered modal reveal — 2026-10-15

Each new effect step copies the first complete target set offered by the server into local selection: own reveal, opponent reveal, own two-card swap, same-district exchange and trump change. The cards/colors highlight immediately and the sticky confirmation describes both the operation and the affected side. Players can change/deselect targets before confirming; nothing is submitted automatically. Effects without a target continue to resolve on the server. In particular, card2 still reveals the deck top; card3 reveals an opponent card (clarified with the user).

All screens now show paired round reveals in a native modal dialog centered in the viewport. Its backdrop dims/blurs the page, native modal behavior makes background controls inert, and root overflow is locked until the dialog is removed. The dialog owns the skip button; Escape also skips the presentation. Remove the dialog and restore prior focus with preventScroll on completion, skip, resync, room exit or reduced-motion cancellation. The old display side column is no longer needed. Result snapshots show the settled state without replay.

After the dialog closes the city/racks remain dim and a centered result panel contains the existing single ready button (or host restart/waiting controls for a finished game). Preserve authoritative readiness, permissions, privacy and the existing sequential timing. Modal screenshots use viewport capture, since full-page capture resizes the viewport and changes native dialog focus/layout.

## Turn cues, larger inhabitants and health at the deck — 2026-10-15

Inhabitants are now26px on phones and32px on larger screens, retaining four authoritative tokens per district. Move district3 tokens to the sides of its central corridor and reserve a300px minimum city field so the larger tokens, district labels and health/deck stack remain separate at320/390px. No district populations or ownership rules change.

The central deck includes the live Dracula HP directly above its card. The reveal controller updates this single board-health node as each district resolves. Remove the duplicate top-board HP block. Only the acting player's enabled draw step has the gold deck cue and a gentle repeating vertical card animation. Waiting players read whose draw it is; held cards stop the invitation. Reduced motion retains the static cue without animation. The draw caption uses the bundled Thai font, generous line height and vertical padding to preserve above/below glyphs.

Board-side captions identify the opponent at the upper left and the authenticated player's faction at the lower right (public display: Dracula above, Helsing below). A gold border spans all five cards of the active faction, with an explicit playing label. Trump color remains the separate city border. No identity or private-card projection changes.

Generic successful-command “ทำรายการแล้ว” toasts are removed for every game. Error feedback and explicit copy-link feedback remain. Acknowledgement cleanup, retries, pending actions and state updates are unchanged.

## Board-local settlement, exact district placement and faction rows — 2026-10-15

This supersedes the viewport-modal and centered-viewport settlement design above. Paired reveals are now an absolutely positioned layer inside the city board, with blur confined to that board. The layer moves with the board; no native dialog or document scroll lock. Skip/Escape and snapshot/reduced-motion cancellation still finish the local sequence. Ready/restart/waiting controls occupy the deck card itself, without covering inhabitants. Only the final winner banner stays fixed at the top.

Remove duplicate faction panels above the board. Each faction has a single board-edge row containing its original character icon, faction, player name, connection/turn state and own/opponent identity. Dracula HP precedes that row, below own cards or above opponent cards as appropriate. The live reveal resource counter updates the same unique HP element. Center the action header and show four suit colors separated by arrows, without ranking prose.

District3 population was incorrectly spread beyond its narrow upper boundary when moved sideways in the previous iteration. Place its four centers at(42%,82%),(58%,82%),(39%,94%),(61%,94%) of the300px city field; put its label at90%. Adjust three neighboring marker positions to keep their entire circles within their paths. Browser tests load the exact SVG and check center/cardinal points against the assigned district path using isPointInFill at320/390px, in addition to existing deck collision/overlap checks.

No rule change for card1: replacing a revealed slot with a hidden drawn card does not expose the new card. Discarding1 opens exactly one selected own card. An incoming card already exposed by2 retains that state on placement, independently of the discarded card's effect. A public incoming card now has an explicit “เปิดจากกองจั่วแล้ว” note. Regression tests cover private/public incoming1 replacing an exposed slot, selection and display projection. The official Mandoo2023 rulebook (Asmodee Italia PDF, extracted with PDFKit) describes persistent card visibility and demonstrates exposed deck-top placement on pp8–9.

Faction-row connection/name text is refreshed independently after motion updates, including same-revision presence events. Moving these labels into the retained board otherwise left them stale when the motion controller intentionally ignored duplicate game revisions. This refresh does not touch card DOM or HP during a reveal. Docker reconnect coverage uses the new row's disconnected text.
