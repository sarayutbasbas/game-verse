# Trio — Cocktail Games edition

## Scope and sources

Implements Trio by Kaya Miyano, Cocktail Games, 36-card 1–12 edition: individual 3–6 players, Simple and Spicy, and the official two-person-team variant for four/six players. This is not an implementation of Nana's different deck preparation or another mathematical game also named Trio.

Primary sources:

- [Cocktail Games product/download page](https://www.cocktailgames.com/jeu/trio/).
- [Official French booklet](https://www.cocktailgames.com/wp-content/uploads/2022/11/trio_regles_BD.pdf).
- [English booklet distributed by the publisher-authorized BGA adaptation](https://static.boardgamearena.net/data/rules/trio/trio_EN.pdf). Both PDF pages were extracted locally and rendered with native PDFKit; individual setup/play and team rules were read and visually checked.
- [Publisher's official FAQ](https://www.cocktailgames.com/nos-jeux/trio-faq/), resolving inaccessible middle-of-hand cards, repeated endpoint requests, immediate mismatch termination, no additional turn after collecting, empty hands and team swaps.

No rule decisions are outstanding. The extra web review/continue step only preserves already revealed information long enough for humans to see it; it does not permit another reveal or another turn after a mismatch/trio.

## Setup

Use all 36 cards: three identical copies of every rank 1 through 12. Shuffle with server randomness. Individual deal: 3 players get 9 each with 9 in the middle; 4 get 7 each with 8 in the middle; 5 get 6 each with 6 in the middle; 6 get 5 each with 6 in the middle. Center cards keep stable numbered positions. Each hand is sorted numerically and visible only to its owner. The first player is the person who most recently ate avocado; the lobby offers a first-player selector rather than pretending to determine that information automatically. Turns proceed in seat order clockwise.

## Reveal and collect

The current player reveals one card at a time, either a hidden occupied center position or the lowest/highest remaining card of any player's hand, including their own. They can repeat the same request. Only one copy comes out each time, even when multiple endpoint copies have the same rank. A middle hand card may never be selected directly. Request resolution is automatic on the server so a requested player does not need an extra confirmation tap.

If the second card differs from the first, or the third differs from an identical first pair, the turn ends immediately; further reveal commands are illegal. Display the result until the actor or authenticated display owner presses the continue button. Restore every hand card to its owner's sorted hand and every center card to its original position, then advance clockwise. The UI intentionally provides no durable failed-reveal rank history or remembered-rank markings; the memory challenge remains the same as at the table.

Three equal revealed ranks form a trio. Remove all three permanently and add the rank to the current player's collection (or shared team collection). The actor does not receive an extra turn. The review screen shows the successful cards, then the next player acts. An empty-handed player still takes their turn and can use other hands/center cards. Holding an unexposed trio, including three 7s trapped inside a hand, grants no win.

## Victory

Simple: any three collected trios. Spicy: two collected connected trios. The printed connection numbers correspond to these pairs: 1↔6, 1↔8, 2↔5, 2↔9, 3↔4, 3↔10, 4↔11, 5↔12 (sum or absolute difference 7). The new code-rendered card corners retain those connections. The gold 7 has no connected ranks and collecting its trio wins immediately in either mode. A winner is declared on the third matching reveal; there is no opportunity for a later simultaneous opponent claim.

## Team variant

Four players form two pairs; six form three pairs. Partners sit opposite. The lobby uses join/seat order: for four seats, 1+3 and 2+4; for six, 1+4, 2+5, 3+6. It previews the named teams. Deal the entire deck evenly, with no middle cards (9 or 6 per player).

Before play, all teams may each exchange exactly one card per partner. Both choose secretly; exchange commits atomically only once both submit, then both hands are re-sorted. Either partner can decline, canceling that team's opportunity. One partner cannot see the other hand or card choice before the exchange; only their own hand/offer is sent privately. Public progress indicates readiness, never selected identities or values. Waiting offers persist across reconnect/process recovery.

After a non-winning trio, only the opposing team(s) may make a new exchange before the next clockwise turn. The collecting team does not exchange then. A pair with either hand empty skips the exchange. Trio collections and victory conditions are shared by both partners; both are listed as winners. The game displays the official communication restriction: no card-related signals or conversation between partners outside permitted exchanges. No partner chat or extra signaling mechanism is provided.

## Authority, projections and persistence

The independent engine owns shuffling, endpoint selection, matching, source restoration, collection, team exchange and victory. It accepts an authenticated actor, validates exact action shapes/turn/phase and clones only after validation. No client-supplied ranks, card identities for reveal, scores, teams or outcomes are trusted. Swap IDs must belong to the selecting player's hand.

Public state includes only hand counts, publicly collected ranks, team IDs/progress, center slot occupancy and currently faceup cards. It excludes private hands, center-card identities when hidden, physical copy IDs, pending swap cards and future order. Player projections add only their own sorted hand, own pending offer and authorized actions. Hidden hands remain private after game end. Events never preserve failed-reveal ranks. For team victories, the internal collection belongs to the team's first seat, while public projections show the shared collection to both members.

The existing room service provides account-bound sessions, revision/dedup handling, authenticated display management, reconnect and SQLite restore. Validation conserves all 36 unique physical cards, collected trio ownership, table positions, sorted hands, phase/outcome coherence, team eligibility/offer membership and win conditions. Owner-only restart preserves room membership and Simple/Spicy/team settings while creating a new random deal.

## UI and original artwork

Phone controls separate center reveals from requests with two tabs. Endpoint requests are labeled ต่ำสุด / สูงสุด, and only the owner's two end cards are actionable in the private hand. A local hide-hand control affects presentation only and survives reload; server privacy does not depend on CSS. The shared display shows the center and all player status/collections with no private hand values. Menus provide rules, the complete 12-rank/36-copy library, collections, room QR, restart and exit. Thai text and large numerals are rendered as HTML for sharpness. Native dialogs support Escape, labeled close/back buttons and focus restoration; reduced motion is honored. Vertical scrolling is permitted, horizontal overflow is checked at 320px.

All 17 assets were newly generated with the built-in image tool, inspired by the supplied box's Mexican papel-picado visual world: 12 distinct colored face backgrounds, one common back, transparent 3D box, table backdrop, trio token and avocado crest. The numerals and exact connected ranks are overlaid by code rather than trusting image text. Final 900×1200 card backgrounds and all other runtime exports are in public/art/trio/. Prompts, source masters and outputs are listed in assets.json; high-resolution masters remain local/ignored under assets/source/trio/.
