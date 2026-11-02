import {test,expect} from '@playwright/test';
import {existsSync} from 'node:fs';
import {GAME_CATALOG} from '../../src/shared/catalog.js';

const platform={profile:null,googleEnabled:false,games:GAME_CATALOG,recent:[],rooms:[]};
test('favorite icons have accessible names and the filtered catalog shows its count',async({page})=>{
 await page.route('**/api/platform',route=>route.fulfill({json:platform}));
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const all=page.locator('#all-games'),chosen=GAME_CATALOG.at(-1)!;
 await expect(page.locator('#all-games-title')).toHaveText(`เกมทั้งหมด (${GAME_CATALOG.length})`);
 const favorite=all.locator(`[data-favorite="${chosen.id}"]`);
 await expect(favorite).toHaveText('');await expect(favorite).toHaveAccessibleName('รายการโปรด '+chosen.name);await favorite.click();
 await expect(favorite).toHaveText('');await expect(favorite).toHaveAttribute('aria-pressed','true');
 await expect(all.locator('.game-tile').first()).toHaveAttribute('data-game-id',chosen.id);
 await page.reload();await expect(favorite).toHaveAttribute('aria-pressed','true');
 await page.locator('.quick-filter summary').click();await page.getByRole('button',{name:'2 คน',exact:true}).click();
 const count=GAME_CATALOG.filter(g=>g.supportedCounts?g.supportedCounts.includes(2):g.minPlayers<=2&&g.maxPlayers>=2).length;
 await expect(page.locator('#all-games-title')).toHaveText(`เกมทั้งหมด (${count})`);
 await page.setViewportSize({width:320,height:760});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('every game has a public pregame reference with individual details and valid artwork',async({page})=>{
 test.setTimeout(180000);
 await page.route('**/api/platform',route=>route.fulfill({json:platform}));
 await page.setViewportSize({width:390,height:844});const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const game of GAME_CATALOG){
  await page.goto('/games/'+game.id);
  const trigger=page.locator(`[data-card-reference="${game.id}"]`);await expect(trigger).toBeVisible();await trigger.click();
  if(game.id==='harmonies'){
   const library=page.locator('.hm-card-library');await expect(library).toBeVisible();
   await library.locator('[data-library-card] button').first().click();await expect(library.locator('.hm-library-detail')).toBeVisible();
   await expect(library.locator('.hm-library-detail')).toContainText('คะแนน');await library.getByRole('button',{name:'กลับไปการ์ดทั้งหมด'}).click();await library.getByRole('button',{name:'ปิดคลังการ์ด'}).click();
  }else{
   const library=page.locator('.game-card-reference');await expect(library.locator('.reference-card').first()).toBeVisible();
   await library.locator('.reference-card').first().click();await expect(library.locator('.reference-detail-copy p').last()).not.toBeEmpty();
   await library.getByRole('button',{name:'กลับไปการ์ดทั้งหมด'}).click();
   // Check every page against local public artwork, including lazily loaded images.
   do{
    const sources=await library.locator('.reference-card-art img').evaluateAll(nodes=>nodes.map(node=>(node as HTMLImageElement).src));
    for(const src of sources)expect(existsSync('public'+new URL(src).pathname),`${game.id}: ${src}`).toBe(true);
    const next=library.getByRole('button',{name:'ถัดไป',exact:true});if(!await next.count()||await next.isDisabled())break;await next.click();
   }while(true);
   const search=library.getByRole('searchbox');await search.fill('zz-no-such-card');await expect(library.locator('.reference-count')).toHaveText('0 แบบ');await search.fill('');await expect(library.locator('.reference-card').first()).toBeVisible();
   expect(await library.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
   await page.keyboard.press('Escape');await expect(library).toHaveCount(0);
  }
  await expect(trigger).toBeFocused();
 }
 expect(errors).toEqual([]);
});
