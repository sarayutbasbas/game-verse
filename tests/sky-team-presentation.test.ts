import {test} from 'node:test';import assert from 'node:assert/strict';
import {gameEffects} from '../src/client/turn-sound.js';
import {turnStatus} from '../src/client/turn-status.js';
import {initial,rollRound,place} from './sky-team-fixtures.js';
import {getDisplayView,getPlayerView,applyAction,decisionKey} from '../src/games/sky-team/engine.js';
test('Sky Team public cues deduplicate, silent private reroll, authorized header phases',()=>{
 let s=initial(),before=getDisplayView(s,'ABC234',0);assert.equal(turnStatus(before).text,'วางแผนร่วมกัน');s=rollRound(s,[1,2,3,4],[1,2,3,4]);const rolled=getDisplayView(s,'ABC234',1);assert.deepEqual(gameEffects(before,rolled,false),[]);const own={...rolled,me:getPlayerView(s,'a')};assert.equal(turnStatus(own).own,true);
 s=place(s,'pilot','axis-pilot',1);const placed=getDisplayView(s,'ABC234',2);assert.deepEqual(gameEffects(rolled,placed,false),['place']);assert.deepEqual(gameEffects(rolled,placed,true),[]);assert.deepEqual(gameEffects(placed,placed,false),[]);assert.deepEqual(gameEffects(rolled,{...placed,revision:5},false),[]);
 s=applyAction(s,'a',{type:'sky-reroll'});before=getDisplayView(s,'ABC234',3);assert.equal(turnStatus(before).text,'เลือกลูกเต๋าทอยใหม่ส่วนตัว');assert.deepEqual(gameEffects(placed,before,false),[]);s=applyAction(s,'a',{type:'sky-reroll-dice',epoch:decisionKey(s),dice:[s.dice.pilot[0].id]});assert.deepEqual(gameEffects(before,getDisplayView(s,'ABC234',4),false),[]);
});
