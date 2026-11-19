import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GAME_CATALOG} from '../src/shared/catalog.js';
import {GAME_PLAY_TIMES} from '../src/shared/play-times.js';

test('every catalogue game has a positive sourced time range matching legacy metadata',()=>{
  assert.deepEqual(Object.keys(GAME_PLAY_TIMES).sort(),GAME_CATALOG.map(g=>g.id).sort());
  for(const game of GAME_CATALOG){
    const time=GAME_PLAY_TIMES[game.id];
    assert.ok(time.min>0&&time.max>=time.min,game.id);
    assert.equal(time.max,game.durationMinutes,game.id);
    assert.equal(new URL(time.source).protocol,'https:',game.id);
  }
});
