# Friday — solo adventure

Edition: 2F-Spiele / Rio Grande base game (2011), with the publisher’s 2019 clarifications. One player, advertised approximately 30 minutes. Four difficulty levels. This is the Robinson deck-building game, not Black Friday or Robinson Crusoe: Adventures on the Cursed Island. Reviewed 2026-11-02.

## Sources

- [2F-Spiele product and play time](https://2f-games.com/2f-spiele/friday/)
- [Rio Grande English rules](https://www.riograndegames.com/wp-content/uploads/2013/02/Friday.pdf)
- [Publisher 2019 German rules](https://2f-spiele.de/pdf/freitag-anleitung_de_2019.pdf)
- [Publisher setup supplement](https://2f-spiele.de/pdf/freitag-beiblatt_de.pdf)
- [Older English rules mirror](https://cdn.1j1ju.com/medias/1e/3b/86-friday-rulebook.pdf)

The 2019 rules explicitly add death when the aging pile is exhausted and another shuffle is required, the exhausted-owned-cards pirate defeat, and count *all* undefeated hazards in final scoring (both draw and discard stacks). The older English wording is less explicit on these points. Printed numeric card distributions were cross-checked against [the Fridai reference table](https://github.com/jgwest/fridai/blob/master/Fridai/resources/Friday-Game.txt) and [the independent card table](https://github.com/whistleStudio/friday/blob/master/fri_client/style/card.json); community engine code is not used. Knowledge strengths are 0,1,2,3,4; the +1-card and strategy abilities remain attached to the exact printed groups. Names are newly localized Thai labels. Art is newly generated, not scanned printed cards.

## Setup and material

72 printed cards: 18 starting fighting cards, 11 aging cards, 30 dual hazard/knowledge cards, 10 pirates, three phase markers. Starting fighting cards: one 2, three 1, eight plain 0, five −1, one 0 with +2 life. Aging normal: −1, −2 twice, −3, highest=0 twice, lose1, stop. Difficult: −4, −5, lose2.

Level 1 removes the −3 Very Stupid aging card, starts with 18 shuffled starting cards, seven shuffled normal aging above three shuffled difficult aging, 20 life plus two reserve. Level 2 adds one undisclosed top aging card to the starting deck. Level 3 includes Very Stupid in the normal-aging group before adding the first aging card. Level 4 is level3 with 18 life plus two reserve; there are 20 physical life tokens available at this level. Healing transfers reserve tokens and cannot create more. The internal removed-card ledger includes the setup-excluded −3; the player’s destroyed pile does not falsely label it as a destruction.

Shuffle all 30 hazards. Their white/free counts and green/yellow/red thresholds: ten 1-card hazards0/1/3; eight 2-card hazards1/3/6; six 3-card hazards2/5/8; four 4-card hazards4/7/11; two 5-card hazards5/9/14. Reveal two randomly selected pirates for the whole game; eight unselected pirates never enter play.

## A fight

Reveal two hazards and choose one; discard the other into the hazard discard. The current phase selects its target. Open fighting cards individually up to the free allowance on the left. Additional ordinary draws cost one life each and are placed on the right. A deliberate switch to paid drawing can forfeit unused normal free draws. Ability draws are placed on the right but remain free. Each played ability may be activated once, at any time, and must resolve completely before another. After at least one fighting card, the player may settle; reaching the target never auto-settles. At zero life the player can still win or heal; needing to pay more life than remains loses immediately.

Winning adds the hazard as its knowledge side to the fighting discard, together with the played cards. Losing a hazard pays target minus actual fighting strength, then allows that many units of destruction: ordinary/knowledge costs1; aging costs2. This is not a second life charge. Do not spend extra life to enlarge this budget. Only this fight’s cards are eligible. Aging end-of-fight tax is additional payment and never destruction budget. A failed pirate fight cannot be voluntarily discarded.

The last lone hazard of a phase may be faced or skipped. Only when the hazard draw stack is empty do the hazard discards reshuffle into the next color. After red, choose either public pirate and then the other; both must be defeated. If every hazard is already won, empty intermediate phases advance without creating synthetic cards.

When a requested fighting draw finds the deck empty, add exactly one undisclosed aging card to the fighting discard and shuffle it. Do not shuffle when merely drawing the last card. Draw/peek/bottom abilities obey the same refill timing. A demanded refill with no aging left loses. Against a pirate, an empty deck and empty fighting discard with no held sorting cards means the owned fighting cards are already on the table; drawing is unavailable rather than turning the aging pile into an extra fighting deck. Remaining usable abilities can still be resolved; if strength remains insufficient, the finish button ends the adventure as a loss.

## Abilities and presentation choices

- Heal1/2 up to the remaining reserve; free draw1/2 resolves one card at a time, optionally stopping early.
- Destroy turns another played card facedown: strength0, no ability, still occupies its left/right slot and counts as a played card until settlement. It cannot be targeted again and is removed after the fight.
- Double is once per target and applied at settlement. Highest=0 uses the highest positive printed strength before doubling. End-of-fight effects are canceled if the source leaves; already resolved heals/draws remain resolved. Equal-strength zero choices are selected in the player’s favor, without changing the legal maximum.
- Copy uses another visible card’s ability even if already used. Copy chains cannot repeat a card. The acting copy card is the source and cannot target itself. Copied passive abilities remain linked to that source until it leaves the fight.
- Phase−1 is cumulative to green, never below green, and has no effect against pirates.
- Exchange1/2 retains left/right position, resets the replacement card’s use state, and may exchange the first replacement immediately again. No intervening ability is allowed inside the two-exchange resolution.
- Bottom first ensures a nonempty draw stack, then places another played card under it. A left-side card may be replaced for free or left without replacement.
- Sort peeks at most three individually, optionally discards one, and places the remainder back in chosen top-first order. Held cards are not fighting cards. Only the authenticated player receives these identities and ordering options; the shared display gets the count.
- Aging life−1/−2 is mandatory at settlement; highest=0 and left-side stop are mandatory while present. Removing/destroying stop restores remaining free allowance. A stop drawn on the right has no draw-blocking effect.

For half-count pirate scoring the evaluator selects the best permitted subset automatically, including every face-up aging card and rounding the card allowance upward. Facedown destruction cards still occupy played-card slots with value0 under the general destruction rule. If mandatory aging exceeds that allowance, no optional cards fit and the pirate cannot yet be defeated; more cards must be opened or aging removed. The UI marks counted versus omitted cards, zeros and doubling. The bonus pirate adds1 for every played card including those awaiting destruction. These choices never expose the hidden draw order.

## Ten pirates

Five plain pirates: free/target6/20,7/25,8/30,9/35,10/40. Specials:7/16 with two-life paid draws;9/22 with half-count strength;10/52 with +1 per played card;5/* with target twice the number of aging cards ever introduced (including already destroyed), locked when that pirate is selected;*/* using the sums of remaining hazards’ red targets and free allowances. Those undefeated hazards still count negatively in final scoring.

## End and score

Beat both pirates to win. Death sets remaining life to zero. Add printed strength of all owned, undestroyed fighting cards (including current cards and sort-held cards); each aging card instead scores−5. Add15 per defeated pirate. Only a successful escape adds5 per remaining life. Subtract3 per undefeated hazard in every zone. Compare games within the same difficulty level.

## Platform and UI

One authenticated player controls a server-owned room, can play everything on a single screen or phone, and optionally opens a separate shared display. The owner may be the player or host from another device. A second player seat is rejected; spectators can watch, not act. Level1–4 selection is owner-only before starting and clears readiness. Existing room QR, receipts/revisions, account-bound reconnect, cold persistence, menu, rules, public card reference and owner restart are reused. Randomness is injected in the pure engine and generated by the server in production. No client may choose deck order, future card, life total or score.
