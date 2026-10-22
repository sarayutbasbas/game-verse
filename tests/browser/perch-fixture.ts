import {expect,type Page} from '@playwright/test';
import type {PerchView as View,PerchAction as Action} from '../../src/games/perch/types.js';
export const readPerch=(p:Page):Promise<View>=>p.evaluate(()=>(window as any).__perchView);
export async function capturePerch(p:Page){await p.addInitScript(()=>{(window as any).__perchFrames=[];window.WebSocket=new Proxy(window.WebSocket,{construct(T,args){const ws=new T(args[0],args[1]);ws.addEventListener('message',e=>{const m=JSON.parse(e.data);(window as any).__perchFrames.push(m);if(m.type==='state')(window as any).__perchView=m.view;});return ws;}});});}
export function choosePerch(v:View,publicView:View){const a=v.me!.legal,c=v.me!.color,seat=v.players.findIndex(p=>p.id===v.me!.id),home=(['doghouse','country','hawk','corn','fox'] as const)[seat];
 return a.find(x=>x.type==='perch-activate'&&x.path.some(id=>publicView.tiles.find(t=>t.id===id)?.birds[c]))??a.find(x=>x.type==='perch-house'&&x.tile===home&&x.color===c)??a.find(x=>x.type==='perch-zap'&&x.color!==c)??a.find(x=>x.type==='perch-effect'&&x.targets.some(t=>t.color!==c))??a.find(x=>x.type==='perch-place'&&x.tile===home&&x.color===c)??a.find(x=>x.type==='perch-place'&&x.tile==='hanging')??a.find(x=>x.type==='perch-end')??a[0];}
export async function playPerch(p:Page,v:View,a:Action){const i=v.me!.legal.indexOf(a);expect(i).toBeGreaterThanOrEqual(0);
 if(a.type==='perch-place'){
  await p.locator('[data-bird="'+a.color+'"]').click();await p.locator('[data-tile="'+a.tile+'"]').click();
  const nest=p.locator('#pc-nest');if(await nest.count())await nest.selectOption(a.nest===null?'floor':String(a.nest));
  await expect(p.locator('#pc-confirm')).toBeEnabled();await p.locator('#pc-confirm').click();
 }else if(['perch-house','perch-zap','perch-zap-nest','perch-activate'].includes(a.type)){await p.locator('#pc-bonus').click();await p.getByRole('dialog').locator('[data-intent="'+i+'"]').click();}
 else await p.locator('[data-intent="'+i+'"]').click();
}
