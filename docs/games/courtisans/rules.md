# สภาฐานันดร — Courtisans

Implemented scope: Catch Up Games base game (2024), 2–5 players, no expansion. Designers Romaric Galonnier and Anthony Perone; original game's illustrator Noëmie Chevalier. Runtime illustrations are newly generated, not scans of that artwork.

## Sources and printing

- Publisher: https://catchupgames.com/nos-jeux/courtisans/
- Licensed English publisher and linked rulebook: https://pandasaurusgames.com/products/courtisans
- Publisher-linked English PDF: https://www.dropbox.com/scl/fi/id7b8ztc3tmwt4gsoevd4/courtisans_rulebook_en-PAN-v1.pdf?dl=1&rlkey=4yqq9esnmmjwo0hf9dw6gsb1d
- Original French publisher rulebook: https://www.dropbox.com/scl/fi/ka90lane9dat9q4kg5kzl/courtisans_r-gles_fr.pdf?dl=0&rlkey=bc0t20q1om8konll28f78fut5
- Mission transcription checked against photographs of all 20 physical French mission faces, downloaded for research only from https://github.com/guillaumevaillant59/Courtisans . Photographs are not distributed in runtime assets. Other fan source fixtures were inconsistent and were not used as rules.

The two non-family blue missions use ABOVE the mat, matching the photographed original French cards (au-dessus). Some English lists/printings use BELOW. This implementation explicitly selects the original French mission set, not a blend. No claim of a universally identical mission printing. Thai-localized physical cards have not been supplied for comparison.

## Components/setup

90 courtier cards, six families (Butterfly, Toad, Nightingale, Stag, Hare, Carp) ×15: 4 ordinary, 4 nobles, 3 guards, 2 assassins, 2 spies. 20 missions:10 white,10 blue. Server shuffles, removes 30/18/6/0 cards unseen for 2/3/4/5 players, deals 3 to each and one mission of each color. Random first player by default; manager may select the agreed starter. Player order is clockwise; next seat is left neighbor. Complete turns per player:10/8/7/6.

## Turn

Play all three hand cards, in any order, exactly one to each area:
1. Queen's table, matching family, above or below the mat.
2. Own domain.
3. One opponent's domain, never self.

Draw 3 at turn end for the NEXT turn. When deck is empty, continue until all hands are empty; don't end early. No timer, animation, or client-supplied random result affects play.

## Roles

Noble counts as two cards at final influence and domain scoring. Guard cannot be assassinated. Assassin may eliminate one OTHER card in the SAME area, or decline. The entire Queen's table (all families and both sides) is one area; each player's domain is a separate area. Cannot eliminate guards or the newly played assassin itself. Choice resolves before any further hand placement, including an assassin played as the game's last card.

Spy is always face down. Nobody, including placer/recipient, may inspect it again. At the Queen's table it occupies an anonymous Queen column on the selected side. At game end reveal surviving spies and move them to actual family without changing side. Eliminated spies are never revealed, including at final scoring. Eliminated face-up cards remain public and score nothing.

## Scoring

For each family, weighted cards above > below: esteemed, +1 per card in a domain. Below > above: fallen, −1. Equal: neutral,0. Nobles count twice, including negative contributions. Then reveal missions; each met condition gives3, failed gives0. Negative total valid. Highest total wins, exact ties share victory.

## All missions (+3 each)

White1–6: fewer weighted cards of the named family in own domain than left neighbor (strict <; 0 versus0 fails). Family order: Butterfly, Toad, Nightingale, Stag, Hare, Carp.
White7: at least3 noble role cards;8:at least2 assassins;9:at least4 guards;10:at least3 spies. These role predicates count physical role cards; the noble multiplier is used for family quantities/influence/VP, not to turn two noble characters into three characters. This interpretation is stated in UI and separately tested; publisher booklet does not contain an explicit role-count mission example.
Blue1–6: corresponding family fallen (neutral fails).
Blue7: at least one card in every family above the mat.
Blue8: at least5 weighted cards of one family above the mat.
Blue9: at most3 esteemed families (zero qualifies).
Blue10: at least2 fallen families.

## Projections and durable state

Pure engine uses server-only instance IDs, shuffled deck, unseen removed cards and unused missions. Public placement IDs are opaque sequential keys, never family-coded. Every spy projection is anonymous until final reveal; discarded spies remain anonymous permanently. The same rule applies to the owner's private snapshot. No live true score or mission progress is sent, since that could leak spy families. UI shows only visible influence with a clear provisional label. Only authenticated phone owner gets own hand, mission IDs and legal actions. Common authenticated room queue, exact revisions, deduplicated command receipts and persistence are reused. Display managers cannot play another person's private hand. A pending assassination persists and resumes after restart.
