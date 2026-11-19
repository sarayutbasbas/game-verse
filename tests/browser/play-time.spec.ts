import {test,expect} from '@playwright/test';
import {GAME_CATALOG} from '../../src/shared/catalog.js';
import {GAME_PLAY_TIMES,playTimeLabel} from '../../src/shared/play-times.js';

test('published play times appear on every game, recent games and mobile details',async({page})=>{
  test.setTimeout(180000);
  await page.route('**/api/platform',route=>route.fulfill({json:{profile:null,googleEnabled:false,games:GAME_CATALOG,recent:['mansions-of-madness','perch','love-letter'].map(gameId=>({gameId,startedAt:Date.now()-1000})),rooms:[]}}));
  await page.addInitScript(()=>localStorage.setItem('gameverse:name-it:last-played:v1',String(Date.now())));
  await page.setViewportSize({width:390,height:844});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#all-games .game-play-time')).toHaveCount(GAME_CATALOG.length);
  for(const game of GAME_CATALOG){
    const tile=page.locator(`#all-games [data-game-id="${game.id}"]`);
    await expect(tile.locator('.game-play-time')).toHaveText('ประมาณ '+playTimeLabel(game.id));
  }
  await expect(page.locator('.recent-games .game-play-time')).toHaveCount(4);
  await expect(page.locator('.recent-games [data-game-id="name-it"] .game-play-time')).toBeVisible();
  // Reconciliation and filtering keep the duration as well as the favorite order.
  await page.locator('#all-games [data-favorite="perch"]').click();
  await expect(page.locator('#all-games .game-tile').first()).toHaveAttribute('data-game-id','perch');
  await expect(page.locator('#all-games .game-play-time').first()).toHaveText('ประมาณ 45–60 นาที');
  await page.setViewportSize({width:320,height:760});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'data/qa-play-times/gallery.png',fullPage:false});
  for(const game of GAME_CATALOG){
    await page.goto('/games/'+game.id);
    await expect(page.locator('.entry-play-time')).toHaveText('ประมาณ '+playTimeLabel(game.id));
    const source=page.locator('.entry-play-time-note a').first();
    await expect(source).toHaveAttribute('href',GAME_PLAY_TIMES[game.id].source);
    await expect(source).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),game.id).toBe(true);
  }
  await page.goto('/games/love-letter');
  await expect(page.locator('.entry-play-time-note')).toContainText('Classic ประมาณ 20 นาที · Marvel ประมาณ 15 นาที');
  await expect(page.locator('.entry-play-time-note a')).toHaveCount(2);
  await page.screenshot({path:'data/qa-play-times/detail.png',fullPage:false});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/games/wealth-of-nations');
  await expect(page.locator('.entry-play-time')).toBeVisible();
  await page.screenshot({path:'data/qa-play-times/desktop.png'});
  expect(errors).toEqual([]);
});
