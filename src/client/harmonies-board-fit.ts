const handSizeCache=new WeakMap<HTMLElement,{slot:string;diameter:string;squash:string}>();
/** Anchor the bottom ellipse to the axial center, then stack equal-sized
 * billboards from bottom ellipse (64%) to top cap (38%). Fixed Z increments
 * alone collapse in the top camera and hide the walls of lower cylinders. */
function alignTokenSprites(board:HTMLElement){
 for(const cell of board.querySelectorAll<HTMLElement>('.hm-cell')){
  const origin=cell.querySelector<HTMLElement>('.hm-cell-origin'),tokens=[...cell.querySelectorAll<HTMLElement>('.hm-stack>.hm-token')],base=tokens.find(t=>t.style.getPropertyValue('--level')==='0')?.querySelector<HTMLElement>('.hm-token-art');
  if(!origin||!base)continue;
  const point=origin.getBoundingClientRect(),size=base.getBoundingClientRect();
  for(const token of tokens){
   const sprite=token.querySelector<HTMLElement>('.hm-token-art');if(!sprite)continue;
   let rect=sprite.getBoundingClientRect();
   const scale=rect.width/parseFloat(getComputedStyle(sprite).width);if(!scale)continue;
   // Perspective must not make the upper disc thicker or larger than its base.
   if(sprite!==base){sprite.style.width=`${size.width/scale}px`;sprite.style.height=`${size.height/scale}px`;rect=sprite.getBoundingClientRect();}
   const level=Number(token.style.getPropertyValue('--level'));
   const x=(point.x-rect.x-rect.width*.5)/scale,y=(point.y-level*size.height*.26-rect.y-rect.height*.64)/scale;
   sprite.style.setProperty('--hm-ground-x',`${x}px`);sprite.style.setProperty('--hm-ground-y',`${y}px`);
  }
 }
}
/** Keep counts and confirmation on the top cap, above neighboring terrain. */
function alignTerrainOverlays(board:HTMLElement){
 for(const cell of board.querySelectorAll<HTMLElement>('.hm-cell')){
  const cap=[...cell.querySelectorAll<HTMLElement>('.hm-stack>.hm-token>.hm-token-art')].at(-1)?.getBoundingClientRect();
  if(!cap)continue;
  for(const marker of cell.querySelectorAll<HTMLElement>(':scope>.hm-height,:scope>.hm-terrain-preview,:scope>.hm-animal-preview')){
   const rect=marker.getBoundingClientRect(),scale=rect.width/parseFloat(getComputedStyle(marker).width);if(!scale)continue;
   const confirm=marker.classList.contains('hm-tile-confirm');
   const x=cap.x+cap.width*(confirm ? .68 : .66),y=cap.y+cap.height*(confirm ? .49 : .55);
   marker.style.setProperty('--hm-overlay-x',`${(x-rect.x-rect.width/2)/scale}px`);
   marker.style.setProperty('--hm-overlay-y',`${(y-rect.y-rect.height/2)/scale}px`);
  }
 }
}
/** Contact points come from the rendered top cap, so three-layer stacks and
 * previews use exactly the same camera projection as their terrain. */
function alignAnimalSprites(board:HTMLElement){
 const place=(figure:HTMLElement,x:number,y:number)=>{
  const img=figure.querySelector<HTMLElement>('img');if(!img)return;
  const rect=img.getBoundingClientRect(),scale=rect.width/parseFloat(getComputedStyle(img).width);
  if(!scale)return;
  const twinkles=figure.querySelector<HTMLElement>('.hm-model-twinkles');if(twinkles){twinkles.style.width=getComputedStyle(img).width;twinkles.style.height=getComputedStyle(img).height;}
  figure.style.setProperty('--hm-figure-x',`${(x-rect.x-rect.width*.5)/scale}px`);
  figure.style.setProperty('--hm-figure-y',`${(y-rect.y-rect.height*(Number(figure.dataset.modelFoot)||(figure.classList.contains('hm-original-cube')?64/70:.955)))/scale}px`);
 };
 for(const cell of board.querySelectorAll<HTMLElement>('.hm-cell')){
  const tokens=[...cell.querySelectorAll<HTMLElement>('.hm-stack>.hm-token>.hm-token-art')],cap=tokens.at(-1)?.getBoundingClientRect();if(!cap)continue;
  const models=[...cell.querySelectorAll<HTMLElement>('.hm-stack>.hm-animal-sprite,.hm-sanctuary-residents>.hm-animal-sprite,.hm-animal-preview>.hm-animal-sprite')],main=models.find(m=>!m.classList.contains('hm-whisper-model'));
  const shared=!!main&&models.some(m=>m.classList.contains('hm-whisper-model'));
  const temple=models.find(m=>m.classList.contains('hm-sanctuary-board-model'));
  const residents=temple?models.filter(m=>m.parentElement?.classList.contains('hm-sanctuary-residents')):[];
  for(const figure of models){
   const whisper=figure.classList.contains('hm-whisper-model'),resident=residents.indexOf(figure);
   const x=resident>=0?(residents.length===1?.78:[.22,.78,.5][resident]):shared?(whisper?.62:.38):.5;
   place(figure,cap.x+cap.width*x,cap.y+cap.height*(resident===2?.62:.48));
  }
 }
}
/** Fit the fixed hex field; pieces never change the garden's scale. */
export function fitHarmoniesBoards(root:HTMLElement){
 let frame=0;
 const views=[...root.querySelectorAll<HTMLElement>('.hm-root .hm-board-viewport')];
 for(const viewport of views){const cached=handSizeCache.get(viewport);if(cached&&!viewport.closest('.hm-finished')&&viewport.dataset.boardShape!=='wide'){viewport.style.setProperty('--hm-slot-size',cached.slot);viewport.style.setProperty('--hm-hand-diameter',cached.diameter);viewport.style.setProperty('--hm-hand-squash',cached.squash);}}
 const collections=[...root.querySelectorAll<HTMLElement>('.hm-owned-collection')];
 const median=(values:number[])=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
 const fit=()=>{for(const viewport of views){
  const board=viewport.querySelector<HTMLElement>('.hm-board'),rail=viewport.querySelector<HTMLElement>('.hm-board-sidebar');
  if(!board||!rail||!viewport.clientWidth)continue;
  board.querySelectorAll<HTMLElement>('.hm-token-art').forEach(e=>{e.style.removeProperty('--hm-ground-x');e.style.removeProperty('--hm-ground-y');e.style.removeProperty('width');e.style.removeProperty('height');});
  board.querySelectorAll<HTMLElement>('.hm-height,.hm-terrain-preview,.hm-animal-preview').forEach(e=>{e.style.removeProperty('--hm-overlay-x');e.style.removeProperty('--hm-overlay-y');});
  board.querySelectorAll<HTMLElement>('.hm-animal-sprite').forEach(e=>{e.style.removeProperty('--hm-figure-x');e.style.removeProperty('--hm-figure-y');});
  const hits=[...board.querySelectorAll<HTMLElement>('.hm-cell-hit')];
  const mat=board.querySelector<HTMLElement>('.hm-board-mat'),pieces=mat?[...hits,mat]:hits;
  const finished=!!viewport.closest('.hm-finished'),wide=viewport.dataset.boardShape==='wide';
  if(finished||wide){
   // Center the mat in the full viewport. End controls and the banner float outside the mat.
   board.style.removeProperty('left');board.style.removeProperty('top');board.style.removeProperty('width');board.style.removeProperty('height');board.querySelectorAll<HTMLElement>('.hm-cell').forEach(c=>c.style.removeProperty('height'));
   const v=viewport.getBoundingClientRect();
   const top=v.top+2,bottom=finished?v.bottom-2:rail.getBoundingClientRect().top-3;
   const bounds=()=>{const rs=pieces.map(e=>e.getBoundingClientRect());return {left:Math.min(...rs.map(r=>r.left)),right:Math.max(...rs.map(r=>r.right)),top:Math.min(...rs.map(r=>r.top)),bottom:Math.max(...rs.map(r=>r.bottom))}};
   let b=bounds(),width=parseFloat(getComputedStyle(board).width);
   // Reserve only the same fixed stack depth used while playing, never banner text.
   const headroom=wide&&!finished?4:median(hits.map(e=>e.getBoundingClientRect().width))*(board.dataset.maxStack==='4'?.85:.6);
   const scale=Math.min((v.width-8)/(b.right-b.left),(bottom-top)/(b.bottom-b.top+headroom));
   width*=scale*.999;board.style.width=`${width}px`;b=bounds();
   // Wide mats may grow vertically to fill the space between the draft and trays.
   // Stretch only the ground geometry; token and animal billboards retain their proportions.
   if(wide&&!finished){const stretch=Math.max(1,(bottom-top-6)/(b.bottom-b.top));board.style.height=`${width*stretch}px`;board.querySelectorAll<HTMLElement>('.hm-cell').forEach(c=>c.style.height=`${c.getBoundingClientRect().width*56/66*stretch}px`);b=bounds();}

   board.style.left=`${parseFloat(getComputedStyle(board).left)+v.left+v.width/2-(b.left+b.right)/2}px`;
   board.style.top=`${parseFloat(getComputedStyle(board).top)+(top+headroom*scale+bottom)/2-(b.top+b.bottom)/2}px`;
   alignTokenSprites(board);alignAnimalSprites(board);alignTerrainOverlays(board);
   continue;
  }
  // Frame width changes the usable garden width; settle the two together.
  for(let settle=0;settle<5;settle++){
   board.style.removeProperty('width');
   const v=viewport.getBoundingClientRect(),slot=rail.querySelector<HTMLElement>('.hm-header-hand>*')?.getBoundingClientRect(),r=rail.getBoundingClientRect();
   const slotSize=slot?.width??(parseFloat(getComputedStyle(viewport).getPropertyValue('--hm-slot-size'))||44);
   const left=v.left+2,right=(slot?.left??r.left+4)+slotSize*.1-1,cx=(left+right)/2,cy=v.top+v.height/2;
   board.style.left=`${cx-v.left}px`;
   board.style.top=`${cy-v.top}px`;
   let width=parseFloat(getComputedStyle(board).width)*1.035;
   board.style.width=`${width}px`;
   for(let pass=0;pass<4;pass++){
    const rects=pieces.map(e=>e.getBoundingClientRect());
    const x1=Math.min(...rects.map(r=>r.left)),x2=Math.max(...rects.map(r=>r.right)),y1=Math.min(...rects.map(r=>r.top)),y2=Math.max(...rects.map(r=>r.bottom));
    if(x1>=left&&x2<=right&&y1>=v.top+2&&y2<=v.bottom-2)break;
    const factor=Math.min(1,(cx-left)/Math.max(1,cx-x1),(right-cx)/Math.max(1,x2-cx),(cy-v.top-2)/Math.max(1,cy-y1),(v.bottom-2-cy)/Math.max(1,y2-cy));
    width*=Math.max(.5,factor*.995);board.style.width=`${width}px`;
   }
   // Grow the fitted garden 5%; controls may cover its right edge.
   // Only the outside viewport bounds limit this extra size.
   width*=1.05;board.style.width=`${width}px`;
   const bounds=()=>{const rs=pieces.map(e=>e.getBoundingClientRect());return {left:Math.min(...rs.map(r=>r.left)),right:Math.max(...rs.map(r=>r.right)),top:Math.min(...rs.map(r=>r.top)),bottom:Math.max(...rs.map(r=>r.bottom))}};
   let b=bounds();
   // Reserve three-layer headroom even on an empty board, so adding terrain
   // cannot change the fitted scale or push a top-row stack outside the view.
   const headroom=wide&&!finished?4:median(hits.map(e=>e.getBoundingClientRect().width))*(board.dataset.maxStack==='4'?.85:.6);
   const outerFit=Math.min(1,(v.width-4)/(b.right-b.left),(v.height-4-headroom)/(b.bottom-b.top));
   if(outerFit<1){width*=outerFit*.999;board.style.width=`${width}px`;b=bounds();}
   const dx=b.left<v.left+2?v.left+2-b.left:b.right>v.right-2?v.right-2-b.right:0;
   const dy=v.top+v.height/2-(b.top+b.bottom)/2;
   board.style.left=`${cx-v.left+dx}px`;board.style.top=`${cy-v.top+dy}px`;
   // Reserve the same token footprint even before any terrain is placed.
   // These are the canonical cell inset, sprite scale and alpha-content ratio.
   const diameter=median(hits.map(e=>e.getBoundingClientRect().width))*.68*1.63*.72;
   const squash=56/66;
   const nextSlot=Math.max(30,diameter);
   const handDiameter=Math.max(18,Math.min(nextSlot-4,(nextSlot-12)/squash));
   const size={slot:`${nextSlot.toFixed(2)}px`,diameter:`${handDiameter.toFixed(2)}px`,squash:`${Math.min(1,Math.max(.65,squash)).toFixed(3)}`};
   viewport.style.setProperty('--hm-slot-size',size.slot);
   viewport.style.setProperty('--hm-hand-diameter',size.diameter);
   viewport.style.setProperty('--hm-hand-squash',size.squash);
   handSizeCache.set(viewport,size);
   if(Math.abs(nextSlot-slotSize)<.15)break;
  }
  alignTokenSprites(board);alignAnimalSprites(board);alignTerrainOverlays(board);
 }
  // The heading belongs to the collection's left edge, independent of card order/scroll.
  for(const collection of collections){
   const heading=collection.querySelector<HTMLElement>('.hm-owned-heading'),cards=collection.querySelector<HTMLElement>('.hm-owned-cards');
   if(heading&&cards)heading.style.paddingLeft=getComputedStyle(cards).paddingLeft;
  }
  // End overlays follow the gaps, without participating in board fitting.
  const chosen=views.find(v=>v.closest('.chosen-board'))??views.find(v=>v.clientWidth>0);
  if(chosen?.closest('.hm-finished')){
   const player=chosen.closest('.hm-player'),collection=player?.querySelector<HTMLElement>('.hm-owned-collection'),controls=collection?.querySelector<HTMLElement>('.hm-finished-controls'),mat=chosen.querySelector<HTMLElement>('.hm-board-mat');
   const v=chosen.getBoundingClientRect(),c=collection?.getBoundingClientRect(),m=mat?.getBoundingClientRect();
   const alongside=!!c&&c.left>=v.right-4;
   if(controls&&c&&m)controls.style.top=`${(alongside?c.top-8:(m.bottom+c.top)/2)-c.top}px`;
   const message=root.querySelector<HTMLElement>('.hm-game-finished-message'),supply=message?.parentElement,draft=root.querySelector<HTMLElement>('.hm-drafting-panel');
   if(message&&supply&&draft){const s=supply.getBoundingClientRect(),d=draft.getBoundingClientRect();message.style.left=`${v.left+v.width/2-s.left}px`;message.style.top=`${(alongside?v.top+22:(d.bottom+v.top)/2)-s.top}px`;}
  }
 };
 fit();
 const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);});
 [...views,...collections].forEach(v=>observer.observe(v));
 return()=>{observer.disconnect();cancelAnimationFrame(frame);};
}
