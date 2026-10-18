# Locus source audit — 2026-10-16

Confirmed game: Stan van Rooijen, Tucker’s Fun Factory base; English Tucker PDF plus Wise Wizard Games 2025 edition. Multiplayer scope2–5; Solo1 excluded. Sources downloaded/read outside runtime:
- https://www.tuckersfunfactory.nl/1009/webshop/kaartspellen/TFF-482108
- Official English https://www.tuckersfunfactory.nl/download/13706a4866c0f1fc494a56113435e810465190.pdf (image-only2pages; complete4,374,572bytes after slow transfer)
- https://files.wisewizardgames.com/wwg/rules/Locus_Rules_Web.pdf (vector2pages)
- https://www.wisewizardgames.com/locus/ and its primary scoresheet illustration `/images/content/games/locus/locus-score-sheet.png`

The first reference-card illustration on page1 contains the complete8×6 catalog. Cropped and inspected original primary PDF to read rainbow column: rainbow rows0–5 are two T4, two L4, two S4; lasttwo are domino2+coin. Five normal colors have U5,T5,Z5,W5,F5,L5,I3+coin,L3+coin.48total,12coincards. Do not infer all rainbow cards share the normal-color shape.

Sheet from primary full-size illustration: yellow6×6, purple7×7, redfourdisconnectedgroups7/7/8/9cells(12/12/14/16points), green7×9irregulartree31cells/7endpoints, blue3×22.213playablecells,35bonussites total. Need record machine-readable coordinates and verify against rendered native SVG before release.

English rulebook says ties **may** play an extra round; no automatic invented money tie-break. Turns rotate first-player every deal; a round is a full cycle of first players.2players8rounds=16deals;3players5=15;4players4=16;5players3=15. Need check reshuffle/optional bonus edge clarifications.

An async question was sent for full48-card catalog before discovering the catalog on the printed reference card. That dependency is now resolved and user was told no further catalog is needed.

Resolved at completion: Dutch primary second-print PDF downloaded fully and page1 read; its end-turn text explicitly recycles/shuffles the discard when the draw stack runs out. Tucker EN optional tied round selected and documented, with full extra-round execution tested. Optional bonus ordering/declining is documented as interface timing; there is no unresolved catalog or sheet dependency. Physical global layout retained yellow/red above purple/green, blue track on right. Final verification: `verification.md`.
