# Project instructions

## Product
Build a browser-based collection of shared-screen board games. Camel Up is the first game. A computer or iPad displays the public board; each player joins by QR code or room code and uses a phone as a controller. The person hosting can join as a player on their phone.

## Working conventions
- Read README.md and the relevant docs before implementation.
- Use Thai for default player-facing copy. Support Thai fonts and readable touch interfaces.
- Apply relevant skills in .agents/skills/. These are AI workflow instructions, not runtime modules.
- Keep game rules independent of rendering, networking, and storage.
- The server owns game state, validates every action, and generates random outcomes. Never trust client-supplied identity, turn ownership, money, scores, or dice results.
- Send each client only its permitted public/private projection. Hiding private data with CSS is insufficient.
- Separate the shared display role from player identity. Room creators can also play from another device.
- Reconnect must restore an authenticated player session and current state. Do not identify returning players by display name alone.
- Never put secrets or reconnect tokens in public events, URLs, QR codes, logs, or committed files.
- Specify the Camel Up edition and resolve rule ambiguities before implementing affected rules; never silently invent official rules.
- Test meaningful rule edge cases and multiplayer failure paths. Do not introduce infrastructure or dependencies without a concrete need.
- Keep implementation status honest. This starter contains guidance and folders, not a playable application.

## Skills
- frontend-design: design new screens and major visual changes.
- web-design-guidelines: review UI and accessibility; requires fetching its referenced guidelines.
- board-game-engine: game state, rules, actions, scoring, and randomness.
- realtime-rooms: room lifecycle, server protocol, identity, projections, reconnect.
- multiplayer-testing: rule and multi-device integration verification.

## Local verification and deployment (user preference)
- After completing code changes, rebuild and start the local Docker app with `npm run docker:rebuild`, then verify it at `http://localhost:5555`.
- Keep Docker data and auth cookies separate from the existing port-3000 dev app. Never replace a database or delete a data volume to rebuild.
- Vercel deployment requires a new explicit user instruction. Do not deploy, promote, or push to the linked `main` branch automatically: a push triggers Vercel deployment. Local commits are allowed.
