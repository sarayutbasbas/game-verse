---
name: board-game-engine
description: Implement or change board-game rules, game state, legal actions, turns, dice, betting, scoring, or reusable game-engine interfaces.
---

# Board Game Engine

## Workflow
1. Read AGENTS.md and docs/games/<game-id>/rules.md. Identify the selected edition and unresolved decisions. Ask only for decisions that block the affected behavior; continue independent work.
2. Define explicit state, phase, player IDs, action types, outcomes, and invariants. Keep public state distinct from private and server-only state.
3. Use a framework-independent game module with createInitialState, getLegalActions, applyAction, getPlayerView, getDisplayView, and isFinished (adapt names to the chosen language).
4. Pass authenticated actor identity from the server, never from an unverified payload. Validate action shape, phase, turn, resources, and game-specific legality before changing state.
5. Make transitions deterministic given state, action, and explicit random input. Generate randomness on the server; inject a seeded generator or explicit outcomes for tests. Never expose future random outcomes.
6. Apply each accepted transition atomically. Invalid actions leave state and revision unchanged. Increment revision after accepted transitions.
7. Test invariant-sensitive cases and complete-game scoring using documented rules. Report unresolved rules rather than inventing them.

## Camel Up focus
- Document the edition before choosing components, movement, special camels, betting, player limits, or scoring.
- Represent each occupied position as an ordered stack with an explicit bottom/top convention.
- Test moving a camel and every camel above it, landing order, tile effects, round boundaries, finish detection, and tied rankings where applicable to the selected rules.
- Encode round payouts, final bets, resource ownership, and settlement order explicitly.
- Keep animation timing out of rule execution; clients animate already committed results.

## Completion
Provide the implemented rule scope, evidence from meaningful tests, and any remaining edition decisions. Do not call the game complete until a full valid game reaches final settlement.
