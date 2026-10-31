# Power Hungry Pets — base game

Implements the 21-card / 7-token, 2–6-player base edition. Primary source: [Exploding Kittens official English rulebook](https://cdn.shopify.com/s/files/1/0345/9180/1483/files/EK_Power-Hunger-Pets_Instructions_2024.pdf?v=1736273389), printing FBT-202503-04, linked from the [publisher's how-to-play page](https://www.explodingkittens.com/pages/how-to-play-power-hungry-pets). Both PDF pages were read and the field-guide layout visually checked. This is not the Small Version and does not substitute Love Letter's different card effects, reserve setup or scoring.

## Setup and turns

Shuffle all 21 cards and deal one per player. Set aside one random facedown card. With two players set aside three total: one facedown, two faceup (not an additional three). Remaining cards form the draw pile. Players agree on a first player in the lobby. Clockwise turns: draw one, choose one of the two held cards to play faceup, resolve its effect, then continue automatically. Played and forced-discarded cards stay faceup in their owner's separate display. An eliminated player's remaining hand goes faceup without activating its effect, and that player waits until the next round.

Cards, ranks and quantities: Royal Robovac 0 ×1; Crystal Bowl 1 ×5; Mouse Trapper 2 ×3; Battle Bunny 3 ×3; Shell Shield 4 ×2; Snake Sorcerer 5 ×2; Doggy Grave Digger 6 ×1; Jittery Juggler 7 ×1; Hermit Home Swap 8 ×1; Not A Pet! 9 ×1; King Cat 10 ×1.

## Card effects

- **0:** No played effect. At round end, a surviving held 0 beats everyone if another survivor holds 10. Otherwise its value is zero. A sole survivor still wins normally.
- **1:** Guess another active, unshielded player's number except 1. Correct eliminates; incorrect reveals no hand. If there is no eligible opponent the played card has no effect.
- **2:** Privately inspect the draw pile's top card, remove it temporarily and insert it at any position without inspecting or reordering other cards. One remaining card is inspected and returned; an empty pile does nothing. Position zero is the top, the current remaining length is the bottom. Position and inspected identity stay private.
- **3:** Privately compare remaining hands with an active, unshielded opponent. Lower rank is eliminated, ties eliminate neither. Both participants receive the compared cards privately; everyone sees any eliminated player's revealed card.
- **4:** Shield the held card until the beginning of the owner's next turn. Prevents effects from 1, 3, 5, 7, 8 and 9. The shield does not alter round-end scoring.
- **5:** Force an active, unshielded player, including self, to discard the held card without activating it and draw a replacement. Discarding 10 eliminates instead. When the draw pile is empty, use the facedown set-aside card for the replacement.
- **6:** Privately inspect the facedown reserve, optionally exchange it with the remaining hand. Neither identities nor whether the swap was chosen are broadcast.
- **7:** Return all active unshielded players' held cards, including the actor's, into the draw pile. Shuffle and redeal one to each affected player in seating order. Shielded players retain both their hand and shield. Eliminated hands and faceup/set-aside cards are not shuffled.
- **8:** Exchange the remaining hand with an active, unshielded opponent. Both new hands stay private.
- **9:** The other active, unshielded holder of 10 exchanges with the actor's remaining hand. No effect if 10 is absent, shielded or held by the actor.
- **10:** Playing or being forced to discard this card immediately eliminates its owner. Revealing hands for normal round settlement is not playing/discarding 10.

Target wording: the printed Crystal Bowl example explicitly says another player. Opponent-comparison/exchange actions are presented as selecting another player; Snake Sorcerer permits self-targeting. If every opponent is protected, opponent-only actions are no-ops rather than forcing an illegal target.

## Round and match settlement

One survivor immediately wins. Otherwise a round ends when the next player cannot draw, after completing all effects of the final played card. Apply the held 0-versus-held 10 exception, then compare surviving held values. If held values tie, compare the **highest single faceup card** belonging to each tied player, not the sum of discarded values. A round winner takes one token. Match target: 3 tokens for 2–3 players; 2 tokens for 4–6 players.

The printed rules do not resolve a tie remaining after both comparisons. The user explicitly selected **shared victory** for this rare case: every remaining tied player earns one token. This is disclosed in Thai learning/help/settings copy as a selected web rule, not attributed to the official booklet. Digital token accounting allows the extra simultaneous awards; the displayed seven-token supply bottoms out at zero. Simultaneous match-target achievers jointly win.

The booklet also does not specify who opens each subsequent round. This implementation uses a disclosed table convention: a previous round winner starts; if there are several, the server chooses uniformly among them. The first listed winner is the public display's round-advance actor, while any authenticated co-winner may advance once. Revision validation makes concurrent advance clicks atomic. All 21 cards are reshuffled and reserve setup repeated each round; accumulated tokens remain.

## Shared display and private phones

The shared display contains public player status, faceup cards, scores, deck count and the two faceup set-asides when playing a duel. It never receives future deck order, facedown reserve, insertion position, private notes or pending card choices. Private phone projections add only that authenticated player's hand, legal choices and prior private notes. Surviving hands reveal publicly only at round settlement, as required by the booklet.

Phone gameplay has only the player's own one/two cards and the draw pile, with turn/score status and a small menu toolbar. Other players' public cards/scores are accessible from a menu. Rules, library, secret notes, targeting and effect choices use compact paged dialogs. Draw/play effects are committed on the server before client animations. No page scroll is required for phone gameplay.

Existing account-bound reconnect, persisted room restore, duplicate receipt handling, strict revision/actor validation and owner-only restart are reused. Restart retains membership and tie-rule selection. Public hosts can advance settled rounds but cannot draw or choose someone else's private card.

## Original artwork

Fifteen distinct built-in image-generation calls produced all eleven pet illustrations, a transparent catalog box, card back, table background and transparent paw token. No retail art was cropped or used as a runtime substitute. Names, numbers and paraphrased Thai abilities are HTML so they remain readable. Prompts, source masters and exports are recorded in assets.json; runtime images are in public/art/power-hungry-pets/. Generated PNG masters remain local in ignored assets/source/power-hungry-pets/.
