# Castle Combo — คอมโบคนปราสาท

## Edition and primary sources

Base 2024 Catch Up Games edition: 78 distinct cards, 39 Castle and 39 Village, 2–5 players, nine turns each. Excludes Out of the Oubliette and promos. Sources:

- [Publisher product/download page](https://catchupgames.com/nos-jeux/chateau-combo/).
- [Official English booklet, mirrored PDF](https://bghub.org/r/castlecombo.pdf), twelve pages, © Catch Up Games 2024, Grégory Grard / Mathieu Roussel. All pages read; setup, icon definitions and final scoring checked.
- [Publisher's two-page icon aid](https://catchupgames.com/wp-content/uploads/chateau_combo_aide_jeu_fr.pdf).
- [Publisher-credited Game Park adaptation](https://game-park.com/en/board-games/chateau-combo) and its [card-characteristic reference](https://github.com/gamepark/chateau-combo/blob/main/rules/src/material/CardCharacteristics.ts). Used to transcribe factual costs, shield multiplicities, messenger icons, effect quantities and scoring conditions for all 78 cards, not to import its framework or runtime engine. The independent engine, validation, projections and UI are repository-native. Thai ability/scoring copy is generated from those mechanics. Shield counts are checked against the official booklet: Castle 14/12/11/8/7/0; Village 1/5/6/10/11/20 for nobility/faith/scholarship/military/craftsmanship/peasantry.

## Setup and turn

Shuffle the two decks separately. Reveal three cards per market. Messenger starts at Village. Each player starts with 15 Gold and 2 Keys. Select the first player randomly unless the host explicitly selects a seat in the lobby. Seats proceed clockwise. Gold and Keys are unlimited counters.

Before recruiting, a player may spend one Key, at most once in that turn, either to move the Messenger to the other active market or discard the entire current market and refill it. Discards remain public. Buy exactly one card from the Messenger's market, paying printed cost minus all applicable existing discounts, minimum zero. A new card's own discount never reduces its own purchase price.

The player may instead always take a card facedown for free, even when a faceup purchase is affordable. Gain 6 Gold and 2 Keys. A facedown card has no banner, shields, ability, messenger movement or scoring scroll. It still occupies a space and counts for occupied/empty-space conditions. Its identity is masked in reconnect/public tableau projections; taking a market card is a public event as at the table.

Immediately place the new card orthogonally adjacent to a previously placed card. The first card uses arbitrary origin (0,0). Relative positions remain fixed; add new rows/columns in either direction as long as all cards fit a three-row, three-column bounding box. Do not force the first card into a predetermined final corner. No rearrangement, overlap or rotation actions exist.

Resolve its immediate effects, counting its own shields/banner except for discount timing. If a banner carries a Messenger icon, move to the indicated other location after all ability choices are resolved. Facedown cards do not move it. Refill both markets to three. Next player acts automatically; no extra end-turn button.

## Abilities and choices

Six shield types retain multiplicity: a double shield counts twice. Count only faceup cards for printed cost, banner, shield, purse and discount conditions. Card-count conditions count cards, not individual shields. Sets consume the specified multiplicities. Row-and-column conditions use a union so the intersection card counts once. Opponent gains affect every other player. Neighbor effects let the player choose the immediately seated left or right neighbor; two-player games have only one distinct neighbor and resolve automatically. The interface does not silently force the larger neighbor reward.

Choose-between effects require an explicit choice. Discard-market effects select a currently available card in the specified market and award its printed cost in Gold or Keys, without applying discounts. Refill happens after ability resolution. Banker chooses between filling all purses by 2 bank Gold and taking 3 Keys. Other fill-by-2 abilities count the newly placed card and never exceed purse capacity or spend the player's Gold. Steward fills two existing purse cards to capacity (or all if fewer are available); when more than two have space, the player chooses the pair explicitly. Automatic selection is not forced.

An exhausted draw deck reshuffles its own public discard. If that still cannot refill its market to three, remove the remaining market cards from the game and close that market permanently. Move Messenger to the remaining market. It can no longer switch locations through Keys/card icons, but the remaining market can still be refreshed with a Key. Tableaus already recruited from the closed location remain in play.

## Final purses, scoring and ties

After all players have nine cards, each may distribute remaining Gold into their faceup purses up to their remaining capacities. Gold already received from immediate abilities remains stored, so does not cost the player again. Allocation can intentionally leave Gold outside purses. Each player confirms their own allocation, in any order; the server validates identity, all purse IDs, uniqueness, integral nonnegative amounts, capacity, budget and one-time confirmation. Players with no available allocation are ready automatically. The game settles once all are ready.

Score every faceup card's scroll on the final tableau, then add one point per remaining Key. Purses score their stored Gold at their printed rate; Banker also scores all stored Gold across all purses. Facedown cards score zero. Unstored Gold gives no points and breaks equal total scores. If both score and unstored Gold remain tied, the tied players win together, as the booklet specifies. No custom tie rule is needed.

## Shared display, phones and persistence

Market cards, discards, resources, ability choices and faceup tableaus are public. The center displays every player's tableau. Phones default to the common markets and their own tableau; other public tableaus and individual scoring are accessible through the scores menu. Only authenticated player clients receive their own legal controls. Display owners can start/restart; they cannot buy or make another player's ability/allocation choice. Future deck order, removed-card identities and server effect queues are not projected.

Server owns randomness and every transition. Strict actions reject extra identity, score, position and resource fields. Revision/dedup protections and account-bound reconnect reuse the platform room service. Persistence preserves the turn, optional-Key usage, pending effect, market/discard state, coordinates and purse confirmations. A local card selection before confirming purchase is merely UI state and can safely be discarded on refresh. Restart preserves room membership/auth sessions, deals a new server-randomized match and resets resources/tableaus.

## Artwork and presentation

Original newly generated portraits for each of the 78 professions, plus a transparent catalog box, table panorama, messenger, Gold, Key and two card backs: 85 assets. Art direction uses playful medieval characters, blue Castle and golden Village, with familiar card zones. Price, shields, Thai names, immediate abilities and end-game scoring are code-rendered, not baked into potentially illegible image text. Small cards summarize; enlarged details show complete ability and scoring explanations. Prompts and exported/master paths are recorded in assets.json.

Touch flow: read card → select purchase or facedown → select valid adjacent slot → confirm. No drag precision is required. Confirmation also precedes optional Key spending. UI scrolling is allowed for tableaus, long card details, the complete 78-card library and instructions, per the user's request. Native dialogs support Escape, labeled close/back controls and restored focus; keyboard focus outlines and reduced-motion handling are provided. Shared and phone layouts use the same Thai font and game menus as the rest of the collection.
