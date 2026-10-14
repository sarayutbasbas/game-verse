---
name: realtime-rooms
description: Build or debug multiplayer rooms, QR joining, shared displays, mobile controllers, WebSocket protocols, reconnect, and state synchronization.
---

# Realtime Rooms

## Workflow
1. Read AGENTS.md and docs/architecture.md. Identify room lifecycle, client roles, session storage, and deployment topology.
2. Model lobby, playing, finished, and closed states explicitly. Define player disconnect and host disconnect behavior. A disconnected display must not silently reset a game.
3. Use a public room code or QR join URL for room discovery, with separate secure credentials for player sessions and display/host permissions. Names and room codes are not authentication.
4. Validate payload schemas, room membership, authenticated role, and legal actions on the server. Add bounded payload sizes and appropriate join/action rate limits.
5. Process mutations serially per room or use transactional concurrency control. Assign action IDs and state revisions. Deduplicate retries within a documented retention window; reject or resynchronize stale actions.
6. Broadcast public display state and individual player projections separately. Never broadcast private data and ask the browser to hide it.
7. On reconnect, verify the session, send a current authorized snapshot, and resolve pending action IDs. Reconnect must not create duplicate players or replay paid actions.
8. Explain connection states in Thai: connecting, disconnected, reconnecting, and synchronized. Keep server validation authoritative even when the UI disables a control.
9. Define room expiration, maximum players, cleanup, and restart behavior. Never claim restart durability if state is memory-only.

## Deployment checks
- Choose hosting that supports the selected persistent-connection design. Do not assume every serverless request handler can host a long-lived WebSocket server.
- For a single-process MVP, document loss on restart. Before adding multiple instances, use shared state or room ownership coordination; in-memory locks alone do not span instances.
- Use TLS in hosted environments. Keep session tokens out of join QR codes and logs.

## Completion
Verify a shared display and at least two players, invalid actions, a duplicate action, stale state, and a disconnect/reconnect cycle. Report durability limits.
