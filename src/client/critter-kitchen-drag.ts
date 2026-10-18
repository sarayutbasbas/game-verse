let suppressChefClickUntil=0;
/** Pointer dragging supports touch and mouse without a renderer or drag dependency. */
export function bindChefDrag(root:HTMLElement, place:(chef:string,location:string)=>void) {
 const events=new AbortController(),{signal}=events;
 let ghost:HTMLElement|undefined,source:HTMLElement|undefined,over:HTMLButtonElement|undefined,startX=0,startY=0,pointer=-1,moved=false;
 const clear=()=>{ghost?.remove();ghost=undefined;source?.classList.remove('ck-dragging');over?.classList.remove('ck-drop-over');source=undefined;over=undefined;pointer=-1;};
 for(const card of root.querySelectorAll<HTMLElement>('.ck-route-planner [data-chef],.ck-route-planner [data-placed-chef]')){
  card.addEventListener('dragstart',e=>e.preventDefault(),{signal});
  card.addEventListener('click',e=>{if(Date.now()<suppressChefClickUntil){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,signal});
  card.addEventListener('pointerdown',e=>{
   if(card.closest<HTMLButtonElement>('button')?.disabled||e.button!==0)return;
   suppressChefClickUntil=0;clear();source=card;startX=e.clientX;startY=e.clientY;pointer=e.pointerId;moved=false;card.setPointerCapture(pointer);
  },{signal});
  card.addEventListener('pointermove',e=>{
   if(pointer!==e.pointerId||source!==card)return;
   if(!moved&&Math.hypot(e.clientX-startX,e.clientY-startY)<7)return;
   e.preventDefault();
   if(!moved){moved=true;ghost=card.cloneNode(true) as HTMLElement;ghost.removeAttribute('data-chef');ghost.removeAttribute('data-placed-chef');ghost.className='ck-chef-ghost';ghost.setAttribute('aria-hidden','true');ghost.querySelectorAll('img').forEach(img=>{img.loading='eager';img.draggable=false;});document.body.append(ghost);card.classList.add('ck-dragging');}
   ghost!.style.left=`${e.clientX}px`;ghost!.style.top=`${e.clientY}px`;
   const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLButtonElement>('.ck-route-planner [data-destination]');
   over?.classList.remove('ck-drop-over');over=target&&!target.disabled?target:undefined;over?.classList.add('ck-drop-over');
   const size=(over?.querySelector('.ck-route-slot')??card).getBoundingClientRect();
   ghost!.style.width=`${size.width}px`;ghost!.style.height=`${size.height}px`;

  },{signal});
  card.addEventListener('pointerup',e=>{
   if(pointer!==e.pointerId)return;
   const id=source?.dataset.chef??source?.dataset.placedChef,location=over?.dataset.destination,dragged=moved;
   if(card.hasPointerCapture(pointer))card.releasePointerCapture(pointer);
   if(dragged){e.preventDefault();suppressChefClickUntil=Date.now()+450;}
   clear();if(dragged&&id&&location)place(id,location);
  },{signal});
  card.addEventListener('pointercancel',clear,{signal});
 }
 return ()=>{events.abort();clear();};
}
