# Verification — 2026-11-01

- `npm run build`:TypeScript,client Vite andserver buildpassed. Existinglarge-chunkadvisoryonly,no addeddependency.
- `npm test`:460total,456passed,4existing skips,0failed.
- Focusedrules/transport:17tests passed,including320seededfullwins acrossall supported counts/setups,all70physicalpiecesconserved afterevery action,all12equipment,physicalInfo caps,revealred/dialloss,2-racksolo,1redsafe/2redfataldetector,actualprintedRadaratanytime/perstand andTriple3except2remaining.
- RealHTTP/auth/WS:2playerMission1,3playerMission8,5playerMission4. Distincthost,phones andpublicwatcher. Foreignvalues/ranks/reserve notprojected. Host/out-of-turn/forgedactor denied. DuplicatequestionID appliedonce;staleanswer race acceptsone;restart while detector responsepending restoresprivatechoices andsameaccountidentity;allcompletewin;manager-onlynewmission andcaptainrotation. SupplementallegallyreachedpendingtradeJSON roundtrip retainsprivatechoices/conserves70.
- Playwright againstisolatedserver andDocker5555:detailbox/generatedtutorial,QRreadylobby,missionchoice,320px nohorizontalpageoverflow,ownhandhide,privatewireprojections,hint/question/ownerresponse/owncut,detectorpendingreload,solo/redreveal,all3completewins,toolread/settings/confirmedrestart/captainrotation. NoJSpageerrors.
- Dockeractualfullgames:2/M1=16actions;3/M8=47;5/M4=54. Final rebuilt Docker run: all3passed45.4seconds, including safely revealed red accessibility labels. Screenshotsreviewed forphone,publicdisplay,detectorresponse andfinaloutcome underignored`data/bomb-busters/`.
- `npm run docker:rebuild`:healthy,existingvolume retained. `GET http://localhost:5555/health`:200`{"ok":true}`. Port3000devappnotreplaced. Browserfixturesonlynewtestaccounts/rooms;notGoogleOAuthverification.

Scope limit:verifiedmissions1,4for2–5;8for3–5. Mission2 yellow rank-range footnote, missingmissioncards/secret-boxcontent andMission8two-playerfooter notinvented orshownasplayable. No assertionofall66missions,ProKit,serverlesshosting orproductiondeployment.

Final scope-review rerun: build passed; full npm test 460 total,456 passed,4 skipped,0 failed (69.3s). Removed unverified Mission2 from selectable configs and asserted rejection; initial-hint fixture now uses verified Mission4. Docker rebuilt healthy and the full2/3/5-player browser matrix passed after this change. The first local browser rerun omitted GAMEVERSE_E2E_DOCKER and could not authorize fixture hosts; rerun with the correct existing local-only fixture passed, with no product auth bypass added.
