import type {HarmoniesCardArt} from './harmonies-presentation.js';
export const HARMONIES_SPLASH_MIN_MS=2000;
export const harmoniesSplashArt=(style:HarmoniesCardArt)=>`/art/harmonies/splash-v1/${style}.webp`;
export interface GardenEntry {code:string;style:HarmoniesCardArt;loaded:number;total:number;ready:boolean}
const decoded=new Map<string,Promise<void>>();
function imageReady(src:string){
 let promise=decoded.get(src);if(!promise){promise=new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>{image.decode().then(()=>resolve(),reject);};image.onerror=()=>reject(Error('Unable to load garden image'));image.src=src;});decoded.set(src,promise);promise.catch(()=>decoded.delete(src));}return promise;
}
/** The visible splash has its own minimum; game readiness never uses a timer estimate. */
export async function prepareHarmoniesEntry(entry:GardenEntry,load:()=>Promise<string[]>,update:()=>void){
 const minimum=imageReady(harmoniesSplashArt(entry.style))
  .then(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))))
  .then(()=>new Promise<void>(resolve=>setTimeout(resolve,HARMONIES_SPLASH_MIN_MS)));
 const resources=(async()=>{
  const assets=[...new Set([harmoniesSplashArt(entry.style),'/art/harmonies/illustrated-v1/logo.webp',...await load()])];
  entry.total=assets.length+1;entry.loaded=0;update();
  const fonts=Promise.all([document.fonts.load('16px "Noto Sans Thai"'),document.fonts.load('16px "Harmonies Score"')]).then(()=>{entry.loaded++;update();});
  await Promise.all([fonts,...assets.map(src=>imageReady(src).then(()=>{entry.loaded++;update();}))]);
 })();
 await Promise.all([minimum,resources]);entry.ready=true;
}
export function harmoniesSplashMarkup(entry:GardenEntry){
 const percent=entry.total?Math.round(entry.loaded/entry.total*100):0;
 return `<section class="room-garden-loading hm-entry-splash" data-splash-style="${entry.style}" aria-label="กำลังเข้าสู่เกม Harmonies"><img class="hm-splash-scene" src="${harmoniesSplashArt(entry.style)}" alt="" fetchpriority="high"><img class="hm-splash-logo" src="/art/harmonies/illustrated-v1/logo.webp" alt="Harmonies"><div class="hm-splash-copy"><p role="status" aria-live="polite">กำลังเข้าสู่สวนของคุณ…</p><div class="hm-splash-progress" role="progressbar" aria-label="กำลังโหลดเกม" aria-valuemin="0" aria-valuemax="100" ${entry.total?`aria-valuenow="${percent}"`:''}><span style="width:${percent}%"></span></div><small data-splash-percent>${entry.total?percent+'%':'กำลังเตรียมสวน'}</small></div></section>`;
}
export function updateHarmoniesSplash(root:HTMLElement,entry:GardenEntry){
 const bar=root.querySelector<HTMLElement>('.hm-splash-progress');if(!bar||!entry.total)return;
 const percent=Math.round(entry.loaded/entry.total*100);bar.setAttribute('aria-valuenow',String(percent));bar.querySelector<HTMLElement>('span')!.style.width=percent+'%';root.querySelector('[data-splash-percent]')!.textContent=percent+'%';
}
