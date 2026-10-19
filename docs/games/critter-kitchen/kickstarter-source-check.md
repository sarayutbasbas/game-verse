# Kickstarter source check — 19 October 2026

User reference: [Critter Kitchen campaign](https://www.kickstarter.com/projects/cardboardalchemy/critter-kitchen).

The accessible campaign/description and updates pages exposed project metadata and navigation but no complete story/card-image section. [The FAQ](https://www.kickstarter.com/projects/cardboardalchemy/critter-kitchen/faqs) was readable; its nine entries concern languages, pledges, merchandise, sleeves and refunds rather than card effects. A normal direct request and an independent Chromium navigation to the public description returned HTTP 403 / a loading challenge. No complete new released card face was verified from Kickstarter in this pass. Do not claim that the whole campaign story was inspected, or count campaign names/old stretch-goal illustrations as shipped rule text.

Cross-checked the publisher's current [Allplay product page](https://www.allplay.com/board-games/critter-kitchen). It lists À La Cart, Amazing Race, Lucky Duck and a bundle containing Primal, Rudy and Secret Menu. Product photographs inspected for Primal/Amazing Race show packaging rather than full ability faces. They confirm pack identities, not enough text to enable complete packs. Existing released-rulebook requirements continue to take precedence over older campaign draft rules, particularly six/seven-player setup.

## Playable progress from already supplied evidence

The user's previous high-resolution images and [The Grove playthrough](https://www.youtube.com/watch?v=c6QXKSJVIIE) fully verify Queenie (#244, one-bag capacity, 12:22) and Shaggy (#246, two-bag capacity, 12:05). These are now implemented as a separate two-card pregame option. This progress is sourced to those printed faces, **not** newly recovered Kickstarter content.

- Queenie: after her normal picks, one bag item only if she was the actual first chef to pick at that location. Existing first-pick history is used, so hat movement after winning a tie does not remove the reward. Wild-rumor gifts use the existing authenticated private rumor decision and survive restoration.
- Shaggy: after normal picks, queue one extra pick from the same location per physical rumor token currently held. Count once at the trigger; learning another rumor during a bonus pick does not recursively add more picks. Jamie's extra private rumor card is excluded. Exhausted/otherwise ineligible stock provides no bag fallback. Printed capacity and normal queue priority remain two.
- The new option is independent of the existing Alex/Peter option. Adding cards to the meaning of the old checkbox would invalidate conserved decks in existing saved games, so the old selected deck and seeded setup are retained. Neither option enables Carts or six/seven-player mode.

Original generated portraits and thumbnails are saved under `public/art/critter-kitchen/{portrait,thumbs/portrait}/sous-{queenie,shaggy}.webp`. Exact prompts, generated sources and output dimensions are recorded in [alacart-foragers-art-jobs.json](alacart-foragers-art-jobs.json). Runtime team-color rings retain owner identification while these cards use their new neutral portraits.

See `docs/progress.md` for executed rule, transport, Docker and browser verification results. No deployment or push is authorized by this source-research request.

## Subsequent original-image attachments

The user then supplied twelve local image files from the campaign. This resolves access to those graphics even though the earlier live-page request did not expose them. The original AVIF/PNG files were opened, the long680px-wide graphics inspected as native-resolution crops, and factual inventory/roster/preview findings recorded in [campaign-attachments-findings.md](campaign-attachments-findings.md). This includes all seven printed Gelato values and the Organic value8 illustrations. Do not repeat the earlier live-page limitation as though these supplied images are still unavailable. Preview-card wording remains distinct from confirmed released faces; runtime scope did not change during the attachment audit.
