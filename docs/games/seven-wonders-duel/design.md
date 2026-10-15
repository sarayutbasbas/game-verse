# Visual plan and asset inventory

2D tabletop, existing DOM/CSS/WAAPI. Original illustrations, no original card scans/logos used in runtime.

Tokens: Aegean sea #183b3d; deep ink #172e33; bronze #b17b28; gold #d5b568; ivory papyrus #f3e8c7; military red #9d3533. Georgia used for English title only; existing Thai font stack for all gameplay. Age layout dominant center, two cities at edges, track above; iPad folds cities below graph; phone maintains full graph and explicit detail/confirm. Align gameplay labels left; center only card faces and track. Distinct card type colors plus explicit effects/symbols, no color-only legality.

Asset inventory from catalog: 73 buildings (23/23/20 +7 guilds), 12 Wonders, 3 Age backs, 10 Progress illustrations, cover, military panorama, coin/loot/pawn symbols. Art may share an illustrated theme within a building category; unique identity/cost/effect/chain is code. Wonders each require a distinct illustration. Catalog IDs map to local asset files. Symbols/resource/science/chain are rendered by code and never inferred from generated art.

Plan: two original illustrated atlases (12 Wonders, 28 building/guild scenes), cover derived from an original panorama; separate SVG age backs and precise iconography. Runtime WebP sizes 360/640 with local SVG fallback. Never use reference image as the board. Shared layout graph is sole position source.

Motion: accepted revision + event sequence only; snapshot/duplicate/gap snaps. No turn timers. Respect reduced motion. Important private Great Library options available only to owner; no animation/alt/asset prefetch reveals hidden identities.
