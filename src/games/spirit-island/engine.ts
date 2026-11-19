import {DEFAULT_OPTIONS,ELEMENTS,POWERS,power} from './data.js';
import {SPIRITS,spirit,INNATES} from './spirits.js';
import {FEAR_CARDS,BLIGHT_CARDS} from './fear.js';
import {makeMap,populate,land,player,count,distance,neighbors,activeOcean} from './map.js';
import {elements,track,targets,definition,presenceLands,actor} from './selectors.js';
import {powerSteps,innateSteps,meets} from './effects.js';
import {shuffle,note,context,finishCheck,score} from './model.js';
import {current,settle,gainTask,resolutionActions,applyResolutionAction,startResolution} from './resolve.js';
import {enterInvader,prepareInvader,invaderAction,matching,exploreSource} from './invaders.js';
import type {SpiritState,SpiritOptions,SpiritAction,SpiritPlayer,SpiritView,Step,InvaderCard,Element,PresenceTask} from './types.js';
export function validOptions(raw:unknown):raw is SpiritOptions{const o=raw as SpiritOptions;return !!o&&typeof o==='object'&&Object.keys(o).sort().join(',')==='blightCard,progression'&&typeof o.blightCard==='boolean'&&typeof o.progression==='boolean';}
export function createInitialState(seats:{id:string;name:string}[],rng:()=>number=Math.random,_starter?:string,options:SpiritOptions=DEFAULT_OPTIONS):SpiritState{
 if(seats.length<1||seats.length>4||new Set(seats.map(p=>p.id)).size!==seats.length||seats.some(p=>!p.id)||!validOptions(options))throw Error('Spirit Island รองรับ 1–4 คน');
 const boards=shuffle(['A','B','C','D'],rng).slice(0,seats.length),players:SpiritPlayer[]=seats.map((p,i)=>({...p,board:boards[i],energy:0,top:0,bottom:0,destroyed:0,hand:[],discard:[],played:[],forgotten:[],progression:[],growthLeft:[],income:false,ready:false,reclaimOne:false,bonusPlays:0,bonusRange:0,bonusElements:[],anyElements:[],fastTokens:0,airUsed:0,innatesUsed:[],repeats:[],sharedPresence:[],constancy:0,drowned:0}));
 const terrains=['mountain','wetland','jungle','sands'] as const,stage1:InvaderCard[]=terrains.map((t,i)=>({id:'I'+i,stage:1,terrains:[t]})),stage2:InvaderCard[]=[...terrains.map((t,i)=>({id:'II'+i,stage:2 as const,terrains:[t]})),{id:'II4',stage:2,terrains:[],coastal:true}],stage3:InvaderCard[]=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)stage3.push({id:'III'+i+j,stage:3,terrains:[terrains[i],terrains[j]]});
 const s:SpiritState={schema:1,players,options:{...options},phase:'choose',round:1,sequence:0,lands:makeMap(boards),minor:shuffle(POWERS.filter(c=>c.kind==='minor').map(c=>c.id),rng),major:shuffle(POWERS.filter(c=>c.kind==='major').map(c=>c.id),rng),minorDiscard:[],majorDiscard:[],invaders:[...shuffle(stage1,rng).slice(0,3),...shuffle(stage2,rng).slice(0,4),...shuffle(stage3,rng).slice(0,5)],invaderDiscard:[],fearDeck:shuffle(FEAR_CARDS.map(c=>c.id),rng).slice(0,9),fearEarned:[],fearDiscard:[],revealedFear:[],fear:0,terror:1,blight:(options.blightCard?2:5)*players.length+1,blighted:false,...options.blightCard?{blightCard:shuffle(BLIGHT_CARDS.map(c=>c.id),rng)[0]}:{},queued:[],invaderStep:'blight',remainingLands:[],invaderCompleted:[],fearChosen:[],last:'เลือกภูติที่ต้องการ ทุกคนเลือกไม่ซ้ำกัน',log:[]};populate(s);return s;
}
function setup(s:SpiritState){s.phase='setup';for(const p of s.players){const sp=spirit(p.spirit!),lands=s.lands.filter(l=>l.board===p.board&&l.number>0),highest=(t:string)=>lands.filter(l=>l.terrain===t).sort((a,b)=>b.number-a.number)[0],put=(id:string,n:number)=>land(s,id).presence[p.id]=(land(s,id).presence[p.id]??0)+n;
 p.hand=[...sp.cards];if(s.options.progression&&sp.progression){p.progression=[...sp.progression];for(const id of p.progression){const deck=power(id).kind==='major'?s.major:s.minor;deck.splice(deck.indexOf(id),1);}}
 switch(p.spirit){case 'lightning':case 'dreams':put(highest('sands').id,2);p.ready=true;break;case 'river':put(highest('wetland').id,1);p.ready=true;break;case 'earth':put(highest('mountain').id,2);put(highest('jungle').id,1);p.ready=true;break;case 'shadows':put(highest('jungle').id,2);put(p.board+'5',1);p.ready=true;break;case 'green':put(highest('wetland').id,1);break;case 'thunder':for(const l of [...lands].sort((a,b)=>count(b,'dahan')-count(a,'dahan')).slice(0,2))put(l.id,1);p.ready=true;break;case 'ocean':put(p.board+'0',1);break;}
 }note(s,'วางอำนาจสถิตเริ่มต้น');}
function start(s:SpiritState){s.build=s.invaders.shift()!;for(const l of matching(s,s.build))if(exploreSource(s,l))addExplorer(s,l.id);s.phase='growth';for(const p of s.players)p.ready=false;note(s,'รอบแรก: เลือกการเติบโต แล้วรับพลังงานและเล่นการ์ด');}
import {addUnit} from './map.js';
const addExplorer=(s:SpiritState,id:string)=>addUnit(s,land(s,id),'explorer');
function setupOptions(s:SpiritState,p:SpiritPlayer){return s.lands.filter(l=>l.board===p.board&&(p.spirit==='green'?l.terrain==='jungle'&&!count(l,'dahan'):p.spirit==='ocean'?l.coastal:false));}
function taskActions(s:SpiritState,p:SpiritPlayer):SpiritAction[]{const out:SpiritAction[]=[];
 if(p.offer){for(const card of p.offer.cards)out.push({type:'si-keep',card});return out;}
 const task=p.task;if(!task)return out;
 switch(task.kind){
 case 'gain':for(const deck of p.progression.length?[power(p.progression[0]).kind as 'minor'|'major']:task.forced?[task.forced]:['minor','major'] as const)out.push({type:'si-gain',deck});break;
 case 'forget':for(const card of [...p.hand,...p.discard,...p.played.map(x=>x.card)])out.push({type:'si-forget',card});break;
 case 'reclaim':for(const card of p.discard)out.push({type:'si-reclaim',card});break;
 case 'element':{let choices=ELEMENTS.filter(e=>!task.distinct||!task.chosen.includes(e));if(s.resolution?.context.data.existingElement==='yes')choices=choices.filter(e=>elements(p)[e]>0);for(const element of choices)out.push({type:'si-element',element});break;}
 case 'presence':{let lands=presenceLands(s,p,task.spec);const fixed=s.resolution?.context.data.presenceTarget;if(fixed){const l=land(s,String(fixed));lands=task.spec.ignoreType||p.spirit!=='ocean'||l.coastal||l.terrain==='ocean'?[l]:[];}for(const l of lands){let available=false;for(const track of ['top','bottom'] as const)if(p[track]+1<(track==='top'?spirit(p.spirit!).energy.length:spirit(p.spirit!).plays.length)){out.push({type:'si-presence',land:l.id,track});available=true;}
 if(task.origin==='growth'&&p.spirit==='green'&&p.destroyed>0&&(!s.blighted||p.energy>=1))out.push({type:'si-presence',land:l.id,track:'destroyed'});
 if(!available)for(const from of s.lands.filter(q=>(q.presence[p.id]??0)>0))out.push({type:'si-presence',land:l.id,track:'board',from:from.id});}break;}
 }
 return out;
}
function speedOptions(p:SpiritPlayer,speed:'fast'|'slow',id:string,phase:SpiritState['phase']):('normal'|'air'|'token'|'innate')[]{if(phase==='slow')return speed==='slow'?['normal']:[];if(phase!=='fast')return [];if(speed==='fast')return ['normal'];const out:('air'|'token'|'innate')[]=[];if(p.spirit==='lightning'&&p.airUsed<elements(p).air)out.push('air');if(p.fastTokens>0)out.push('token');if(p.spirit==='thunder'&&id.startsWith('innate:')&&elements(p).air>=4)out.push('innate');return out;}
export function getLegalActions(s:SpiritState,id:string):SpiritAction[]{const p=s.players.find(p=>p.id===id),out:SpiritAction[]=[];if(!p||s.phase==='finished')return out;
 if(s.phase==='choose')return p.spirit?[]:SPIRITS.filter(sp=>!s.players.some(q=>q.spirit===sp.id)).map(sp=>({type:'si-spirit',spirit:sp.id}));
 if(s.phase==='setup')return p.ready?[]:setupOptions(s,p).map(l=>({type:'si-setup',land:l.id}));
 if(p.spirit==='ocean'&&p.drowned>=s.players.length)for(let amount=1;amount<=Math.floor(p.drowned/s.players.length);amount++)out.push({type:'si-drown',amount});
 if(p.task||p.offer)return [...out,...taskActions(s,p)];
 if(s.resolution)return [...out,...resolutionActions(s,id)];
 if(s.players.some(q=>q.task||q.offer))return out;
 if(s.phase==='growth'){
 if(p.ready)return out;
 if(p.growth===undefined)return [...out,...spirit(p.spirit!).growth.map((_,option)=>({type:'si-growth' as const,option}))];
 if(p.growthLeft.length)return [...out,...p.growthLeft.map((_,index)=>({type:'si-growth-step' as const,index}))];
 if(!p.income)return [...out,{type:'si-income'}];
 const sp=spirit(p.spirit!),any=sp.energy.slice(0,p.top+1).filter(e=>e==='any').length+sp.plays.slice(0,p.bottom+1).filter(e=>e==='any').length;
 if(p.anyElements.length<any)return [...out,...ELEMENTS.map(element=>({type:'si-element' as const,element}))];
 if(!p.reclaimOne&&sp.plays.slice(0,p.bottom+1).includes('reclaim'))for(const card of p.discard)out.push({type:'si-reclaim',card});
 if(p.played.length<track(p,'bottom')+p.bonusPlays)for(const card of p.hand.filter(id=>power(id).cost<=p.energy))out.push({type:'si-play',card});
 for(const card of p.played)out.push({type:'si-unplay',card:card.card});out.push({type:'si-ready'});return out;
 }
 if(s.phase==='invader'){
 if(['ravage','build'].includes(s.invaderStep))for(const l of s.remainingLands.filter(id=>land(s,id).board===p.board))out.push({type:'si-invader',land:l});return out;
 }
 if(p.ready)return out;
 for(const c of [...p.played.filter(x=>!x.used).map(x=>({id:x.card,innate:false})),...INNATES[p.spirit!].map((_,i)=>({id:'innate:'+i,innate:true})).filter(x=>!p.innatesUsed.includes(Number(x.id.split(':')[1])))]){
 const def=definition(p,c.id),speeds=speedOptions(p,def.speed,c.id,s.phase);if(c.innate&&!innateSteps(p.spirit!,Number(c.id.split(':')[1]),elements(p)).length)continue;
 for(const fast of speeds){const levels=c.innate?[1,2,3,4].filter(level=>innateSteps(p.spirit!,Number(c.id.split(':')[1]),elements(p),false,level).length):[undefined];const thresholds=!c.innate&&power(c.id).threshold&&meets(elements(p),power(c.id).threshold!)?[true,false]:[undefined];for(const shadow of [false,...p.spirit==='shadows'?[true]:[]])for(const target of targets(s,p,c.id,shadow))for(const level of levels)for(const threshold of thresholds)out.push({type:'si-use',power:c.id,target,...level===undefined?{}:{level},...threshold===undefined?{}:{threshold},...fast==='normal'?{}:{fast},...shadow?{shadow:true}:{}});}
 if(!c.innate)out.push({type:'si-pass-power',power:c.id});
 }
 for(const grant of p.repeats.filter(r=>r.used.length<r.count))for(const played of p.played.filter(x=>x.used&&!grant.used.includes(x.card)&&power(x.card).cost<=grant.maxCost&&(!grant.pay||p.energy>=power(x.card).cost)&&x.speed===s.phase))for(const target of targets(s,p,played.card))out.push({type:'si-use',power:played.card,target,repeat:grant.id});
 out.push({type:'si-ready'});return out;
}
const equal=(a:unknown,b:unknown):boolean=>{if(a===b)return true;if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const aa=a as Record<string,unknown>,bb=b as Record<string,unknown>;return Object.keys(aa).length===Object.keys(bb).length&&Object.keys(aa).every(k=>Object.hasOwn(bb,k)&&equal(aa[k],bb[k]));};
function gain(s:SpiritState,p:SpiritPlayer,deck:'minor'|'major',rng:()=>number){delete p.task;if(p.progression.length){const card=p.progression.shift()!;p.offer={kind:power(card).kind as 'minor'|'major',cards:[card]};return;}
 const pile=deck==='minor'?s.minor:s.major,discard=deck==='minor'?s.minorDiscard:s.majorDiscard,cards:string[]=[];for(let i=0;i<4;i++){if(!pile.length)pile.push(...shuffle(discard.splice(0),rng));const id=pile.shift();if(id)cards.push(id);}if(cards.length)p.offer={kind:deck,cards};}
function keep(s:SpiritState,p:SpiritPlayer,card:string){const offer=p.offer!;p.hand.push(card);const rest=offer.cards.filter(id=>id!==card),c=s.resolution?.context;if(c?.power==='j4'&&!c.data.gainLeft){c.data.gainLeft=rest;}else(offer.kind==='minor'?s.minorDiscard:s.majorDiscard).push(...rest);delete p.offer;if(c?.data.midnight==='yes')c.data.midnightCard=card;if(offer.kind==='major')p.task={kind:'forget'};}
function growthStep(s:SpiritState,p:SpiritPlayer,index:number){const step=p.growthLeft.splice(index,1)[0];switch(step.op){case 'reclaim':p.hand.push(...p.discard.splice(0));break;case 'gain':gainTask(s,p);break;case 'reclaim-one':if(p.discard.length)p.task={kind:'reclaim'};break;case 'energy':p.energy+=step.n!;break;case 'card-play':p.bonusPlays+=step.n!;break;case 'presence':p.task={kind:'presence',spec:step,origin:'growth'};break;case 'ocean-gather':case 'ocean-push':startResolution(s,p.id,'growth','',s.lands.filter(l=>l.terrain==='ocean').map(l=>({op:step.op,n:1,land:l.id,optional:true})));break;}}
function timePasses(s:SpiritState){const steps:Step[]=[];for(const p of s.players)for(let i=0;i<p.constancy;i++)steps.push({op:'constancy-return',player:p.id,optional:true});if(steps.length){for(const p of s.players)p.constancy=0;startResolution(s,s.players[0].id,'time-passes','',steps);return;}
 for(const l of s.lands){for(const u of l.units)u.damage=0;l.defend=0;l.skip={ravage:false,build:false,explore:false};l.dahanHealth=2;l.dahanSafe=false;l.ravageSafe=false;l.warning=false;l.vitality=false;l.apparitions=0;delete l.vengeance;}
 for(const p of s.players){p.discard.push(...p.played.map(x=>x.card));p.played=[];p.growth=undefined;p.growthLeft=[];p.income=false;p.ready=false;p.reclaimOne=false;p.bonusPlays=0;p.bonusRange=0;p.bonusElements=[];p.anyElements=[];p.fastTokens=0;p.airUsed=0;p.innatesUsed=[];p.repeats=[];p.sharedPresence=[];}
 s.round++;s.phase='growth';note(s,'รอบ '+s.round+' เลือกการเติบโต');}
function advance(s:SpiritState){settle(s);if(s.phase==='finished')return;let cleared=true;while(cleared){cleared=false;for(const p of s.players)if(p.task&&!taskActions(s,p).length){delete p.task;cleared=true;}if(cleared)settle(s);}if(s.resolution||s.players.some(p=>p.task||p.offer))return;
 if(s.phase==='setup'&&s.players.every(p=>p.ready))start(s);
 else if(s.phase==='growth'&&s.players.every(p=>p.ready)){s.phase='fast';for(const p of s.players)p.ready=false;note(s,'ช่วงพลังเร็ว: แตะการ์ดแล้วเลือกพื้นที่');}
 else if(s.phase==='fast'&&s.players.every(p=>p.ready))enterInvader(s);
 else if(s.phase==='slow'&&s.players.every(p=>p.ready))timePasses(s);
 if(s.phase==='invader')prepareInvader(s);settle(s);}
export function applyAction(state:SpiritState,id:string,action:SpiritAction,rng:()=>number=Math.random):SpiritState{
 if(!getLegalActions(state,id).some(a=>equal(a,action)))throw Error('ทำรายการนี้ไม่ได้ ตรวจช่วง พลังงาน และพื้นที่ที่เลือกได้');const s=structuredClone(state),p=player(s,id);
 if(s.resolution&&!p.task&&!p.offer&&action.type!=='si-drown'){applyResolutionAction(s,action);advance(s);return s;}
 switch(action.type){
 case 'si-spirit':p.spirit=action.spirit;if(s.players.every(p=>p.spirit))setup(s);break;
 case 'si-setup':land(s,action.land).presence[id]=(land(s,action.land).presence[id]??0)+1;p.ready=true;break;
 case 'si-growth':p.growth=action.option;p.growthLeft=structuredClone([...(spirit(p.spirit!).always??[]),...spirit(p.spirit!).growth[action.option]]);break;
 case 'si-growth-step':growthStep(s,p,action.index);break;
 case 'si-income':p.energy+=track(p,'top');p.income=true;note(s,p.name+' รับพลังงาน '+track(p,'top'));break;
 case 'si-presence':{const task=p.task!;if(task.kind!=='presence')throw Error('ไม่มีงานวางอำนาจสถิต');if(action.track==='board')land(s,action.from!).presence[id]--;else if(action.track==='destroyed'){p.destroyed--;if(s.blighted)p.energy--;}else p[action.track]++;land(s,action.land).presence[id]=(land(s,action.land).presence[id]??0)+1;delete p.task;if(action.track==='top'||action.track==='bottom'){const slot=(action.track==='top'?spirit(p.spirit!).energy:spirit(p.spirit!).plays)[p[action.track]];if(slot==='any')p.task={kind:'element',track:true,count:1,chosen:[],distinct:false};}if(s.resolution)delete s.resolution.context.data.presenceTarget;break;}
 case 'si-gain':gain(s,p,action.deck,rng);break;
 case 'si-keep':keep(s,p,action.card);break;
 case 'si-forget':{let i=p.hand.indexOf(action.card);if(i>=0)p.hand.splice(i,1);else if((i=p.discard.indexOf(action.card))>=0)p.discard.splice(i,1);else p.played.splice(p.played.findIndex(x=>x.card===action.card),1);p.forgotten.push(action.card);delete p.task;const c=s.resolution?.context;if(c?.data.midnight==='yes'&&action.card==='u3'){p.energy+=count(land(s,c.target),'dahan');s.resolution!.steps.unshift({op:'immediate-play',player:p.id,optional:true});}break;}
 case 'si-reclaim':p.discard.splice(p.discard.indexOf(action.card),1);p.hand.push(action.card);if(p.task)delete p.task;else p.reclaimOne=true;break;
 case 'si-element':{if(p.task?.kind==='element'){const task=p.task;task.chosen.push(action.element);if(task.track)p.anyElements.push(action.element);else p.bonusElements.push(action.element);if(task.copyTo&&task.copyTo!==p.id)player(s,task.copyTo).bonusElements.push(action.element);if(task.chosen.length===task.count){delete p.task;if(s.resolution)delete s.resolution.context.data.existingElement;}}else p.anyElements.push(action.element);break;}
 case 'si-play':p.hand.splice(p.hand.indexOf(action.card),1);p.energy-=power(action.card).cost;p.played.push({card:action.card,used:false});break;
 case 'si-unplay':p.played.splice(p.played.findIndex(x=>x.card===action.card),1);p.hand.push(action.card);p.energy+=power(action.card).cost;break;
 case 'si-ready':p.ready=true;break;
 case 'si-pass-power':p.played.find(x=>x.card===action.power)!.used=true;break;
 case 'si-use':{const inn=action.power.startsWith('innate:'),def=definition(p,action.power),e=elements(p);if(action.repeat!==undefined){const grant=p.repeats.find(r=>r.id===action.repeat)!;grant.used.push(action.power);if(grant.pay)p.energy-=power(action.power).cost;}else if(inn)p.innatesUsed.push(Number(action.power.split(':')[1]));else{const played=p.played.find(x=>x.card===action.power)!;played.used=true;played.speed=s.phase==='fast'?'fast':'slow';}if(action.fast==='air')p.airUsed++;if(action.fast==='token')p.fastTokens--;if(action.shadow)p.energy--;startResolution(s,id,action.power,action.target,inn?innateSteps(p.spirit!,Number(action.power.split(':')[1]),e,action.repeat!==undefined,action.level):powerSteps(action.power,e,action.repeat!==undefined,action.threshold),def.target==='land'?undefined:action.target,action.repeat!==undefined);note(s,p.name+' ใช้ '+(def as {name:string}).name);break;}
 case 'si-invader':invaderAction(s,action.land!);break;
 case 'si-drown':p.drowned-=action.amount*s.players.length;p.energy+=action.amount;break;
 }
 advance(s);return s;
}
export const isFinished=(s:SpiritState)=>s.phase==='finished';
export function getDisplayView(s:SpiritState,code='',revision=0):SpiritView{
 const cur=current(s),turn=cur?.id??s.players.find(p=>p.task||p.offer)?.id??s.players.find(p=>!p.ready)?.id??s.players[0].id;
 return {gameId:'spirit-island',code,revision,matchId:s.matchId,turn,phase:s.phase,round:s.round,options:{...s.options},players:s.players.map(p=>({id:p.id,name:p.name,spirit:p.spirit,board:p.board,energy:p.energy,top:p.top,bottom:p.bottom,destroyed:p.destroyed,handCount:p.hand.length,discard:[...p.discard],played:structuredClone(p.played),ready:p.ready,growth:p.growth,income:p.income,bonusPlays:p.bonusPlays,bonusRange:p.bonusRange,elements:elements(p),drowned:p.drowned})),lands:structuredClone(s.lands),fear:s.fear,fearPool:4*s.players.length,fearDeckCount:s.fearDeck.length,fearEarnedCount:s.fearEarned.length,fearCurrent:s.fearCurrent,fearDiscard:[...s.fearDiscard],revealedFear:s.revealedFear.flatMap<SpiritView['revealedFear'][number]>(card=>{const deck=s.fearDeck.indexOf(card),earned=s.fearEarned.indexOf(card);return deck>=0?[{zone:'deck' as const,index:deck,card}]:earned>=0?[{zone:'earned' as const,index:earned,card}]:[];}),terror:s.terror,blight:s.blight,blighted:s.blighted,blightCard:s.blighted?s.blightCard:undefined,ravage:s.ravage&&structuredClone(s.ravage),build:s.build&&structuredClone(s.build),explore:s.explore&&structuredClone(s.explore),invaderCount:s.invaders.length,invaderDiscard:structuredClone(s.invaderDiscard),minorCount:s.minor.length,majorCount:s.major.length,minorDiscard:[...s.minorDiscard],majorDiscard:[...s.majorDiscard],last:s.last,log:[...s.log],resolution:cur?{power:cur.c.power,owner:cur.id,target:cur.c.target,step:structuredClone(cur.step)}:undefined,invaderStep:s.invaderStep,outcome:s.outcome,reason:s.reason,score:s.phase==='finished'?score(s):undefined};
}
export function getPlayerView(s:SpiritState,id:string,code='',revision=0):SpiritView{const view=getDisplayView(s,code,revision),p=s.players.find(p=>p.id===id);if(p)view.me={id,hand:[...p.hand],offer:p.offer&&structuredClone(p.offer),task:p.task&&structuredClone(p.task),growthLeft:structuredClone(p.growthLeft),progression:[...p.progression],legal:getLegalActions(s,id)};return view;}
