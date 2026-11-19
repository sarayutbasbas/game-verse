# Tiny Towns — AEG base game 2019

Sources: [AEG product page](https://www.alderac.com/tiny-towns/) and [publisher rulebook](https://www.alderac.com/wp-content/uploads/2024/05/Tiny_Towns_Rulebook_WEB.pdf), visually inspected all eight pages, including card diagrams and building/monument clarifications. All 15 monument patterns cross-checked against photographs of the base cards. Publisher advertises approximately 30 minutes. Original illustrated assets and Thai paraphrases are created for this web implementation; no published artwork is included.

## Scope

1–6 authenticated players; true Solo, Master Builder and Town Hall. All 25 normal building cards and 15 monuments, with the official solo exclusion of Inn, Bank, Fort Ironweed and Opaleye's Watch. Six normal types are selected one card each alongside mandatory Cottage. Recommended first-play set or random selection; optional monuments and Cavern (the latter only in multiplayer Master Builder). No expansions or promo cards.

4×4 towns. Resources/buildings are unlimited. A resource is called by the Master Builder, everyone places it, then may construct multiple buildings or wait. Exact orthogonal coordinates, all rotations and reflections. Remove matching resource cubes and place the building in one of the vacated real-resource squares, unless Shed or an already-built Obelisk permits any empty square. Trading Posts are reusable wildcards, remain on the board, and cannot replace the required minimum of one actual resource.

Players explicitly finish their construction window. They may still build while marked ready until the last active town is ready. The next resource then begins atomically on the server. Finish a town only when physically full and with no pending effects, whether or not a construction is available. Other towns continue. Finished towns receive no more resources or Master Builder turns.

## Solo and Town Hall

Solo: 15 resource cards, three of each color; reveal three. Choose one slot, put its card under the deck, replace from the top. Future deck order is private. No multiplayer approximation or independent random cube roll. Factory/Warehouse/Bondmaker react to resource-card rounds. The printed skill thresholds are 38/32/25/18/10 points.

Town Hall: shuffle 15 cards, discard five face down, share two resource draws, then let each player choose a resource on every third round. Reshuffle all cards and discard five again when the draw pile is empty. Bank applies only to private-choice rounds. Fort skips private-choice rounds unless its owner is the last active town. No Master Builder tiebreak counts accrue in Solo/Town Hall.

## Scoring and effects

Normal adjacency means four orthogonal neighbors; Granary alone includes all eight surrounding squares. Cottage feeding choices are evaluated exactly and automatically maximize the player's total legal score; this avoids making phone users manually assign food. Farm has a shared capacity of four Cottages per Farm; Greenhouses cover whole orthogonal groups. Barrett Castle counts as two Cottages for scoring and Farm capacity, but occupies one square for spatial coverage. Unfed houses remain buildings. Mausoleum changes the score of unfed houses without feeding them.

Tables, line counts, distinct types, central cells, corners and Temple feeding conditions are implemented per card. Unused board resources count as empty squares for the final −1 penalty; Warehouse storage scores −1 each; Cathedral changes empty-square penalties to zero. Negative totals are legal. Starloom uses completion round and awards tied towns the highest shared place. Ties: least Master Builder turns, then fewest empty squares, then most Cottages (Castle counts two), then shared victory. Solo Feast Hall compares to the sole player's town on its right, hence two points each.

Factory and Bank force an immediate marker choice. Bank markers are distinct and at most five Banks are allowed. Warehouse can store up to three cubes, including repeated colors, or exchange one stored cube for the incoming cube; storage never shrinks. Guild can replace up to two different existing normal-building squares immediately, using selected normal building types. Grove gives an immediate free normal building. Opaleye has three different selected normal types; left/right neighbor construction consumes the matching token once and queues a private mandatory free placement if a square is empty. New buildings trigger applicable immediate effects and neighbor Watches; pending effects block advancing to another round. Shrine locks its value when constructed; the sixth or later building is worth eight.

## Privacy and authority

The pure engine accepts an authenticated player ID and exact permitted action payload. Rejected actions do not mutate state. The server supplies shuffle randomness. All towns and completed monuments are public; each unbuilt monument choice and its initial two-card offer are sent only to its owner. Unused monuments, discarded offers and future resource cards never appear in public or player projections. Legal actions and geometry options are generated per owner. Existing room receipts, revision checks, account-bound reconnect and durable storage are reused.

## Designer clarification: five Banks

[Peter McPherson's May 13, 2019 clarification](https://boardgamegeek.com/thread/2202189/5-banks), also affirmed by a publisher account, says that a last remaining player with five Banks must declare the town complete even when spaces remain. The engine skips their Master Builder calls while others remain, and settles at the next round boundary if no active player can call anything. In Town Hall a fully blocked player skips personal-choice rounds; if only completely blocked towns remain they settle. No rule requiring fewer than five Banks is invented. The user explicitly approved the same behavior on November 3, 2026: skip that player's resource-call turn, and complete their town when they are the last remaining player.
