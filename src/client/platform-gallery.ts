import {GAME_CATALOG,supportsPlayers,type GameMetadata} from '../shared/catalog.js';
import {platform} from './account.js';
import {esc} from './platform.js';

// Keep decoded artwork and the gallery tree alive across portal updates/navigation.
const mounts=new WeakMap<HTMLElement,{section:HTMLElement;update:(focus?:'filter'|'page')=>Promise<void>}>();
export function gallery(root:HTMLElement){
  const previous=mounts.get(root);
  if(previous){if(!root.contains(previous.section))root.replaceChildren(previous.section);void previous.update();return;}
  const section=document.createElement('section');section.className='platform-gallery';section.setAttribute('aria-labelledby','catalog-title');
  section.innerHTML='<h1 id="catalog-title" class="sr-only">เลือกเกม</h1><section class="catalog-section recent-games" aria-labelledby="recent-title"><div class="catalog-section-heading"><h2 id="recent-title">เกมล่าสุด</h2></div><div class="cover-gallery"></div></section><section class="catalog-section all-games" aria-labelledby="all-games-title"><div class="catalog-section-heading"><h2 id="all-games-title">เกมทั้งหมด</h2></div><div class="cover-gallery" id="all-games"></div><nav class="game-pagination" aria-label="หน้าเกมทั้งหมด"></nav></section>';
  const recentSection=section.querySelector<HTMLElement>('.recent-games')!,allSection=section.querySelector<HTMLElement>('.all-games')!;
  const recentGrid=recentSection.querySelector<HTMLElement>('.cover-gallery')!,allGrid=allSection.querySelector<HTMLElement>('.cover-gallery')!;
  const pager=section.querySelector<HTMLElement>('.game-pagination')!;
  const details=document.createElement('details');details.className='quick-filter';
  details.innerHTML='<summary><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="3" fill="currentColor" stroke="none"/></svg><span></span></summary><div class="quick-filter-panel"><h3>จำนวนผู้เล่น</h3><div class="quick-filter-options"></div></div>';
  const pools=[new Map<string,HTMLAnchorElement>(),new Map<string,HTMLAnchorElement>()];let generation=0;
  function card(g:GameMetadata,pool:Map<string,HTMLAnchorElement>,index:number){
    let node=pool.get(g.id);if(node){
      const count=`${g.minPlayers===g.maxPlayers?g.minPlayers:g.minPlayers+'–'+g.maxPlayers} คน`;
      node.setAttribute('aria-label','เลือกเล่น '+g.name);node.querySelector('.game-title')!.textContent=g.name;
      const badge=node.querySelector('.game-player-count')!;badge.textContent=count;badge.setAttribute('aria-label','ผู้เล่น '+count);
      return node;
    }
    node=document.createElement('a');node.className='game-cover';node.href='/games/'+g.id;node.setAttribute('aria-label','เลือกเล่น '+g.name);
    const count=`${g.minPlayers===g.maxPlayers?g.minPlayers:g.minPlayers+'–'+g.maxPlayers} คน`;
    node.innerHTML=`<figure><div class="game-box-scene"><img class="game-world" src="${g.cover}" alt="" aria-hidden="true" width="640" height="800" loading="lazy"><img class="game-box" src="/art/boxes/${g.id}.png" alt="กล่องเกม ${esc(g.name)}" width="640" height="800" decoding="async" ${index<2?'fetchpriority="high"':''}><span class="game-player-count" aria-label="ผู้เล่น ${count}">${count}</span></div><figcaption><h3 class="game-title" translate="no">${esc(g.name)}</h3>${g.playMode==='local'?'<span>เล่นบนเครื่องนี้</span>':''}${!['ready','beta'].includes(g.status)?'<span>พักการสร้างห้อง</span>':''}</figcaption></figure>`;
    node.querySelectorAll('img').forEach(img=>{img.onerror=()=>{img.style.visibility='hidden';};});pool.set(g.id,node);return node;
  }
  function reconcile(grid:HTMLElement,nodes:HTMLElement[]){if(grid.children.length!==nodes.length||nodes.some((n,i)=>grid.children[i]!==n))grid.replaceChildren(...nodes);}
  async function update(focus?:'filter'|'page'){
    const revision=++generation,games=platform.games.length?platform.games:GAME_CATALOG,max=Math.max(1,...games.map(g=>g.maxPlayers));
    const url=new URL(location.href),count=Number(url.searchParams.get('players')),requested=Number(url.searchParams.get('page'));
    const selected=Number.isInteger(count)&&count>=1&&count<=max?count:undefined;
    const matching=games.filter(g=>!selected||supportsPlayers(g,selected)),pageCount=Math.max(1,Math.ceil(matching.length/10));
    const current=Math.min(Number.isInteger(requested)&&requested>0?requested:1,pageCount);
    const seen=new Set<string>();const recent=[...platform.recent].sort((a,b)=>b.startedAt-a.startedAt).flatMap(r=>{const g=games.find(x=>x.id===r.gameId);if(!g||seen.has(g.id))return [];seen.add(g.id);return [g];}).slice(0,4).filter(g=>!selected||supportsPlayers(g,selected));
    const recentNodes=recent.map((g,i)=>card(g,pools[0],i)),nodes=matching.slice((current-1)*10,current*10).map((g,i)=>card(g,pools[1],i+recent.length));
    // Swap visible lists only when the next faces can paint; never replace images on filter.
    await Promise.all([...recentNodes,...nodes].map(n=>n.querySelector<HTMLImageElement>('.game-box')!.decode().catch(()=>{})));
    if(revision!==generation||!root.contains(section)||location.pathname!=='/')return;
    if(selected)url.searchParams.set('players',String(selected));else url.searchParams.delete('players');
    if(current>1)url.searchParams.set('page',String(current));else url.searchParams.delete('page');
    history.replaceState(history.state,'',url);
    recentSection.hidden=!recent.length;reconcile(recentGrid,recentNodes);reconcile(allGrid,nodes);
    const parent=allSection.querySelector('.catalog-section-heading')!;if(details.parentElement!==parent)parent.append(details);
    const summary=details.querySelector('summary')!;summary.setAttribute('aria-label','กรองตามจำนวนผู้เล่น'+(selected?' · '+selected+' คน':''));summary.querySelector('span')!.textContent=selected?selected+' คน':'ผู้เล่น';
    if(details.dataset.max!==String(max)){details.querySelector('.quick-filter-options')!.innerHTML=`<button type="button" class="filter-all" data-player-count="">ทุกจำนวน</button>${Array.from({length:max},(_,i)=>`<button type="button" data-player-count="${i+1}">${i+1} คน</button>`).join('')}`;details.dataset.max=String(max);}
    details.querySelectorAll<HTMLButtonElement>('[data-player-count]').forEach(b=>b.setAttribute('aria-pressed',String((Number(b.dataset.playerCount)||undefined)===selected)));
    pager.hidden=pageCount<=1;const pageKey=pageCount+':'+current;
    if(pager.dataset.key!==pageKey){pager.innerHTML=Array.from({length:pageCount},(_,i)=>`<button type="button" data-game-page="${i+1}" aria-label="หน้า ${i+1}" ${current===i+1?'aria-current="page"':''}>${i+1}</button>`).join('');pager.dataset.key=pageKey;}
    if(focus){details.open=false;if(focus==='filter')summary.focus({preventScroll:true});else{const heading=section.querySelector<HTMLElement>('#all-games-title')!;heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});}}
  }
  section.onclick=event=>{
    const button=event.target instanceof Element?event.target.closest<HTMLButtonElement>('button'):null;
    if(button?.hasAttribute('data-player-count')){const url=new URL(location.href);if(button.dataset.playerCount)url.searchParams.set('players',button.dataset.playerCount);else url.searchParams.delete('players');url.searchParams.delete('page');history.replaceState(history.state,'',url);void update('filter');}
    else if(button?.dataset.gamePage){const url=new URL(location.href);url.searchParams.set('page',button.dataset.gamePage);history.replaceState(history.state,'',url);void update('page');}
    else if(event.target instanceof Node&&!details.contains(event.target))details.open=false;
  };
  section.onkeydown=event=>{if(event.key==='Escape'&&details.open){event.preventDefault();details.open=false;details.querySelector('summary')!.focus();}};
  mounts.set(root,{section,update});root.replaceChildren(section);void update();
}
