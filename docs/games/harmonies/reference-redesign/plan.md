# Approved reference implementation — 2026-10-16

A. Visual gaps: current market cards precede the landscape; cream diagram blocks split the artwork; score chips are horizontal; map textures and header are parchment-heavy; board animals are opaque models; camera controls were removed; no per-device mode selector exists in Harmonies despite the prompt's assumed existing modes. Keep rules/catalog/projections intact and reuse the newly shared DisplayMode preference contract.

B. Approved tokens: deep forest #073f3b, river #007f96, ivory #fff7dd, sand #f5d681, gold #efc747, teal selection #00b8cb. Noto Sans Thai for UI, Georgia for Harmonies title. Compact common header customized only under Harmonies theme. Terrain panel → live island → full-art animal rails → reserved sticky action tray. Desktop split market/landscape space and multi-board display.

C/D. Preserve existing CSS3D renderer with code-defined 23 cells, cylinders and exact axial habitat patterns. Sand hexes gain a thick bevel/rock foundation; tokens share capped cylinders and same-color seams. Amber six-face cubes replace opaque board figurines per new reference. Cards place the habitat on miniature hex bases directly over illustration, score/cube track on the right and title at top. Logical coordinates, stacks and variable pattern sizes stay from catalog.

E. Generate all32 original animal artworks with quiet bottom/right for overlays, plus forest-river, sand texture, card back and matching cover. Use real optimized WebP, versioned paths and a manifest. No rule symbols, scores, diagram or state baked into generated images.

F/G. Keep legal action handlers, stable DOM, snapshot-safe FX, modal controls, audio manager and multiplayer invariants. Add compact persistent camera/mode controls, sticky action preview/confirm with page space reserved, no autoscroll. Verify full game, both board sides, actual multiplayer, phone/iPad/desktop, all32 catalog diagram mappings, final Docker5555. Existing games remain regression-covered.

## Compact A/B reference revision — 2026-10-16

The latest approved reference supersedes the large-card / amber-board-cube layout above. Keep Georgia title and locally hosted Noto Sans Thai UI, saturated shared terrain palette, five terrain pyramids, public animal market before the landscape (four cards plus next-card cue), active owned cards in four columns, completed cards in a separate expandable rail. Hide player totals until final scoring; preserve server scoring and public boards. Use the existing 32-species code-native cuboid geometry catalog for placed animals; habitat diagrams retain amber cubes and exact catalog stacks.

Confirmation is a private HTML popover projected from the selected CSS3D cell, outside transformed board geometry, recalculated on viewport/camera/scroll changes, clamped and flipped to avoid viewport/tray edges. One confirmation set only; end-turn appears from the engine's legal actions when no preview is pending. A synchronous per-render submit guard prevents duplicate taps. Compact layout uses dynamic viewport height and safe-area padding; very short viewports remain scrollable instead of clipping playable content. Existing generated 32 illustrations, deck, cover and sand remain real runtime assets; a new continuous sandy riverbank environment is being prepared.
