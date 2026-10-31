# Verification

Rules tests: exact 90-card/20-mission distributions,2–5 setups,all three zones,any placement order,clockwise turns,delayed draw,all20 mission predicates,noble weighted influence and negative/neutral scores,guard immunity,assassin same-area targeting/decline/self prohibition,spy privacy including owner and permanent hidden discard,final-card assassin resolution,tied winners,JSONB key order and invalid persisted state.

400 deterministic full matches cover2/3/4/5 players,card conservation after every action,exact10/8/7/6 turns per player and final scoring.

Actual HTTP/auth/WebSocket integration:2 and5 players,distinct host/public watcher,private hands and missions,no spy-family leakage,forged actor and display hand attempts rejected,duplicate receipt at-most-once,stale revision race,server restart while assassination pending,account-bound authenticated resume and final settlement. Uses new isolated test accounts and temporary SQLite; does not verify Google OAuth.

Playwright exercises game detail generated art/tutorial,ready lobby,private phones,all30 portrait types decoding at800px,library/detail/back,missions/help,320px overflow,actual card/destination and assassin button clicks,reload and full game,score panel,manager-only restart and no JS page errors. Run against both isolated server and rebuilt Docker at5555. Screenshots/logs under ignored data/courtisans/.

Full suite and build results recorded in project progress after final run. No production deployment or branch push is part of this request.

Final run: `npm test`:443total,439passed,4existing skips,0failed. `npm run docker:rebuild`:healthy. Latest Docker Playwright:2-player68actions;5-player101actions;bothpassed (60seconds),includingrestart. `GET http://localhost:5555/health`:200 `{"ok":true}`. `git diff --check`:clean. Build's existing large-chunk advisory remains nonfatal; no new dependency added.
