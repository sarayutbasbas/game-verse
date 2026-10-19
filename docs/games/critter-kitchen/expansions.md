# Critter Kitchen — verified Promo implementation and À La Cart research

Status 2026-10-19: **Lucky Duck Pack, Rudy the Reindeer and four individually verified À La Cart Zous-chefs (Alex/Peter/Queenie/Shaggy) are playable. Complete À La Cart, Primal Pack, Secret Menu, Amazing Race and 6–7 players are not yet playable.** The lobby deliberately offers only complete, verified modules. No approximate Cart rules or placeholder abilities are used.

## Playable packs

The room manager chooses independent checkboxes before starting. Choices are server owned, broadcast to every role, persisted with the room, and immutable after play starts. Unknown options, malformed values, unauthorized updates and stale revisions are rejected atomically. Restarting the same match retains its selected packs. Leaving all expansion checkboxes off retains the original 2–5-player component decks and seeded random sequence. The optional fields are backward compatible with existing base-game saves; the base rules version remains valid.

- **Lucky Duck Pack** adds Wolfgang Duck to the Restaurateur deck and Cosmo to the Zous-chef deck. Wolfgang retains the printed 2-star end bonus. He allows wine to serve as any required food type in Challenge meals only; printed wine quality and normal wine/allspice matching still apply. Enable Restaurateurs to include him in the initial private offers.
- **Cosmo** immediately reserves a random real Zous-chef from the shuffled server deck when picked. Only its owner receives the reserved ID. The public card remains Cosmo through private planning and the Running gate. Starting Shopping reveals the replacement, transfers Cosmo's committed destination to it, and uses its actual capacity and ability for that round. Cosmo and the replacement remain separate physical cards for deck conservation. The reservation survives reconnect and persistence.
- **Rudy** holds 3 items. On each carrot picked, its owner chooses to keep it or give that physical carrot to a different player and gain 1 star. The gift decision blocks further resolution. The action includes the exact token ID, preventing a delayed duplicate decision from gifting the next carrot. Rudy still collected an item for consolation purposes. Gift stars count as chef stars and appear in normal final totals.

New artwork is original generated imagery, with full and thumbnail 3:4 WebP assets. See [promo-art-jobs.json](promo-art-jobs.json) for exact prompts, generator, source paths and runtime outputs. Official component photographs are reference material only.

## Sources actually inspected

- Publisher's [À La Cart rulebook](https://cardboardalchemy.com/downloads/CritterKitchen_Exp_Rulebook.pdf), 12 pages: setup, Cart lifecycle, 6–7-player Break Time/Mystery Die rules and clarifications. This rulebook refers to the individual Cart reference cards for their effects; it does not reproduce all 18 reference faces.
- User-supplied publisher unboxing [video](https://www.youtube.com/watch?v=-3bsJhxHlDQ): expansion 5:21–8:51, Promos 8:51–9:41. Examined frames around 6:43–7:11 for expansion Zous-chefs, 6:55–6:59 for Cart references, 8:59–9:09 for Primal, 9:13–9:17 for Lucky Duck, 9:23–9:31 for Secret Menu and 9:35–9:39 for Rudy. Rudy's complete printed text and capacity are readable at 9:39. The video flips past most Cart references without showing their full faces.
- Publisher's [product page](https://www.allplay.com/board-games/critter-kitchen) and [Lucky Duck component photograph](https://cdn.shopify.com/s/files/1/0143/6178/8473/files/CA_CritterKitchen_Product_Lucky-Duck-Promo_1440.webp?v=1777042531) verify both Lucky Duck faces, wording, variable Cosmo capacity and Wolfgang's 2-star bonus.

Local reference PDF, downloaded video, frame contact sheets and test logs are under ignored `data/critter-kitchen-expansion-ref/`. They are not distributed with the game. The accessible video is 640×360; higher-resolution downloads were attempted but returned HTTP 403. No generative upscaling was used to infer illegible rule text.

## Remaining original-expansion scope

À La Cart officially adds 18 Carts/reference cards, 24 Zous-chefs, 4 Critics and 4 Restaurateurs, plus Cart-specific items. The exact setup, round refill and effect on each reference face still need complete readable evidence. In particular **Zous Too is mandatory at Garden Top Shop for 6–7 players**, including its extra Zous-chef and separate ingredient supply. Thus merely raising the room cap would not implement that mode correctly.

Verified main-rulebook requirements to implement together with those faces:

- 6 players use all locations except Lantern Lane; 7 players use all locations.
- Add seven value-7 ingredients, seven spices and four rumor tokens to the bag.
- Every player assigns exactly one base chef to Break Time each round. The server rolls the Mystery Die; a matching resting chef gains 2 soup during Running.
- Support multiple simultaneous Zous-chefs per player, extra 7th-round allspice, Cart item conservation and refrigeration rules. Cart items never enter the Token Bag; ordinary unpicked Cart goods do not flow to Chef Academy. Gifts/Food Drive have specific persistence exceptions.
- Prestart mode changes must atomically enforce room capacity: base 5 / expansion 7, reject disabling with more than 5 seated players, allow it after occupancy drops to 5. This capacity change is **not enabled** until the required mode is playable.
- Generate and verify two additional team sets, and verify display/mobile layouts with 7 authenticated seats.

Primal, Secret Menu and Amazing Race must be selectable as complete packs only after every included rule/card is verified. Partial frame readings are retained as research, not runtime abilities. Draft Kickstarter rules found in search conflict with the released 6–7-player rules and must not be substituted.

## Verification

`tests/critter-kitchen-expansions.test.ts` checks strict opt-in selection, unchanged base setup, Wolfgang's Challenge/spice restrictions, private Cosmo reservation and reveal, restoration, Rudy recipient validation and stale token rejection, and 32 complete games (8 seeds × 2–5 players) with token/card conservation after every action.

`tests/critter-kitchen-rooms.test.ts` additionally checks actual WebSocket manager permissions, malformed/unknown settings, idempotent retries, stale revisions, saved lobby settings across process restart, authenticated reconnect and immutable settings after starting.

`tests/browser/critter-kitchen-expansions.spec.ts` targets the real Docker app at port 5555 for lobby persistence, responsive artwork, two separate phone identities and full settlement. Only executed results should be recorded in `docs/progress.md`.

## Attached PDF and artwork preparation — 2026-10-19

Read the user's `/Users/basukekung/Downloads/CritterKitchen_Exp_Rulebook.pdf` (12 pages). SHA-256 `b42a05e9332b7364aa2e94b76340369625682acd63ad90a44e8c0eea055d2165` matches the publisher PDF already audited above byte-for-byte. Pages 6–7 delegate individual effects to the 18 Cart Reference Cards; pages 8–9 require the separate Zous Too reference for 6–7-player setup. The attached PDF contains setup illustrations and clarifications, not that complete reference deck. Rendered page 6 was inspected, including its small example faces; the embedded reference-face illustrations are too small to recover all text reliably. No filenames or document text were treated as agent instructions.

Also inspected the publisher-sponsored [official how-to video](https://www.meepleuniversity.com/2025/03/02/critter-kitchen-official-how-to-play-with-a-la-cart-expansion-complete-clear-concise-tutorial/), expansion section 23:12–28:43, including its captions. It confirms the independent modules, Cart cleanup and Break Time rules. It explicitly delegates the individual Cart effects to their cards too. Readable example faces at approximately 25:48 support further transcription of Organic, Dumplings and Balloons; these are retained as research until their required token values/composition and interactions can be fully checked. Draft Kickstarter text is still not used as a replacement.

Prepared new original artwork from the component list on pages 2–4: a three-cart market panorama, 16 transparent item icons, and six base-chef portraits in two additional custom color sets (rose pink and turquoise). These are visual assets only; no unverified printed values, effect text or stars are embedded. The extra colors are not added to the live team pool or used to raise room capacity. Zous-chef portraits for those colors and full À La Cart gameplay remain outstanding.

- Runtime-ready image directory: `public/art/critter-kitchen/alacart/`.
- Review gallery: `/art/critter-kitchen/alacart/preview.html`.
- Asset/quantity manifest: `public/art/critter-kitchen/alacart/manifest.json`.
- Exact prompts, source atlas paths and per-piece crop rectangles: `alacart-art-jobs.json`.

The art gallery is a review page, not an expansion-enable control. Base-game and existing Promo behavior are unchanged. Missing Cart faces remain the blocker for claiming complete À La Cart or 6–7-player support; the user has been asked for a link to the separate Cart Reference Cards.

## Additional supplied tutorial/playthrough references

The user supplied clear component screenshots and two more videos. Added the verified Alex Alpaca / Peter Parrot cards as an explicitly labeled two-card opt-in, with generated portrait artwork and Thai rules. This does not enable the full À La Cart deck or Carts and does not raise room capacity. Detailed face transcriptions, source timestamps and remaining interaction/component gaps are in [alacart-reference-audit.md](alacart-reference-audit.md). The earlier request for more sources has been answered; further independent work should use this audit rather than asking the user to resend the same material.

### New Zous Too reference supplied

The subsequent `c6QXKSJVIIE` playthrough and user screenshot resolve Zous Too's missing reference face. Full preparation, per-round extra chef plus two ingredient draws, and multiple hired Zous-chefs are now verified. Flowers and seven further Zous-chef faces were also recorded; Hootly/Gelato were corroborated. See [the new findings](alacart-grove-findings.md). Across all sources, reference coverage is six of eighteen full Cart faces and twelve of twenty-four expansion Zous-chef faces/capacities. These are research counts; Alex/Peter were playable at that research stage; Queenie/Shaggy have since been added as a separate verified pair. Separate ingredient/token inventories, remaining faces, multi-chef engine/UI and Break Time still need implementation/verification before a complete mode or seven seats can be exposed.

## Queenie + Shaggy playable pair

Added a separate pregame `aLaCartMoreChefs` checkbox for Queenie and Shaggy, with the printed capacities 1 and 2 and original generated portrait artwork. Queenie rewards the actual first picking chef after normal collection, including correct private wild-rumor handling; Shaggy queues additional local picks based on physical rumor tokens at the trigger without recursive bonuses or bag fallback. The older Alex/Peter checkbox keeps exactly its previous deck so existing games remain valid. Read [the Kickstarter source check and implementation scope](kickstarter-source-check.md) for provenance: no complete new rule face was recovered from Kickstarter; these two use the already supplied released card images. Four expansion chefs are now playable; Carts and six/seven seats remain disabled.

### Original campaign image attachments inspected

The user supplied twelve original campaign graphics directly after the Kickstarter access limitation. These images are now available and inspected, with copies in ignored reference storage. They supply previously missing numeric illustrations: Gelato3,3,4,4,5,6,7; all seven Organic foods at8; Tofu4,4,5,5,6,6,7; Ice1,1,1,2,2,3. Readable Pies/Gift and selected character preview faces and complete union rosters were also recorded. The source vintage is retained: several printed card layouts are visibly earlier than the released faces supplied in the videos, so preview rules are not enabled automatically. See [campaign-attachments-findings.md](campaign-attachments-findings.md). In particular, it is no longer accurate to say that no Gelato numeric set has been found; the unresolved distinction is campaign illustration versus complete released-component comparison. Playable scope remains four expansion chefs, the earlier Promos, and2–5players.
