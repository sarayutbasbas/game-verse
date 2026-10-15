# Jaipur visual and interaction plan

Reference inspected: user's2019 box and market spread, plus newer stylized card/token photo. Take jewel-tone market palette and tactile cards/token stacks, not original logo/merchant portrait/art. Use existing 2D DOM/CSS/WAAPI, no new runtime dependencies/3D renderer.

Tokens: saffron canvas #efc36a, midnight indigo #25294b, ruby #b73344, peacock #116b6d, brocade purple #784b92, warm paper #fff0ce. English Jaipur title Georgia; Thai gameplay existing Thai font stack. Numbers tabular. Main focus five market cards on a cloth tray, a single six-column goods bank above, bonuses/camel in its second row, deck at the left (discard kept in state, omitted from the table). Two merchant areas show seals/card backs; exact herd counts public by the user-requested web variant, money owner-only. Phone puts market, action tabs and own hand together, with private receive/return exchange and sticky confirmation. Artwork dominant, quiet typography and counters; decoration does not compete with tokens.

Asset inventory from finite catalog:7 card faces (diamond/gold/silver/cloth/spice/leather/camel), universal card back,6 goods medallions, one common bonus back per category (same artwork, category rendered by code), bonus face neutral art with code value only after award to owner/scoring, camel medallion, victory seal, portal cover and woven table texture. No value-specific hidden filenames or textures. Reuse identical card face for each copy of same good; every physical card/token has stable engine ID but hidden IDs never used as asset URLs. Cover new original art, no original product scan in runtime.

Generate two atlases (8 card illustrations and component cutouts), plus a portrait cover. Save source in assets/source/jaipur and WebP runtime in public/art/jaipur; dimensions appropriate for thumbnail/mobile and enlarged inspection. Backdrops use original textile, render text/value/symbol overlays in code, local SVG fallback. Inspect generated grid/alpha boundaries to avoid neighbour artifacts. Version asset URLs because domain Cloudflare caches static images.

Preview is browser-local, never network state. Server supplies single/sale offers plus compact exchange mask tuples for exact valid combinations; UI matches selection to those offers, does not compute hidden outcomes or game legality independently. Client does not import engine. Accepted revision/event drives movement/reveal/seal only; private/opponent hand movement uses uniform card backs. Snapshot/duplicates/gaps skip history; gap requests sync; reduced-motion skips effects. Animation completion may remove only visual clones.

Implemented mapping: [asset-map.json](asset-map.json). Original source PNGs and crop provenance are in `assets/source/jaipur/README.md`. Preparation script outputs384×512 card faces,200×200 transparent medallions,640×960 cover and480×640 textile; runtime total about1.1MB. Final UI uses a centered fixed confirmation only for a valid own-turn draft, reserved footer spacing and focus scroll margins. Hand is always grouped by the catalog GOODS order using stable card IDs, without changing server hand/deck/market order. Snapshot/preload callbacks cannot redraw a page after leaving the Jaipur theme.


## Compact table and settlement UI (2026-10-15)

The shared in-game header puts room invitations in a “ข้อมูลห้อง” popover and has one turn chip plus a 44px sound icon. A persistent live region announces accepted turn boundaries once, including Solo/extra turns; setup/parallel settlement uses the actual phase. Lobby invitations are unchanged.

Jaipur keeps its live table/hand DOM using a small keyed native DOM patcher (no framework dependency). Selection never scrolls the viewport. Goods selections choose take/exchange by count; all market camels form one distinct take action. Returns clear when reducing to one good; only confirmation sends commands. Superseded by the later open-herd request below: both herd counts are now public. The six goods slots remain present when exhausted and show text “หมด” without an old image/value. Inspecting a pile shows its remaining public values. Bonus backs never encode hidden values.

A native modal dialog plays a cancellable presentation timeline: seat 0 goods, seat 1 goods, each seat's bonus, each seat's camel award, then server totals/verdict. No timer changes the authoritative phase, score or seal. The immutable public result remains in the main table after local dismissal. Reduced motion, skip and reconnect go directly to final totals; latest result can reopen without recounting. Dialog lifetime is outside the patched game tree, preventing duplicate deliveries/ACK/presence from restarting counters. Storage records seen/dismissed by room + server-assigned persisted match UUID + round. Legacy saves without UUID use their immutable first settlement as a fallback identity; no existing room is reset. Starting a fresh match clears local old overlay when the new state arrives. No hidden data is added to projections.


## Open herds and denser play area — 2026-10-15 follow-up

User explicitly requested exact herd counts for both players. The server now projects `PublicTrader.herdCount` from the authoritative herd length, including zero in lobby. Herd identities remain private. UI uses that number for both phone and display, draws up to ten overlapping 36×44px camel cards, and shows `+N` beyond ten on the last card (the finite base deck permits only +1). No new game-state fields, shuffle/scoring changes, migration or service.

Jaipur removes only its visible shared turn chip, preserving the accessible live announcement and the other five games' header. Current seat is indicated by a full teal border. Seat panels put hand count, earned token counts and one seal/count badge in a compact bottom row. Action tabs are small touch buttons beside the current action title. Mobile hides the deck and dedicates the market to five face cards; market card feet are omitted visually. Display goods use a three-column/two-row bank, showing every remaining token/value in a single overlapping line per good, with internal scrolling only at very narrow display sizes. Phones retain one compact six-column bank.

Selecting two or more market goods defaults returns to as many owned camels as needed (minus any already selected hand returns). +/- can adjust this draft; hand cards may be returned instead. Default is a convenience, not a submitted command or relaxation of server legality/hand cap. Choosing one good again clears exchange returns. Cancel reads “ยกเลิก”.


## Table-side identities and winner presentation — 2026-10-15 follow-up

The later request supersedes the ten-card/+N presentation cap: draw every camel (the finite catalog has eleven) in the same compact overlapping stack. Table corners now share the small bottom-corner radius. The earlier two profile panels above the bank are removed. A framed opponent strip sits immediately above the market with profile/stats left and herd right; the own strip below mirrors it, uses a larger avatar/type, and retains server-turn highlighting. Public display uses stable seat0 above/seat1 below. Stable player IDs and handback targets remain available for motion/projection updates.

Phone goods show remaining count first, coin/name next, smallest minimum-sale text last; the color divider is8px. The public display retains the full three-column/two-row bank.

Results use `jaipur-identity.ts` for fixed seat numbers and owner marker, matching winners strictly by server player ID. Both the persistent score table and final popup identify the winning row with a gold border/crown; the popup also frames/crowns the winning avatar. Crown/portrait emphasis appears after counting finishes (or immediately for a final snapshot). Identical names cannot transfer the crown to the other player. Tied results have no winner/crown. No score, seal, phase or game rule changes.

Avatar selectors use the actual shared `profile-avatar` class: opponent30px, own38px; popup36px and persistent result-row28px. This keeps the own seat visibly larger and prevents an inherited48px profile size from crowding small screens. The duplicate-name fixture checks both player-ID winner attribution and seat orientation/relative avatar sizes at320/390px.


## Waiting-turn feedback and clean merchant panels — latest follow-up

Phone views derive `jp-waiting` only from authoritative playing-phase turn vs own player ID. Every card is at55% opacity while waiting, returns to full opacity in the own turn, and the public display remains clear. Preview/command legality is unchanged; existing wait copy and seat border provide text/context alongside the dimming. Reduced-motion keeps the existing transition override.

Merchant panels now have a clean avatar/name/seat/connection header and four labeled resource cells: hand, goods-token count, bonus-token count, seals. The hand cell uses a single card-back icon plus a separate numeric count in normal flow, removing the miniature fan and absolute counter collision. A scoped grid uses four cells when the profile has208px and two columns on narrower screens; the base two-column layout remains usable without container-query support. Camel captions no longer repeat the adjacent profile name. Narrow the old own-herd `b` styling to only the camel-count badge, so it no longer styles/expands profile numbers. Keep opponent-above/own-below, larger own avatar and current-seat border.


## Fixed seat halves — 2026-10-15 follow-up

Each seat strip now has two equal `minmax(0, 1fr)` columns. Opponent profile stays left/herd right; own herd stays left/profile right. Both occupy the full assigned half with no profile max-width. Counts from zero to eleven no longer change the allocation. Resource cells may still adapt to viewport width, independently of herd count. Below 361px, camel overlap steps shrink from12px to9px so all eleven36×44px cards fit the fixed half at320px without truncation or overflow. Existing waiting opacity, current-seat border, own avatar emphasis and authoritative state are preserved.


## Single-row merchant summary — 2026-10-15

The latest compactness request supersedes the earlier two/four-row resource cells. One shared bordered panel beneath the avatar/name contains all four statistics in a fixed single row, with quiet vertical separators and no individual boxes. Labels are9px and values12px, fitting the fixed50% profile at320px without wrapping. The summary panel is42px high; the four cells remain normal-flow text. Remove container queries because herd count and viewport must never add a second stats row. Preserve all values, current-player border, full camel herd and the50/50 allocation.
