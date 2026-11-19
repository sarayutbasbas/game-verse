import './compact-game-ui.css';
/** One visual language for the tabletop toolbar; state/audio remain in their existing owners. */
export const closeIcon='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
export const helpIcon='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 8a4 4 0 1 1 6 3.5c-1.3.7-2 1.5-2 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="18" r="1.2" fill="currentColor"/></svg>';
export const settingsIcon='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m9 3 1-1h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1Z" transform="translate(1 0) scale(.92)"/><circle cx="12" cy="12" r="3.2"/></svg>';
const viewportRenders=new Map<HTMLElement,{render:()=>void;theme:string}>();let resizeFrame=0;
if(typeof window!=='undefined')window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{for(const [root,entry] of viewportRenders){if(root.isConnected&&document.body.classList.contains(entry.theme))entry.render();else viewportRenders.delete(root);}});});
export function fitGameViewport(root:HTMLElement,render:()=>void,theme:string){for(const old of viewportRenders.keys())if(!old.isConnected)viewportRenders.delete(old);viewportRenders.set(root,{render,theme});}
