# Love Letter — two selectable editions

This catalog entry contains two independent games, selected by the room owner before starting. Marvel is a separate ruleset, not extra cards shuffled into the court deck. Both support 2–6 authenticated players and a separate public display. Default: base.

## Sources and scope

- [Z-Man Love Letter rulebook, current 21-card printing](https://cdn.svc.asmodee.net/production-zman/uploads/2024/09/LL_Rulebook_with_Bag-1.pdf). Implements the 2019 21-card rules (also printed in the current bag edition). Does not implement the optional classic 16-card variant.
- [Z-Man Infinity Gauntlet official rulebook](https://cdn.svc.asmodee.net/production-zman/uploads/2024/09/Infinity-Gauntlet-Rulebook.pdf), all 20 pages, including the visual life tracker.
- [Official Marvel component previews](https://www.zmangames.com/game/infinity-gauntlet-a-love-letter-game/).

## Base

21 cards: Spy 0 ×2, Guard 1 ×6, Priest 2 ×2, Baron 3 ×2, Handmaid 4 ×2, Prince 5 ×2, Chancellor 6 ×2, King 7 ×1, Countess 8 ×1, Princess 9 ×1. Set aside one face down; with two players also set aside three face up. Deal one each. The most recent handwritten-letter writer starts, selected in the lobby.

Each turn explicitly draws one, plays one, resolves its effect, then ends. Clockwise, skipping eliminated players. Handmaid protection expires at the start of the owner's next turn. Opponent-targeting cards have no effect if no valid opponent; Prince must target self in that case. Guard cannot guess 1. Priest and Baron knowledge is private. Baron ties eliminate nobody. Prince discards without playing the discarded effect, except Princess eliminates; draw from the facedown reserve only when the normal deck is empty. Chancellor draws up to two, keeps one and returns the others to the bottom in chosen order; no Countess constraint during this choice. King swaps hands. Countess is mandatory when the other normally held card is Prince or King. Princess played or discarded eliminates its owner.

One survivor immediately wins the round. Otherwise, after the turn and all effects, an empty deck ends the round; highest surviving hand wins. All tied highest players earn one favor; no discard-sum tiebreak. Exactly one surviving player who played/discarded any Spy gets one extra favor, whether or not that player won the round. Eliminated Spy players do not block this bonus. Favor targets at 2/3/4/5/6 players: 6/5/4/3/3. Players reaching the target together jointly win. A round winner starts next round; server chooses uniformly among tied round winners. All 21 cards are reshuffled each round.

## Marvel

One Thanos versus all other heroes. Thanos starts, holding two cards; heroes hold one. Each turn draws and plays one. In a duel, the hero gets two complete consecutive turns after each Thanos turn. Hero deck has 16 cards, Thanos 13. Hero cards of the same rank share effects; names and Thai paraphrases are in `data.ts`.

Heroes share 6 life. Thanos life at 2/3/4/5/6 players is 4/4/5/6/7. Printed player-count labels on the life track are not life values. Defeating a card loses one team life, discards the card and draws a replacement. Nobody is eliminated. Defeated stones or Thanos 7 first draw a replacement, then shuffle the defeated card back. If the villain deck is empty the draw is skipped before returning that card. The hero deck refills immediately when empty from all currently faceup hero discards, including the card just played. Thanos never recycles the whole deck.

Fights compare privately. Heroes fight with their held card and a server-random Thanos card. Thanos chooses their own card and opposing hero. Both participants with power must spend exactly one token, adding 2; unused tokens remain. No supply cap (the physical game permits substitutes). Lower modified rank is defeated; ties defeat neither. Space Stone may fight twice, resolving the first fight and replacement completely; different heroes unless playing a duel.

Hero 1 guesses 1–7; if both held Thanos cards match, Thanos privately chooses which is defeated without revealing a double match. The digital game always asks Thanos to confirm this resolution, including misses and single matches, to preserve identical public waiting states. Hero 2 lets another hero privately inspect one randomly chosen Thanos card (self in a duel). Hero 3 optionally fights. Hero 4 grants one power to any hero. Hero 5 privately reorders the top three cards, refilling during the effect if needed. Hero 6 delegates an optional fight to a chosen hero, including self.

Outrider guesses one hero's number. Mind Stone guesses all heroes and resolves matches in clockwise order after Thanos. Corvus defeats ≤3; Soul defeats ≥3. Black Dwarf optionally fights once; Space up to twice. Proxima grants one power; Power Stone three. Ebony draws up to one and returns the same number to bottom. Reality draws up to two and returns the same number, ordered. Time copies another faceup Thanos card, including an ordinary defeated villain; Time itself is excluded. Thanos 7 cannot be played.

Zero opposing life ends immediately. During Thanos's own turn, all six stones in hand or faceup allow an explicit Snap victory. Pending effects, including returning cards from Ebony/Reality, must finish first. Snap is also available before drawing or playing. Empty villain decks and an unplayable last Thanos card allow ending the turn without inventing a loss condition.

Communication: players cannot communicate cards they have seen or direct other players' choices. Discussion may use public observations, such as previously played stones. The public event log remains readable after immediate hero-deck refills; it contains only played/defeated cards and public resolutions, never private comparisons or inspected hands.

## Digital interaction and privacy

- Server generates shuffles, random inspected/fought cards and tied-round next starters.
- Draw/play/end and optional fight decisions are explicit phone actions. A public host may advance a completed base round but cannot inspect or play private hands.
- Pending ability actor can differ from the turn owner. Only that actor receives choices.
- Public projections contain deck counts, public discards, team life/favors, active actor and public events. No decks, reserve, queue details or private notes. Phone views add only the authenticated player's hand, legal actions and private notes.
- Legal actions reject extra fields, forged actors, wrong phases and stale revisions. Existing deduplication, persisted authenticated reconnect and room ownership apply. Restart preserves selected mode and Thanos seat.
- Base round-end surviving hands are revealed. Marvel hands stay private even at life-based game end; a Snap reveals only Thanos's hand as required to prove the six stones. Future deck order and the base reserve remain secret.

## Art

Ten court portraits and one dual-edition box were newly generated with the built-in image tool. Prompts and paths: `assets.json`; runtime WebPs: `public/art/love-letter/`. The new box visibly combines royal court/envelope and cosmic gemstones and says TWO EDITIONS.

Marvel character generation was rejected by the image tool. The user chose reference artwork instead. The initial nineteen official-preview/PDF portraits and nine placeholders are recorded in `official-art.json` as historical assets.

On 2026-10-31 the user supplied complete hero and Thanos card sheets and requested new images with Thai lettering and text shadows. A new reference-guided generation attempt was also rejected by the image tool (`generation-attempt-v2.json`). Following the user's existing reference-art fallback preference, all 28 unique portraits were extracted from those sheets into `public/art/love-letter/reference-v2/`. The two Outrider copies share their illustration. `reference-v2.json` records source files and exact extraction rectangles. These are source-reference portraits, not newly AI-generated artwork; upscaling does not create missing source detail.

Six separate non-character cosmic-gemstone generation calls succeeded. Those six new artworks are in `public/art/love-letter/generated-v2/`; exact prompts, masters and exports are in `generated-v2.json`. Live Marvel cards therefore use 22 supplied character portraits and six freshly generated stone illustrations. The complete 28-portrait reference extraction is retained as a documented source fallback. Character artwork was not regenerated and must not be described as such.

All live Marvel cards now have a matching portrait: no deck-back/symbol placeholders. One versioned image resolver serves the card library, gameplay, enlarged cards and illustrated entry guide. Original text panels are excluded from the portrait regions. Thai rank/name/effect text is rendered in HTML with layered dark text shadows, a light vignette and no text panel. English names are omitted from Marvel card faces. Own-hand ability text is limited to three lines at small sizes; enlarged cards show the complete ability. One- and two-card phone hands use larger portraits; three-card hands still fit the viewport. The entry guide's four steps use real card/deck illustrations instead of symbol-only visuals. Catalog status remains beta for the new game.
