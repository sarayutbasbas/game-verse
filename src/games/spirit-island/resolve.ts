import {ELEMENTS,power} from './data.js';
import {spirit,INNATES} from './spirits.js';
import {powerSteps,innateSteps} from './effects.js';
import {land,player,count,health,isInvader,neighbors,presence,sacred,distance,addUnit,activeOcean} from './map.js';
import {amount,condition,matches,actor,stepLand,elements,presenceLands} from './selectors.js';
import {damage,destroy,directDestroy,drown,moved,addBlight,removePresence,fear,context,finishCheck,note,queue,sourceIsPower} from './model.js';
import type {SpiritState,SpiritPlayer,Step,Context,Land,Unit,SpiritAction,Piece} from './types.js';
const selectOps=new Set(['choice','damage','distinct-damage','destroy','remove','replace','push','gather','land-select','lose-presence','cascade','follow','tidal-rescue','remove-blight-near','return-presence','destroy-adjacent','repeat-power','repeat-innate','reveal-fear','exchange-gifts','constancy-return','immediate-play','wrap','vengeance-damage','downgrade','efficient-dahan','ocean-gather','ocean-push','drown-choice','thunder-presence','restore-presence']);
export function current(s:SpiritState){if(!s.resolution?.steps.length)return;const c=s.resolution.context,step=s.resolution.steps[0],id=actor(s,step,c);return {c,step,p:player(s,id),id};}
export function startResolution(s:SpiritState,owner:string,powerId:string,target:string,steps:Step[],spiritTarget?:string,repeated=false){if(s.resolution)throw Error('รอให้พลังที่กำลังใช้เสร็จก่อน');s.resolution={context:context(s,owner,powerId,target,spiritTarget),steps:structuredClone(steps)};s.resolution.context.repeated=repeated;}
export function gainTask(s:SpiritState,p:SpiritPlayer,forced?:'minor'|'major'){p.task={kind:'gain',forced};}
const targetPlayer=(s:SpiritState,c:Context)=>player(s,c.spiritTarget??c.owner);
function unitChoices(s:SpiritState,step:Step,c:Context){const l=stepLand(s,step,c);let list=l.units.filter(u=>matches(u.kind,step.filter));if(step.data?.startsWith('only:'))list=list.filter(u=>step.data!.slice(5).split(',').includes(String(u.id)));if(step.op==='distinct-damage')list=list.filter(u=>!(c.data.distinct as string[]??[]).includes(String(u.id)));if(sourceIsPower(c)&&player(s,c.owner).spirit==='dreams'&&['damage','destroy','distinct-damage'].includes(step.op))list=list.filter(u=>u.kind!=='dahan'&&!c.dreamed.includes(u.id));if(step.op==='destroy'&&l.dahanSafe)list=list.filter(u=>u.kind!=='dahan');if(step.data==='budget')list=list.filter(u=>health(u.kind)<=Number(step.n));return list;}
function landChoices(s:SpiritState,step:Step,c:Context){const p=targetPlayer(s,c);return s.lands.filter(l=>{if(l.terrain==='ocean'&&!(sourceIsPower(c)&&activeOcean(s,l)))return false;if(step.filter?.startsWith('fear:'))return step.filter.slice(5).split(',').every(f=>{switch(f){case 'different':return !s.fearChosen.includes(l.id);case 'dahan':return count(l,'dahan')>0;case 'invaders':return count(l,'invader')>0;case 'explorer':return count(l,'explorer')>0;case 'small':return count(l,'explorer')+count(l,'town')>0;case 'coastal':return l.coastal;case 'inland':return !l.coastal;case 'presence':return Object.values(l.presence).some(n=>n>0);case 'sacred':return s.players.some(q=>sacred(s,q,l));case 'one':return count(l,'invader')===1;case 'two':return count(l,'invader')<=2;case 'no-city':return count(l,'city')===0;case 'buildings':return count(l,'building')>0;case 'city':return count(l,'city')>0;default:return true;}});switch(step.filter){case 'target-presence':return (l.presence[p.id]??0)>0;case 'owner-range2':return (p.spirit!=='ocean'||l.coastal||l.terrain==='ocean')&&s.lands.some(from=>(from.presence[c.owner]??0)>0&&distance(s,from.id,l.id)<=2);case 'fear-different':return !s.fearChosen.includes(l.id);case 'dahan-different':return count(l,'dahan')>0&&!s.fearChosen.includes(l.id);case 'invaders':return count(l,'invader')>0;case 'inland':return !l.coastal;case 'coastal':return l.coastal;case 'dahan':return count(l,'dahan')>0;case 'no-city':return count(l,'city')===0;default:return true;}});}
export function resolutionActions(s:SpiritState,id:string):SpiritAction[]{const cur=current(s);if(!cur||cur.id!==id||s.players.some(p=>p.task||p.offer))return [];const {step,c,p}=cur,l=s.lands.find(l=>l.id===(step.land??c.target)),out:SpiritAction[]=[];
 const n=typeof step.n==='number'?step.n:amount(s,c,step.n,step.filter),units=l?unitChoices(s,step,c):[];
 switch(step.op){
 case 'restore-presence':out.push({type:'si-choice',index:0},{type:'si-choice',index:1});break;
 case 'choice':step.choices!.forEach((_,index)=>out.push({type:'si-choice',index}));break;
 case 'damage':case 'vengeance-damage':case 'distinct-damage':{
 const lands=step.op==='vengeance-damage'&&step.data==='adjacent'?[l!,...neighbors(s,l!.id).map(id=>land(s,id))]:[l!];
 for(const q of lands)for(const u of q.units.filter(u=>matches(u.kind,step.filter))){if(step.op==='distinct-damage'&&!units.includes(u))continue;if(player(s,c.owner).spirit==='dreams'&&sourceIsPower(c)&&(u.kind==='dahan'||c.dreamed.includes(u.id)))continue;const max=step.op==='distinct-damage'?1:Math.min(n,health(u.kind)+(u.kind==='dahan'?q.dahanHealth-2:0)-u.damage-(sourceIsPower(c)&&player(s,c.owner).spirit==='dreams'?Number(c.data['dream:'+u.id]??0):0));for(let amount=1;amount<=max;amount++)out.push({type:'si-hit',unit:u.id,amount});}break;}
 case 'destroy':case 'remove':case 'replace':case 'downgrade':case 'drown-choice':for(const u of units)out.push({type:'si-unit',unit:u.id});break;
 case 'return-presence':for(const q of s.lands.filter(q=>q.id===l!.id&&(q.presence[p.id]??0)>0))for(const track of ['top','bottom'] as const)if(p[track]>0)out.push({type:'si-presence',land:q.id,track});break;
 case 'lose-presence':case 'thunder-presence':for(const q of s.lands.filter(q=>(step.op==='thunder-presence'?distance(s,q.id,step.land!)<=1:!step.land||q.id===step.land)&&(q.presence[p.id]??0)>0))out.push({type:'si-destroy-presence',player:p.id,land:q.id});break;
 case 'cascade':for(const id of neighbors(s,l!.id,true))out.push({type:'si-land',land:id});break;
 case 'remove-blight-near':for(const q of [l!,...neighbors(s,l!.id).map(id=>land(s,id))].filter(q=>q.blight>0))out.push({type:'si-land',land:q.id});break;
 case 'destroy-adjacent':for(const q of neighbors(s,l!.id).map(id=>land(s,id)))for(const u of q.units.filter(u=>matches(u.kind,step.filter)))out.push({type:'si-unit',unit:u.id});break;
 case 'push':case 'gather':{
 const powers=sourceIsPower(c),sources=step.op==='push'?[l!]:neighbors(s,l!.id,powers).map(id=>land(s,id));for(const from of sources){let dest=step.op==='gather'?[l!]:neighbors(s,from.id,powers).map(id=>land(s,id));if(step.data==='different-destinations'){const used=c.data.destinations as string[]??[];const fresh=dest.filter(q=>!used.includes(q.id));if(fresh.length)dest=fresh;}
 if(step.data==='seek')dest=dest.filter(q=>count(q,'building')>count(from,'building'));
 for(const u of from.units.filter(u=>matches(u.kind,step.filter)&&(!step.data?.startsWith('only:')||step.data.slice(5).split(',').includes(String(u.id)))))for(const to of dest)out.push({type:'si-move',unit:u.id,from:from.id,to:to.id});}break;}
 case 'land-select':for(const q of landChoices(s,step,c))out.push({type:'si-land',land:q.id});break;
 case 'follow':out.push({type:'si-follow',follow:false},{type:'si-follow',follow:true});break;
 case 'tidal-rescue':for(const q of s.lands.filter(q=>q.coastal))out.push({type:'si-land',land:q.id});break;
 case 'wrap':{const chosen=c.data.wrapTo as string|undefined;for(const u of l!.units.filter(u=>u.kind==='dahan'&&!(c.data.wrapMoved as string[]??[]).includes(String(u.id))))for(const to of s.lands.filter(q=>q.terrain!=='ocean'&&(!chosen||q.id===chosen)))out.push({type:'si-move',unit:u.id,from:l!.id,to:to.id});break;}
 case 'repeat-power':case 'repeat-innate':{const id=step.op==='repeat-innate'?'innate:0':c.power;const owner=player(s,c.owner),d=id.startsWith('innate:')?INNATES[owner.spirit!][0]:power(id);if(!id.startsWith('innate:')&&!owner.played.some(x=>x.card===id))break;const possible=step.data==='adjacent'?neighbors(s,c.target):undefined;
 // Range/target checks for normal repeats are shared with ordinary uses.
 for(const target of possible??repeatTargets(s,owner,id))out.push({type:'si-use',power:id,target});break;}
 case 'reveal-fear':for(const zone of ['deck','earned'] as const){const deck=zone==='deck'?s.fearDeck:s.fearEarned;deck.forEach((card,index)=>{if(!s.revealedFear.includes(card))out.push({type:'si-fear',zone,index});});}break;
 case 'exchange-gifts':{const cards=p.hand;for(const card of cards)out.push({type:'si-gift',card,player:p.id===c.owner?c.spiritTarget??c.owner:c.owner});break;}
 case 'constancy-return':for(const x of p.played)out.push({type:'si-return-card',card:x.card});break;
 case 'immediate-play':{const card=String(c.data.midnightCard??'');if(p.hand.includes(card)&&p.energy>=power(card).cost)out.push({type:'si-play',card});break;}
 case 'efficient-dahan':{
 const ds=l!.units.filter(u=>u.kind==='dahan'&&(!l!.dahanSafe)),budget=n;const killable=ds.filter(u=>health(u.kind)+l!.dahanHealth-2-u.damage<=budget);for(const u of killable.length?killable:ds)out.push({type:'si-hit',unit:u.id,amount:Math.min(budget,l!.dahanHealth-u.damage)});break;}
 case 'ocean-gather':case 'ocean-push':{const ocean=l!;const sources=step.op==='ocean-gather'?neighbors(s,ocean.id,false).map(id=>land(s,id)):[ocean];const dests=step.op==='ocean-push'?neighbors(s,ocean.id,false).map(id=>land(s,id)):[ocean];for(const from of sources.filter(q=>(q.presence[p.id]??0)>0))for(const to of dests)out.push({type:'si-move',unit:0,from:from.id,to:to.id,presence:true});break;}
 }
 if(step.optional||['push','gather','damage','distinct-damage','return-presence','wrap','exchange-gifts','constancy-return','immediate-play'].includes(step.op))out.push({type:'si-skip'});
 return out;
}
// Kept as a direct import rather than a duplicated range implementation.
import {targets as repeatTargets} from './selectors.js';
export function applyResolutionAction(s:SpiritState,a:SpiritAction){const {step,c,p}=current(s)!;const l=s.lands.find(l=>l.id===(step.land??c.target));const shift=()=>s.resolution!.steps.shift(),decrease=(n=1)=>{step.n=Number(step.n)-n;if(Number(step.n)<=0)shift();};
 switch(a.type){
 case 'si-skip':if(step.op==='wrap'&&c.data.wrapTo)land(s,String(c.data.wrapTo)).defend+=5;if(step.op==='tidal-rescue'){const u=l!.units.find(u=>String(u.id)===step.data);if(u)drown(s,l!,u,c,true);}shift();break;
 case 'si-choice':shift();if(step.op==='restore-presence'){if(a.index===0){const n=Math.min(p.destroyed,Number(step.n));p.destroyed-=n;l!.presence[p.id]=(l!.presence[p.id]??0)+n;c.data.returned=n;}}else s.resolution!.steps.unshift(...structuredClone(step.choices![a.index].steps).map(q=>({...q,player:q.player??step.player,land:q.land??step.land})));break;
 case 'si-hit':{const q=s.lands.find(q=>q.units.some(u=>u.id===a.unit))!,u=q.units.find(u=>u.id===a.unit)!;if(step.op==='distinct-damage'){const seen=c.data.distinct as string[]??[];seen.push(String(u.id));c.data.distinct=seen;}if(step.op==='efficient-dahan'&&a.amount>=q.dahanHealth-u.damage)c.data.dahanKilled=Number(c.data.dahanKilled??0)+1;decrease(step.op==='distinct-damage'?1:a.amount);damage(s,q,u,a.amount,c,step.op==='efficient-dahan');break;}
 case 'si-unit':{const q=s.lands.find(q=>q.units.some(u=>u.id===a.unit))!,u=q.units.find(u=>u.id===a.unit)!;decrease(step.data==='budget'?health(u.kind):1);if(step.op==='replace'||step.op==='downgrade'){const oldDamage=u.damage,kind=step.op==='downgrade'?u.kind==='city'?'town':'explorer':step.data!.split(':')[0] as Piece,total=step.op==='downgrade'?1:Number(step.data!.split(':')[1]);directDestroy(s,q,u,c,true);for(let i=0;i<total;i++){const unit=addUnit(s,q,kind);if(unit&&oldDamage>0){const inherited=Math.min(health(kind),Math.max(0,oldDamage-i*health(kind)));damage(s,q,unit,inherited,c,true);}}}else if(step.op==='drown-choice')drown(s,q,u,c);else destroy(s,q,u,c,step.op==='remove');break;}
 case 'si-move':{decrease();const from=land(s,a.from),to=land(s,a.to);if(a.presence){from.presence[p.id]--;to.presence[p.id]=(to.presence[p.id]??0)+1;}else{const u=from.units.find(u=>u.id===a.unit)!;if(step.op==='wrap'){c.data.wrapTo=to.id;(c.data.wrapMoved as string[]??(c.data.wrapMoved=[])).push(String(u.id));c.data.wrapCount=Number(c.data.wrapCount??0)+1;if(Number(step.n)<=0)to.defend+=5;}if(step.data==='different-destinations'){const d=c.data.destinations as string[]??[];d.push(to.id);c.data.destinations=d;}moved(s,from,to,u,c,step);}break;}
 case 'si-destroy-presence':removePresence(s,p,land(s,a.land));decrease();break;
 case 'si-presence':p[a.track as 'top'|'bottom']--;l!.presence[p.id]--;c.data.returned=Number(c.data.returned??0)+1;decrease();break;
 case 'si-land':{
 shift();if(step.op==='cascade')s.resolution!.steps.unshift({op:'blight',n:1,land:a.land});
 else if(step.op==='remove-blight-near'){land(s,a.land).blight--;s.blight++;}
 else if(step.op==='tidal-rescue'){const u=l!.units.find(u=>String(u.id)===step.data);if(u){l!.units.splice(l!.units.indexOf(u),1);land(s,a.land).units.push(u);}}
 else{c.target=a.land;if(step.filter?.includes('different'))s.fearChosen.push(a.land);s.resolution!.steps.unshift(...structuredClone(step.steps??[]).map(q=>({...q,land:q.land??a.land,player:q.player??step.player})));}break;}
 case 'si-follow':shift();if(a.follow){l!.presence[p.id]--;const to=land(s,step.data!);to.presence[p.id]=(to.presence[p.id]??0)+1;}break;
 case 'si-fear':{const card=(a.zone==='deck'?s.fearDeck:s.fearEarned)[a.index];s.revealedFear.push(card);shift();break;}
 case 'si-gift':{p.hand.splice(p.hand.indexOf(a.card),1);player(s,a.player).hand.push(a.card);shift();break;}
 case 'si-return-card':p.played.splice(p.played.findIndex(x=>x.card===a.card),1);p.hand.push(a.card);shift();break;
 case 'si-play':p.hand.splice(p.hand.indexOf(a.card),1);p.energy-=power(a.card).cost;p.played.push({card:a.card,used:false});shift();break;
 case 'si-use':{shift();const old=s.resolution!,fresh={...context(s,c.owner,a.power,a.target,c.spiritTarget),repeated:true},e=elements(player(s,c.owner)),steps=a.power.startsWith('innate:')?innateSteps(player(s,c.owner).spirit!,Number(a.power.split(':')[1]),e,true):powerSteps(a.power,e,true);s.queued.unshift(old);s.resolution={context:fresh,steps};break;}
 }
}
export function settle(s:SpiritState){let guard=0;while(s.phase!=='finished'){
 if(++guard>3000)throw Error('ขั้นตอนพลังยาวเกินขอบเขต');
 if(s.players.some(p=>p.task||p.offer))return;
 if(!s.resolution){if(s.queued.length)s.resolution=s.queued.shift();else{finishCheck(s);return;}}
 const r=s.resolution!,c=r.context;
 if(!r.steps.length){delete s.resolution;if(!s.queued.length)finishCheck(s);continue;}
 const step=r.steps[0],p=player(s,actor(s,step,c)),owner=player(s,c.owner),target=targetPlayer(s,c),l=s.lands.find(l=>l.id===(step.land??c.target));
 if(step.n!==undefined&&typeof step.n!=='number')step.n=amount(s,{...c,target:step.land??c.target},step.n,step.filter);
 if(step.n!==undefined&&Number(step.n)<=0){r.steps.shift();continue;}
 if(selectOps.has(step.op)){
 const acts=resolutionActions(s,p.id);if(acts.some(a=>a.type!=='si-skip'))return;
 // Do as much as possible; zero applicable pieces does not deadlock an instruction.
 if(step.op==='wrap'&&c.data.wrapTo)land(s,String(c.data.wrapTo)).defend+=5;
 r.steps.shift();continue;
 }
 r.steps.shift();const n=Number(step.n??0),isPower=sourceIsPower(c);
 switch(step.op){
 case 'when':r.steps.unshift(...structuredClone(condition(s,{...c,target:step.land??c.target},step.test!)?step.steps??[]:step.otherwise??[]).map(q=>({...q,player:q.player??step.player,land:q.land??step.land})));break;
 case 'fear':fear(s,n,l?{...c,target:l.id}:c,isPower);break;
 case 'fear-sacred-city':if(s.players.some(p=>sacred(s,p,l!)))r.steps.unshift({op:'remove',n:1,filter:'city'});break;
 case 'forget-power':p.task={kind:'forget'};break;
 case 'green-check':r.steps.unshift({op:'choice',player:p.id,choices:[{name:'ทำลายอำนาจสถิตเพื่อข้าม',steps:[{op:'lose-presence',n:1,player:p.id,land:l!.id}]},{name:'ให้ผู้รุกรานกระทำ',steps:[{op:step.data==='build'?'do-build':'ravage',land:l!.id}]}]});break;
 case 'do-build':addUnit(s,l!,count(l!,'town')>count(l!,'city')?'city':'town');break;
 case 'ravage':{const defense=l!.defend+s.players.filter(p=>p.spirit==='earth'&&sacred(s,p,l!)).length*3,total=l!.units.reduce((n,u)=>n+(isInvader(u.kind)?u.kind==='city'?3:u.kind==='town'?2:1:0),0),dealt=Math.max(0,total-defense);c.data.beforeDahan=count(l!,'dahan');c.data.dahanKilled=0;r.steps.unshift(...(!l!.dahanSafe&&!l!.ravageSafe?[{op:'efficient-dahan',n:dealt,land:l!.id}]:[]),...(dealt>=2?[{op:'blight',n:1,land:l!.id}]:[]),{op:'counter',land:l!.id});break;}
 case 'each-damage':for(const u of [...l!.units].filter(u=>matches(u.kind,step.filter)))damage(s,l!,u,n,c);break;
 case 'defend':l!.defend+=n;break;
 case 'skip-actions':l!.skip={ravage:true,build:true,explore:true};break;
 case 'target-energy':target.energy+=n;break;
 case 'energy':owner.energy+=n;break;
 case 'presence':p.task={kind:'presence',spec:step.spec!,origin:'power'};break;
 case 'presence-target':owner.task={kind:'presence',spec:{range:0,...step.spec},origin:'power'};c.data.presenceTarget=l!.id;break;
 case 'gain-power':gainTask(s,p,step.data==='minor'?'minor':undefined);break;
 case 'midnight':c.data.midnight='yes';gainTask(s,owner,'major');break;
 case 'dahan-safe':if(c.power==='u4')l!.ravageSafe=true;else l!.dahanSafe=true;break;
 case 'apparitions':l!.apparitions++;break;
 case 'harbingers-fear':{const id=(c.data.harbingers as string[]??[]).find(id=>count(land(s,id),'building')>0);if(id)fear(s,1,c,true);break;}
 case 'target-fast':target.fastTokens+=n;break;
 case 'add-dahan':for(let i=0;i<n;i++)addUnit(s,l!,'dahan');break;
 case 'warning':l!.warning=true;break;
 case 'drown':r.steps.unshift({op:'destroy-drown',n,filter:step.filter,land:l!.id});break;
 case 'destroy-drown':{const units=l!.units.filter(u=>matches(u.kind,step.filter));if(!units.length)break;r.steps.unshift({op:'drown-choice',n,filter:step.filter,land:l!.id});break;}
 case 'element-boon':target.task={kind:'element',count:n,chosen:[],distinct:true,copyTo:s.players.length>1?owner.id:undefined};break;
 case 'existing-element':target.task={kind:'element',count:n,chosen:[],distinct:false};c.data.existingElement='yes';break;
 case 'target-defend-all':for(const q of s.lands.filter(q=>(q.presence[target.id]??0)>0))q.defend+=n;break;
 case 'constancy':target.constancy+=n;if(target!==owner)owner.constancy+=n;break;
 case 'target-range':target.bonusRange+=n;break;
 case 'blight':r.steps.unshift(...addBlight(s,l!,c));if(n>1)r.steps.splice(0,0,{...step,n:n-1});break;
 case 'remove-blight':if(l!.blight>0){l!.blight--;s.blight++;}break;
 case 'shared-presence':owner.sharedPresence.push(target.id);if(target!==owner)target.sharedPresence.push(owner.id);break;
 case 'entwined-gain':gainTask(s,target);r.steps.unshift({op:'entwined-leftovers'});break;
 case 'entwined-leftovers':{const remaining=c.data.gainLeft as string[]??[];if(remaining.length)owner.offer={kind:power(remaining[0]).kind as 'minor'|'major',cards:remaining};else gainTask(s,owner);delete c.data.gainLeft;break;}
 case 'dahan-health':l!.dahanHealth+=n;break;
 case 'vitality':l!.vitality=true;break;
 case 'mists-start':c.data.mists=1;c.data.mistsKills=0;break;
 case 'mists-fear':fear(s,Math.min(4,Number(c.data.mistsKills??0)),c,true);break;
 case 'repeat-grant':p.repeats.push({id:++s.sequence,count:n,maxCost:step.data==='paid'?99:Number(step.data),pay:step.data==='paid',used:[]});break;
 case 'talons-adjacent':for(const id of neighbors(s,l!.id))r.steps.unshift({op:'destroy',n:1,filter:'town',land:id});break;
 case 'tsunami':for(const q of s.lands.filter(q=>q.board===l!.board&&q.coastal&&q!==l))queue(s,c.owner,'j17',q.id,[{op:'fear',n:1},{op:'damage',n:4},{op:'destroy',n:1,filter:'dahan'}]);break;
 case 'vengeance':(l!.vengeance??=[]).push({owner:c.owner,adjacent:n===1});break;
 case 'vigor-after':for(const id of c.data.vigorLands as string[]??[])queue(s,c.owner,'j19',id,[{op:'damage',n:2*count(land(s,id),'dahan')}]);break;
 case 'mutual-damage':{const small=count(l!,'explorer'),large=count(l!,'town')*2+count(l!,'city')*3;r.steps.unshift({op:'damage',n:small,filter:'building'}, {op:'damage',n:large,filter:'explorer'});break;}
 case 'bonus-fear-start':c.data.bonusFilter=step.filter!;c.data.bonusFear=n;break;
 case 'bonus-fear-end':delete c.data.bonusFilter;delete c.data.bonusFear;break;
 case 'thunder-loss':{const deaths=Number(c.data.dahanKilled??0),thunder=s.players.find(p=>p.spirit==='thunder');if(deaths&&thunder)r.steps.unshift({op:'thunder-presence',n:deaths,player:thunder.id,land:l!.id});break;}
 case 'counter':{const survivors=l!.units.filter(u=>u.kind==='dahan').length,before=Number(c.data.beforeDahan??survivors);r.steps.unshift({op:'damage',n:2*(l!.warning?before:survivors),land:l!.id},{op:'thunder-loss',land:l!.id});break;}
 case 'fear-end':s.fearDiscard.push(s.fearCurrent!);delete s.fearCurrent;s.fearChosen=[];break;
 case 'wrap-end':if(c.data.wrapTo)land(s,String(c.data.wrapTo)).defend+=5;break;
 case 'replace-end':break;
 default:throw Error('ยังไม่รองรับขั้นตอน '+step.op);
 }
 }}
