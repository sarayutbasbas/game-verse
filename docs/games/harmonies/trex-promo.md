# Harmonies — T-rex promo

Scope: the Hobby Next Nature's Spirit promo **one T-rex card**, not an invented dinosaur deck. Enable **โปรโมพิเศษ · ไดโนเสาร์ T-rex** in the host lobby. It includes Nature’s Spirits and can combine with Solo and the existing Whispers module. Disabling Nature’s Spirits clears the promo checkbox.

## Rules and sources

- [Libellud promo description](https://www.libellud.com/en/our-games/harmonies/): two points for every Animal cube connected to the Nature’s Spirit cube; the published example gives six animals = twelve points. Solo adds zero Suns for this card. The old page currently redirects, but its indexed description still contains the promo explanation.
- [Asmodee Hobby Next official offer](https://www.hobbynext.ca/offer/harmonies-natures-spirit-card-and-4-transparent-pawns/) identifies one Nature’s Spirit card and four replacement pawns. The replacement pawns have no additional game rule.
- [Official pattern close-up](https://cdn.svc.asmodee.net/production-hobbynext/uploads/sites/3/2024/02/Gallery-3_500x320-3.jpg): straight line of rock ×3, field ×1, wood ×2 + leaf. The Spirit goes on the field. Six rotations, exact heights and ordinary destination-occupancy rules apply.
- [Thai Crescendo rules](https://cdn.svc.asmodee.net/production-libelludv2/uploads/2026/08/HC_RULES_TH_compressed.pdf), pages 11–12, distinguish Animal, Nature’s Spirit and Whisper cubes. This implementation counts and traverses ordinary Animal cubes for T-rex; a lone Whisper is not an Animal cube. An Animal sharing its cell with a Whisper counts once, while that Whisper scores independently as usual.

When enabled, add the promo to the ten base Spirit cards, shuffle all eleven, and deal two privately to every player. Players choose together before the first terrain turn, following the app's existing setup flow. T-rex can be undealt or discarded; it is not guaranteed in every game and is never duplicated between players.

After its cube has been placed, traverse adjacent cells bearing Animal cubes from the T-rex cell. Count the reachable ordinary Animal cubes, including indirect chains and branches, once per cube. Cycles do not multiply points; gaps do not connect. The T-rex itself scores no two-point unit. Without activation the Spirit bonus is zero. Add the resulting bonus to normal terrain/Animal/Whisper scores. Tiebreaks continue to count ordinary Animal cubes only.

## State, privacy and compatibility

`promoTrex` is an optional boolean on the existing options object; absent/false retains the ten-card pool and legacy state shape. The server normalizes true to include Nature’s Spirits. Catalog ID is `spirit-11`. Validation selects the correct ten/eleven-card inventory, including drafted, selected, discarded and unused cards, and rejects promo cards when the promo is disabled. Existing rooms retain their boards, identities, options and inventory through recovery; no storage replacement or data migration is needed. Shared/public/private roles and match-bound simultaneous choice validation remain unchanged.

## Artwork and presentation

All shipped T-rex images are newly generated; official pictures are rules references only. See [asset prompts](trex-art-jobs.json). Full/small/lite portrait WebP variants use existing card geometry. The transparent 160×184 figurine has the same footprint as other models, a gold aura and a subtle foot-anchored breathing idle on the board/tray. Lightweight mode and OS Reduce Motion stop the idle. No new rendering library or frame-loop JavaScript is used.

The selected-mode scoring and help popups explain placement, connected-animal scoring, an example of six animals for twelve points, and the zero-Sun Solo modifier. Card-detail descriptions show the same rule, and completion ribbons/dimming continue to use the shared card UI.
