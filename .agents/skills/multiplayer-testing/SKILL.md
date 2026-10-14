---
name: multiplayer-testing
description: Verify game rules and end-to-end shared-display/mobile multiplayer flows, including races, retries, privacy, and reconnection.
---

# Multiplayer Testing

## Workflow
1. Read the selected game rules, architecture, and implementation scope. Choose tests that catch actual risks rather than mirroring implementation details.
2. Test pure rule transitions with fixed state and controlled randomness. Check invariants and failure behavior, not only happy paths.
3. Test transport behavior using the actual server protocol. Use independent browser contexts for each identity and the shared display.
4. Start one room, connect a display and at least two players, then verify each client sees the correct state after an accepted action.
5. Attempt an out-of-turn action and an action with insufficient resources. Assert no mutation and a useful error.
6. Send the same action ID twice and race distinct actions from a stale revision. Assert the intended action is applied at most once and all clients converge.
7. Disconnect and reconnect a player. Assert identity, resources, turn, and pending-action resolution remain correct without creating another player.
8. Inspect actual network payloads for private information leaks. Include unauthorized display/host operations and attempted actor impersonation.
9. Exercise a complete game and final scoring. Cover selected-edition stack, movement, and betting edge cases.
10. Check mobile touch usability, shared-display readability, keyboard focus, color-independent identification, reduced motion, and Thai text rendering. Use screenshots when available.

## Reliability
Use deterministic fixtures and observable state/revision checks instead of arbitrary sleeps. Isolate rooms and test identities; clean up test resources. Test restart recovery only if persistence is implemented, otherwise document memory-only behavior.

## Completion
Report commands run, pass/fail results, scenario coverage, and unverified areas. Never describe unexecuted tests or planned browser checks as passing.
