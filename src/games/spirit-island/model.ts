import {BLIGHT_CARDS} from './fear.js';
import {land,player,count,health,isInvader,activeOcean} from './map.js';
import {elements} from './selectors.js';
import type {SpiritState,SpiritPlayer,Land,Unit,Context,Step,Resolution} from './types.js';
export function shuffle<T>(a:T[],rng:()=>number){for(let i=a.length-1;i>0;i--){const n=rng();if(!Number.isFinite(n)||n<0||n>=1)throw Error('ค่าสุ่มไม่ถูกต้อง');const j=Math.floor(n*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function note(s:SpiritState,text:string){s.last=text;s.log.push(text);if(s.log.length>40)s.log.shift();}
export function context(s:SpiritState,owner:string,power:string,target:string,spiritTarget?:string):Context{return {owner,power,target,spiritTarget,root:++s.sequence,repeated:false,dreamed:[],data:{}};}
export function queue(s:SpiritState,owner:string,power:string,target:string,steps:Step[],spiritTarget?:string){s.queued.push({context:context(s,owner,power,target,spiritTarget),steps});}
export function fear(s:SpiritState,n:number,c?:Context,fromPower=false){if(n<=0)return;for(let i=0;i<n;i++){s.fear++;if(s.fear>=s.players.length*4){s.fear=0;const card=s.fearDeck.shift();if(card)s.fearEarned.push(card);const earned=9-s.fearDeck.length;s.terror=earned>=9?4:earned>=6?3:earned>=3?2:1;}}if(fromPower&&c){const l=s.lands.find(l=>l.id===c.target);if(l?.apparitions)l.defend+=n*l.apparitions;}if(s.terror===4)s.winPending=true;}
export function removePresence(s:SpiritState,p:SpiritPlayer,l:Land){if((l.presence[p.id]??0)<=0)throw Error('ไม่มีอำนาจสถิต');l.presence[p.id]--;p.destroyed++;if(!s.lands.some(l=>(l.presence[p.id]??0)>0))s.lossPending='ภูติสูญเสียอำนาจสถิตชิ้นสุดท้าย';}
export function directDestroy(s:SpiritState,l:Land,u:Unit,c:Context,removed=false){
 l.units.splice(l.units.indexOf(u),1);if(removed)return;
 if(u.kind==='town')fear(s,1);if(u.kind==='city')fear(s,2);
 if(isInvader(u.kind)&&c.data.bonusFilter&&(c.data.bonusFilter==='invader'||c.data.bonusFilter===u.kind))fear(s,Number(c.data.bonusFear??0),c,true);
 if((u.kind==='town'||u.kind==='city')&&c.data.mists===1)c.data.mistsKills=Number(c.data.mistsKills??0)+1;
 if(['town','city','dahan'].includes(u.kind)&&c.power!=='j18'&&c.power!=='vengeance')for(const v of l.vengeance??[]){const pending=s.queued.find(r=>r.context.power==='vengeance'&&r.context.owner===v.owner&&r.context.target===l.id&&r.context.data.trigger===c.root);if(pending)pending.steps[0].n=Number(pending.steps[0].n)+1;else{queue(s,v.owner,'vengeance',l.id,[{op:'vengeance-damage',n:1,data:v.adjacent?'adjacent':''}]);s.queued[s.queued.length-1].context.data.trigger=c.root;}}
}
export function damage(s:SpiritState,l:Land,u:Unit,n:number,c:Context,forceReal=false){
 const p=player(s,c.owner),dream=p.spirit==='dreams'&&!forceReal&&!['ravage','fear'].includes(c.power)&&!c.power.startsWith('fear:');
 if(dream){if(u.kind==='dahan'||c.dreamed.includes(u.id))return;const key='dream:'+u.id,virtual=Number(c.data[key]??0)+n;c.data[key]=virtual;if(virtual+u.damage>=health(u.kind)){c.dreamed.push(u.id);fear(s,u.kind==='city'?5:u.kind==='town'?2:0,c,true);if(u.kind!=='city')s.resolution?.steps.unshift({op:'push',n:1,filter:u.kind,data:'only:'+u.id,optional:true,land:l.id});}return;}
 if(u.kind==='dahan'&&l.dahanSafe)return;u.damage+=n;if(u.damage>=health(u.kind)+(u.kind==='dahan'?l.dahanHealth-2:0))directDestroy(s,l,u,c);
}
export function destroy(s:SpiritState,l:Land,u:Unit,c:Context,removed=false){if(removed){directDestroy(s,l,u,c,true);return;}if(player(s,c.owner).spirit==='dreams'&&c.power!=='ravage'&&!c.power.startsWith('fear:')&&c.power!=='fear')damage(s,l,u,health(u.kind),c);else if(u.kind!=='dahan'||!l.dahanSafe)directDestroy(s,l,u,c);}
export function drown(s:SpiritState,l:Land,u:Unit,c:Context,triggered=false){if(!triggered&&player(s,c.owner).spirit==='dreams'&&sourceIsPower(c)){destroy(s,l,u,c);return;}const ocean=s.players.find(p=>p.spirit==='ocean');if(!ocean)return;if(isInvader(u.kind))ocean.drowned+=health(u.kind);directDestroy(s,l,u,c);}
export function moved(s:SpiritState,from:Land,to:Land,u:Unit,c:Context,step?:Step){from.units.splice(from.units.indexOf(u),1);to.units.push(u);
 if(u.kind==='dahan'){const thunder=s.players.find(p=>p.spirit==='thunder');if(thunder&&(from.presence[thunder.id]??0)>0)s.resolution?.steps.unshift({op:'follow',player:thunder.id,land:from.id,data:to.id,optional:true});
 if(step?.data==='defend2'){from.defend=Math.max(0,from.defend-2);to.defend+=2;}
 if(step?.data==='harbingers'){const dest=(c.data.harbingers??[]) as string[];if(!dest.includes(to.id))dest.push(to.id);c.data.harbingers=dest;}
 if(step?.data==='vigor'){const dest=(c.data.vigorLands??[]) as string[];if(!dest.includes(to.id))dest.push(to.id);c.data.vigorLands=dest;}
 }
 if(activeOcean(s,to)){
 if(u.kind==='dahan'&&step?.data==='tidal'){s.resolution?.steps.unshift({op:'tidal-rescue',n:1,land:to.id,data:String(u.id),optional:true});}
 else drown(s,to,u,c,true);
 }
}
export function addBlight(s:SpiritState,l:Land,c:Context){if(l.vitality||s.blight<=0)return [];const cascade=l.blight>0;l.blight++;s.blight--;if(s.blight===0){if(s.options.blightCard&&!s.blighted){s.blighted=true;s.blight=BLIGHT_CARDS.find(x=>x.id===s.blightCard)!.count*s.players.length;note(s,'เกาะพลิกสู่ด้านเสื่อมโทรม');}else s.lossPending='กองความเสื่อมโทรมหมด';}
 const steps:Step[]=s.players.filter(p=>(l.presence[p.id]??0)>0).map(p=>({op:'lose-presence',n:1,player:p.id,land:l.id}));if(cascade)steps.push({op:'cascade',land:l.id});return steps;}
export function victory(s:SpiritState){const units=s.lands.flatMap(l=>l.units);return s.terror===4||!units.some(u=>s.terror===1?isInvader(u.kind):s.terror===2?u.kind==='town'||u.kind==='city':u.kind==='city');}
export function finishCheck(s:SpiritState){if(s.phase==='choose'||s.phase==='setup')return;if(victory(s))s.winPending=true;if(s.winPending||s.lossPending){s.phase='finished';s.outcome=s.winPending?'won':'lost';s.reason=s.winPending?s.lossPending?'ชัยชนะแห่งการเสียสละ':'ผู้รุกรานยอมถอยจากเกาะ':s.lossPending;note(s,s.reason!);delete s.resolution;s.queued=[];}}
export function score(s:SpiritState){const n=s.players.length,dahan=s.lands.reduce((n,l)=>n+count(l,'dahan'),0),blight=s.lands.reduce((n,l)=>n+l.blight,0);return (s.outcome==='won'?10+2*s.invaders.length:12-s.invaders.length)+Math.floor(dahan/n)-Math.floor(blight/n);}
export function sourceIsPower(c:Context){return /^([umj]\d+|innate:|vengeance)/.test(c.power);}
