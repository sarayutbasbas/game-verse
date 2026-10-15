# 7 Wonders Duel — base game (Repos Production / Sombreros, 2015)

Scope: exactly 2 players, no Pantheon/Agora/promos/solo. Implemented in the shared registry; exact executed validation and limitations are in docs/progress.md.

Primary sources inspected 2026-10-15:
- Publisher [rulebook](https://cdn.svc.asmodee.net/production-rprod/storage/downloads/games/7wonders-duel/en/7du-rules-us-15990558193s5I6.pdf), 20 pages.
- Publisher [helpsheet](https://cdn.svc.asmodee.net/production-rprod/storage/downloads/games/7wonders-duel/en/7du-en01-helpsheet-15992105300NB8Y.pdf).
- Publisher [FAQ](https://www.rprod.com/en/7-wonders-duel/faq), base-game entries only.
- [Publisher product page](https://www.rprod.com/en/games/7-wonders-duel).

Components: 23 Age I, 23 Age II, 20 Age III, 7 Guilds; 12 Wonders; 10 Progress; 4 military tokens; 19-space track; 31 physical coins (digital bank unlimited denominations). Discard three unseen from each Age; add three of seven unseen Guilds into remaining 17 Age III cards. Each Age deals 20 cards. Each player starts with 7 coins. Five random Progress tokens public, five in box.

Choose starting player before setup. Wonder draft: reveal four; starter picks one, opponent two, starter remaining. Reveal another four; opponent picks one, starter two, opponent remaining. Four unchosen Wonders remain hidden in box. Each has four Wonders. The starter begins Age I.

Layouts are a graph shared by engine/UI, transcribed from rulebook p20: I rows 2/3/4/5/6; II 6/5/4/3/2; III 2/3/4/2/4/3/2 with central gaps in rows 4 and 5. Alternating face-up/down, first and last rows up. A card is accessible when no remaining child overlaps it. Newly accessible cards turn face up after a play. Face-down identities and setup discards never leave server. Building catalog transcribed visually from pp18–19, not generated images.

One accessible card: construct building (pay cost), discard (2 + own yellow buildings coins), or bury under an unbuilt owned Wonder (pay Wonder cost; sacrificed card grants no effect). Buildings with same name cannot be built twice, including free discarded-card construction. No undo. Discard pile consultable by both players. Total seven built Wonders maximum; remove eighth immediately.

Production is reusable each turn, never consumed inventory. Fixed brown/grey + flexible yellow/Wonder production may cover costs. Buy missing resources from bank at 2 + opponent brown/grey symbols of that resource; ignore opponent yellow/Wonder production. Reserves/customs set unit price to 1. Pay printed coins too. Matching chain makes whole building free. Architecture reduces Wonder resource requirement by two; Masonry similarly for blue. Cost calculator must minimize total coin payment across flexible production and rebates. Economy transfers actual resource trade spending to opponent, not printed coin costs. Urbanism awards 4 only for chain construction.

Military: shields move pawn towards enemy capital (9 away); crossing distance 3/6 on either side triggers that side's 2/5-coin loss once; cannot go below zero. Strategy adds one shield to future red buildings only. Capital ends game immediately. Science: six distinct symbols wins immediately; each pair grants a choice of remaining board Progress. Law grants seventh kind. Empty board does not invent a token. Great Library randomly offers three box tokens **privately** (FAQ); chosen token public, other two returned unseen. Persist pending choices without advancing turn.

Effects catalog: Agriculture +6 coins/4 VP; Architecture rebate; Economy trade receipts; Law science; Masonry rebate; Mathematics 3 VP per owned token including itself; Philosophy 7 VP; Strategy shield modifier; Theology future Wonders replay (does not double innate replay); Urbanism +6 coins and chain bonus. Guilds use max of entire cities, with Shipowners combining brown+grey from one city; relevant guilds give coins once on build and points at end. Builders 2 per max built Wonders; Moneylenders floor(max treasury /3), no initial coins. Yellow card income counted at build including newly built yellow itself.

Wonders: Appian Way +3 coins / opponent loses3 / replay /3 VP; Circus Maximus destroy opponent grey /shield/3 VP; Colossus 2 shields/3 VP; Great Library private token choice/4 VP; Great Lighthouse flexible raw/4 VP; Hanging Gardens +6/replay/3 VP; Mausoleum construct one discarded card free/2 VP; Piraeus flexible manufactured/replay/2 VP; Pyramids9 VP; Sphinx replay/6 VP; Zeus destroy brown/shield/3 VP; Artemis +12/replay. No valid target means no invented target/effect. Resolve choices and effects before next turn. Last-card replay expires at Age end.

At Age end, weakest military chooses either starter for next Age. Neutral pawn: last active player chooses (p11, helpsheet). End III: sum printed building/Wonder/token points, guilds, treasury floor(coins/3), military 0 at neutral, 2 at distance1–2, 5 at3–5, 10 at6–8 for advantaged player. Tie: most blue building VP, then shared victory. Military/scientific supremacy interrupt immediately; no further play.

Validation status and exact tests are recorded in docs/progress.md. Wonder costs verified visually against [Asmodee USA product gallery](https://store.asmodee.com/cdn/shop/files/SEV07-prodimages-image5_2000.jpg), all twelve cards. No remaining rule-data blocker identified.
