import {land,player,count,sacred,neighbors,addUnit,isInvader} from './map.js';
import {fearCard} from './fear.js';
import {startResolution,settle} from './resolve.js';
import {context,note,finishCheck} from './model.js';
import type {SpiritState,SpiritPlayer,Land,Step,InvaderCard} from './types.js';
const target=(p:SpiritPlayer,steps:Step[],filter='',optional=false):Step=>({op:'land-select',player:p.id,filter:'fear:'+filter,steps,optional});
const remove=(n:number|string,filter='small',budget=false):Step=>({op:'remove',n,filter,data:budget?'budget':undefined});
const push=(n:number,filter='small',data?:string):Step=>({op:'push',n,filter,optional:true,data});
const gather=(n:number,filter='dahan'):Step=>({op:'gather',n,filter,optional:true});
const d=(n:number|string):Step=>({op:'damage',n});
export function fearSteps(s:SpiritState,id:string):Step[]{const t=s.terror,p=s.players,lands=s.lands.filter(l=>l.terrain!=='ocean'),steps:Step[]=[];
 const each=(make:(p:SpiritPlayer)=>Step)=>p.forEach(q=>steps.push(make(q))),all=(make:(l:Land)=>Step[])=>lands.forEach(l=>steps.push(...make(l).map(x=>({...x,land:l.id,player:p.find(p=>p.board===l.board)!.id}))));
 switch(id){
 case 'f0':for(const l of lands){if(t===1&&count(l,'dahan')>=2)l.skip.explore=true;if(t===2&&count(l,'dahan')>count(l,'building')||t>=3&&count(l,'dahan')>0)l.skip.build=true;}break;
 case 'f1':if(t<=2){for(const l of lands)if(Object.values(l.presence).some(n=>n>0))l.defend+=2;if(t===2)for(const q of p)q.energy+=lands.filter(l=>sacred(s,q,l)&&count(l,'invader')>0).length;}else each(q=>target(q,[remove('presence2','invader',true)],'different,presence,invaders'));break;
 case 'f2':if(t===1)each(q=>({op:'choice',player:q.id,choices:[{name:'ผลักดาฮาน',steps:[target(q,[push(1,'dahan')],'invaders')]},{name:'รวมดาฮาน',steps:[target(q,[gather(1)],'invaders')]}],optional:true}));else each(q=>target(q,[gather(2),{op:'when',test:'dahan',steps:[d(t===2?1:'dahan')]}],'different'));break;
 case 'f3':for(const l of lands)if(count(l,'dahan'))l.defend+=t===1?count(l,'dahan'):t===2?1+count(l,'dahan'):2*count(l,'dahan');break;
 case 'f4':each(q=>target(q,[d(t===1?1:t===2?'dahan':'dahan2')],'different,dahan'));break;
 case 'f5':each(q=>target(q,[remove(1,t===1?'explorer':'small')],t<=2?'coastal,'+(t===1?'explorer':'small'):'small'));break;
 case 'f6':each(q=>target(q,[t===3?{op:'choice',choices:[{name:'ถอนนักสำรวจหรือหมู่บ้าน',steps:[remove(1)]},{name:'สถานศักดิ์สิทธิ์: ถอนเมือง',steps:[{op:'fear-sacred-city'}]}]}:remove(1)],t===1?'sacred,small':'presence,invaders'));break;
 case 'f7':each(q=>target(q,[remove(1,t===3?'invader':'small')],(t===1?'one':'two')+','+(t===3?'invaders':'small')));break;
 case 'f8':for(const l of lands.filter(l=>l.coastal)){l.defend+=3*t;if(t===3||t===2&&count(l,'town')>count(l,'city'))l.skip.build=true;}break;
 case 'f9':each(q=>target(q,[push(t===1?2:t===2?3:999,t===1?'explorer':'small')],t<=2?'inland,invaders':'invaders',true));break;
 case 'f10':all(l=>t===3&&count(l,'building')?[{op:'destroy',n:count(l,'explorer'),filter:'explorer'},{op:'destroy',n:count(l,'city'),filter:'town'}]:[{op:'destroy',n:count(l,'town')+(t===2?2*count(l,'city'):0),filter:'explorer'}]);break;
 case 'f11':if(t===1)each(q=>target(q,[push(1,'explorer','seek')],'explorer',true));else if(t===2)each(q=>({op:'choice',player:q.id,optional:true,choices:[{name:'รวมนักสำรวจไปหาอาคาร',steps:[target(q,[gather(1,'explorer')],'buildings')]},{name:'รวมหมู่บ้านไปหาเมือง',steps:[target(q,[gather(1,'town')],'city')]}]}));else each(q=>target(q,[remove(3,'invader',true)],'no-city,invaders',true));break;
 case 'f12':{const removeSet:Step={op:'choice',choices:[{name:'ถอนนักสำรวจไม่เกิน 2',steps:[remove(2,'explorer')]},{name:'ถอนหมู่บ้าน 1',steps:[remove(1,'town')]}]};if(t===3)all(l=>count(l,'dahan')?[removeSet,...count(l,'dahan')>=2?[remove(1,'city')]:[]]:[]);else each(q=>target(q,t===1?[remove(1,'explorer')]:[removeSet],'dahan,'+(t===1?'explorer':'small')));break;}
 case 'f13':if(t===1)for(const l of lands.filter(l=>count(l,'city')>0))l.skip.build=true;else each(q=>target(q,[{op:'downgrade',n:1,filter:t===2?'town':'building'}],'coastal,invaders',true));break;
 case 'f14':each(q=>target(q,[remove(1,t===1?'explorer':'small')],t<=2?'inland,'+(t===1?'explorer':'small'):'small'));break;
 }
 return [...steps,{op:'fear-end'}];}
export const matching=(s:SpiritState,c?:InvaderCard)=>c?s.lands.filter(l=>l.terrain!=='ocean'&&(c.coastal?l.coastal:c.terrains.includes(l.terrain))):[];
export const exploreSource=(s:SpiritState,l:Land)=>l.coastal||count(l,'building')>0||neighbors(s,l.id,false).some(id=>count(land(s,id),'building')>0);
export function enterInvader(s:SpiritState){s.phase='invader';s.invaderStep='blight';s.invaderCompleted=[];s.remainingLands=[];for(const p of s.players)p.ready=false;note(s,'ช่วงผู้รุกราน: เสื่อมโทรม → ความกลัว → บุกทำลาย → ก่อสร้าง → สำรวจ');if(s.blighted){const steps=s.players.map(p=>s.blightCard==='b1'?{op:'choice',player:p.id,choices:[{name:'ทำลายอำนาจสถิต 1',steps:[{op:'lose-presence',n:1,player:p.id}]},{name:'ลืมพลัง 1 ใบ',steps:[{op:'forget-power',player:p.id}]}]} as Step:{op:'lose-presence',n:1,player:p.id} as Step);startResolution(s,s.players[0].id,'blighted','',steps);settle(s);}}
export function prepareInvader(s:SpiritState){let guard=0;while(s.phase==='invader'&&!s.resolution&&!s.players.some(p=>p.task||p.offer)){
 if(++guard>12)throw Error('ลำดับผู้รุกรานไม่ถูกต้อง');
 switch(s.invaderStep){
 case 'blight':s.invaderStep='fear';break;
 case 'fear':{const card=s.fearEarned.shift();if(card){s.fearCurrent=card;s.fearChosen=[];note(s,'ความกลัว: '+fearCard(card).name);startResolution(s,s.players[0].id,'fear:'+card,'',fearSteps(s,card));settle(s);if(s.resolution)return;}else{s.invaderStep='ravage';s.remainingLands=matching(s,s.ravage).map(l=>l.id);}break;}
 case 'ravage':case 'build':if(s.remainingLands.length)return;else{s.invaderStep=s.invaderStep==='ravage'?'build':'explore';if(s.invaderStep==='build')s.remainingLands=matching(s,s.build).map(l=>l.id);break;}
 case 'explore':{const card=s.invaders.shift();if(!card){s.lossPending='สำรวจต่อไม่ได้ เพราะกองผู้รุกรานหมด';finishCheck(s);return;}s.explore=card;for(const l of matching(s,card))if(!l.skip.explore&&exploreSource(s,l))addUnit(s,l,'explorer');s.invaderStep='advance';break;}
 case 'advance':if(s.ravage)s.invaderDiscard.push(s.ravage);s.ravage=s.build;s.build=s.explore;delete s.explore;s.phase='slow';for(const p of s.players)p.ready=false;note(s,'ช่วงพลังช้า: ใช้พลังช้า แล้วกดจบช่วงเมื่อพร้อม');finishCheck(s);return;
 }
 }}
export function invaderAction(s:SpiritState,id:string){const l=land(s,id),owner=s.players.find(p=>p.board===l.board)!;s.remainingLands.splice(s.remainingLands.indexOf(id),1);
 if(s.invaderStep==='build'){
 if(l.skip.build||!count(l,'invader'))return;
 const green=s.players.find(p=>p.spirit==='green');if(green&&sacred(s,green,l)){startResolution(s,owner.id,'invader-build',id,[{op:'green-check',player:green.id,data:'build'}]);return;}
 build(s,l);return;
 }
 if(l.skip.ravage||!count(l,'invader'))return;
 const green=s.players.find(p=>p.spirit==='green');startResolution(s,owner.id,'ravage',id,green&&sacred(s,green,l)?[{op:'green-check',player:green.id,data:'ravage'}]:[{op:'ravage',land:id}]);
}
export function build(s:SpiritState,l:Land){addUnit(s,l,count(l,'town')>count(l,'city')?'city':'town');note(s,l.id+' ผู้รุกรานก่อสร้าง');}
