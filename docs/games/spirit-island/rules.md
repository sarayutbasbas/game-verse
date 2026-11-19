# Spirit Island — base game 2017, current official clarifications

Primary sources: [Greater Than Games product and linked rulebook](https://shop.greaterthangames.com/products/spirit-island), [official FAQ](https://querki.net/u/darker/spirit-island-faq/), and publisher-licensed [Dized rules](https://rules.dized.com/game/zuxKPAGpQWaqnMZgld8YBg). The 32-page printed rulebook has been downloaded/rendered and its gameplay pages read with native Vision OCR plus visual inspection. Reference card scans are used solely to check symbols and costs; none are shipped as generated art.

Scope: 1–4 players, true one-Spirit Solo, eight base Spirits, 32 Unique/36 Minor/22 Major Powers, 15 Fear cards and two optional Blighted Island cards. Balanced A–D island boards, no Adversary, Scenario, expansion, aspect or event deck. Beginner setup optionally uses the four printed Power Progressions and no Blight Card. Source card facts from the official wiki are cross-checked against card images; notably The Land Thrashes in Furious Pain targets a land with Blight, not Dahan. Thai text and all shipped illustrations are newly made.

Growth → income → paid card play → Fast Powers → Blighted Island → earned Fear → Ravage → Build → Explore → advance Invader cards → Slow Powers → Time Passes. No player may interrupt another unresolved Power. Players choose legal targets at resolution, not when paying for cards. Fast effects cannot be delayed until the Slow phase. Elements apply while a card is in play even if unused; they are not spent. Innate thresholds are evaluated from current elements. Repeating does not grant elements or card plays, and repeat instructions do not recursively repeat.

Fear pool is four per Spirit; nine random Fear cards arranged 3/3/3. Terror changes immediately when a divider is revealed. Destroying Town/City generates1/2 Fear; removing/replacing does not. Victory conditions are no Invaders / no buildings / no Cities / all Fear cards earned. Losing conditions are no Presence for any Spirit, exhausted Blighted Island pool, or needing to Explore with an empty Invader deck. A single effect producing victory and defeat is a sacrifice victory. Invader deck consists of3/4/5 randomly selected stageI/II/III cards, with an initial Explore followed by its card placed in Build. No adversary escalation occurs.

Ravage damage is1/2/3 per Explorer/Town/City, separately to land and Dahan after defense. Two or more damage adds exactly one Blight. Dahan damage must be allocated efficiently; survivors counterattack for2 each even if defense reduced invader damage to zero, unless the Ravage action was skipped. Dahan do not absorb land damage. Build adds a City when Towns outnumber Cities, otherwise a Town, and does nothing without Invaders. Explore adds one Explorer in matching lands adjacent to ocean or a building source (or containing a building).

Use the official additional-one-Blight correction: no-card pool5×Spirits+1, Healthy-card pool2×Spirits+1. Flipped card receives its printed4×/5×Spirits and never flips healthy again. Setup Blight comes from the box and causes neither cascades nor Presence destruction. Later added Blight destroys one Presence per Spirit in that land and cascades if the land already held Blight; the responsible player selects the next adjacent land. Damaged pieces heal and temporary effects end when Time Passes.

Invaders are unlimited. Dahan are limited to36. Each Spirit has13 Presence; destroyed Presence stays destroyed except explicit recovery or Green's growth rule. Town/City damage persists within a round and a replaced piece retains damage. Only its controller gets a hidden hand or a four-card gain offer. Future shuffled decks, unused cards and unrevealed Fear/Blight information are not sent to any player or display. Public played cards, discard piles and island state remain public. The existing authoritative room, receipt, reconnect and persistent-store protocol is reused.

This document is the implementation contract. Verification evidence and any final scope clarifications belong beside it, not in invented official rules.

## Island layout and presentation

The web board uses a valid long-island arrangement, alternating top-to-top and bottom-to-bottom joins between balanced boards. These joins use the physical board edge intervals, including corner adjacency. It is **not** labelled as the illustrated standard setup; the official Setup FAQ notes that top-to-top joins can be slightly harder. The UI draws actual adjacency links and gives the full neighbor list, including cross-board neighbors. Positioning a tile nearby on the screen never creates a game adjacency.

The default first game has no Blight Card and uses the printed Power Progression for the four low-complexity Spirits. Others use the normal four-card gain. Printed progression cards are reserved outside the common draw decks while that progression is active. Gaining a Major always requires forgetting, including gaining through a progression.

## Implementation details checked against the FAQ

- Harbingers produces at most one Fear, in the **origin** target land, if any pushed Dahan enters a land with a Town/City.
- Gift of Living Energy checks the caster's two Sacred Sites, and adds one for targeting a different Spirit; it does not count raw Presence.
- Blazing Renewal restores the recipient's **destroyed** Presence to one legal land within two of the caster, rather than returning Presence to tracks.
- Entwined Power gives the target the initial gain, then the caster a leftover card, and permits each to give the other a card. Combined Presence applies to targeting only.
- Talons destroys one Town in **each** adjacent land when thresholded. Tsunami's extra coastal lands each gain one Fear.
- Vengeance groups deaths from the same action, cannot trigger itself, and remains owned by its caster for Bringer's modifier.
- Concealing Shadows protects Dahan only against Ravage; Infinite Vitality's threshold protects against other damage/destruction as well.
- Damage inherited when replacing a piece is real damage; replacement itself creates no destruction Fear, but an over-damaged replacement is immediately destroyed normally.

All illustrations are newly generated theme interpretations. Card names, numerical facts and effects are implemented as static definitions, with Thai rules copy rendered in HTML; images do not determine rules or carry machine-readable state. No external art or rule-data service is required during play.
