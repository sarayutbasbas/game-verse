# GameVerse implementation / migration plan

Baseline 2026-10-14: Node24+TypeScript/http/ws/ViteDOM, noDB/accounts, secureper-roomtoken256bits, memory-onlyRoomService, two independentengines and scopedplatform/gameUI. Presentation baseline32Node/7browserscenariospassed. Liveport3000processmustnotrestartuntilrooms/sessionsarepersistedandcompatible

## Decisions

- Keep stack, artwork, engines, roomcodes/playerIDs/storagekeys. Add BetterAuth1.7.7 for Google+anonymousGuest using nativeNodeSQLite (officially supported); no cloudsubscription/database provisioning
- Same-origin `/api/auth/*`, Google callback `/api/auth/callback/google`; baseURL configuredserverenv. Clientsecret neverclient. Accountlinkingbyemail disabled. Guestlinkcallback moves members only on verifiedauthentication; existing-seat conflicts preserve seats and require explicit policy
- InternalaccountID distinct from immutableplayerseatID, hostpermission and displaycapability. Newroomcreator must nonGuestaccount; players accountorGuest. Display publicURL/watch continues no login requirement. Existingrooms/sessioncapabilities grandfathered until ended/closed; never identifybyname
- SQLite transactions persist acceptedroomstate/revision/receipts before successbroadcast. Versioned game/rules/schema metadata, boundedcleanup byphase, restore sockets as disconnected. No unsupported schema silently loaded
- Publicmetadataregistry separate serverengineadapter and clientUIregistry, shared ready/playercounts. Existingenginefunctions adapted without rewritingrules
- Profile/update/avatar endpoints authenticateandvalidateownID; Sharp validates image bytes, limit2MB/pixels, stripsmetadata and outputsWebP. No arbitrary imageURLs fromclient. AdminbootstrapbyinternalID/env/CLI, no publicrole-write

## Checkable stages

1. Registry/metadata/versioncontract + SQLite migrations + OAuthenvironment/docs
2. BetterAuthGoogle/Guest, profile, safe linking/session/realtime policy
3. Transactional persistence/restore/legacy migration and commonroomlifecycle
4. Mobile-first GameVerse Home/search/countfilters/recents/profile/font
5. Minimalmaintenanceadmin/structuredsafeerrors
6. HTTP/WS/DB/browser regression, restart recovery, privacy, screenshots

## Outstanding provider input

Local GoogleConsole origins `http://localhost:3000`, redirect `http://localhost:3000/api/auth/callback/google`. SetclientID/secretserver.env only. ActualGoogleproviderE2E requires credentials+consent/testuser and cannot be called passed with fixture accounts. HTTPSdeploymentdomain remains unspecified; nopublicdeployapproved. Guest onLAN can work overHTTP; GoogleOAuth onphone needs compatibleHTTPSdomain, not an unregisteredprivateIP callback

## Implementation status 2026-10-14

Stages 1–5 implemented in existing app: public catalog + typed adapters, Better Auth Google/anonymous routes, private SQLite migrations/storage, profiles/avatar processing, secure seat linking/conflict guard, account ownership, persistent receipts/rollback/recovery, common room lifecycle, GameVerse branding/Home/filter/recent/font and maintenance admin. Real Google credentials are configured locally. User confirmed successful Google sign-in and return; server verification found a Google account and session. Headless provider navigation reaches Google sign-in, but provider cancellation and Guest upgrade remain untested; no hosted services or public deploy

Live memory-only process checkpoint exported/validated 10 rooms, private backup in ignored data/checkpoints, inspector closed, switched local3000 to durable server. Initial check compared revision/player IDs/sessions/receipts/engine states against checkpoint and watched all10 with public-only projection. Existing routes/storage keys preserved. Test details/final evidence: docs/progress.md
