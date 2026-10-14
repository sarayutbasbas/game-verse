import { test } from "node:test";
import assert from "node:assert/strict";
import * as e from "../src/games/azul/engine.js";
import { TILE_COLORS, WALL, type AzulState, type AzulAction, type TileColor } from "../src/games/azul/types.js";
import { validateAzulState } from "../src/games/azul/validation.js";
const seats = (n = 2) => Array.from({length:n}, (_,i) => ({ id:`p${i}`, name:`คน ${i}` }));
const initial = (n = 2) => e.createInitialState(seats(n), () => .42, "p0");
const apply = (s: AzulState, a: AzulAction, id = s.turn) => e.applyAction(s, id, a, () => .42);
function fixture(edit: (s: AzulState) => void) {
  const s = initial(); s.factories = s.factories.map(() => []); edit(s);
  const placed = [...s.factories.flat(), ...s.center, ...s.discard, ...s.players.flatMap(p => [
    ...p.floor.filter((c): c is TileColor => c !== "first"), ...p.pattern.flatMap(l => l.color ? Array<TileColor>(l.count).fill(l.color) : []),
    ...p.wall.flatMap((r,i) => r.flatMap((v,j) => v ? [WALL[i][j]] : [])),
  ])];
  s.bag = TILE_COLORS.flatMap(c => Array<TileColor>(20 - placed.filter(t => t === c).length).fill(c));
  assert(validateAzulState(s)); return s;
}
test("Azul setup 2/3/4 players, factory count, standard wall, secure injected starter and conservation", () => {
  for (const n of [2,3,4]) {
    const s = initial(n); assert.equal(s.factories.length,n*2+1); assert(s.factories.every(f => f.length===4));
    assert.equal(s.bag.length,100-4*(n*2+1)); assert(validateAzulState(s));
    assert(s.players.every(p => p.score===0 && p.pattern.every(l=>l.count===0)));
  }
  assert.deepEqual(WALL[1],["white","blue","yellow","red","black"]);
  assert.equal(e.createInitialState(seats(),()=>.8).starter,"p1");
  assert.throws(()=>e.createInitialState(seats(1),()=>.42));
  assert.throws(()=>e.createInitialState(seats(),()=>.42,"forged"));
  assert.throws(()=>e.createInitialState(seats(),()=>1));
});
test("draft takes ALL matching factory tiles atomically, moves leftovers to center, partial line persists",()=>{
  const s=fixture(s=>{s.factories[0]=["blue","red","blue","white"];s.factories[1]=["yellow"];});
  const after=apply(s,{type:"draft",source:0,color:"blue",target:2});
  assert.deepEqual(after.players[0].pattern[2],{color:"blue",count:2});
  assert.deepEqual(after.center,["red","white"]);assert.equal(after.factories[0].length,0);assert.equal(after.turn,"p1");
  assert.equal(s.factories[0].length,4);assert(validateAzulState(after));
  assert(!e.getDisplayView(after,"ABC234",1).players.some(p=>"bag" in p));
});
test("center keeps other colors; marker first, only once; floor overflow and full-floor marker ruling",()=>{
  let s=fixture(s=>{s.center=["red","red","blue"];s.factories[0]=["white"];s.players[0].floor=Array<TileColor>(6).fill("yellow");});
  s=apply(s,{type:"draft",source:-1,color:"red",target:-1});
  assert.deepEqual(s.center,["blue"]);assert.equal(s.firstPlayer,"p0");assert.equal(s.players[0].floor[6],"first");assert.equal(s.discard.length,2);
  s=apply(s,{type:"draft",source:-1,color:"blue",target:0});assert.equal(s.firstPlayer,"p0");assert.equal(s.players[1].floor.length,0);assert(validateAzulState(s));
  s=fixture(s=>{s.center=["red"];s.factories[0]=["white"];s.players[0].floor=Array<TileColor>(7).fill("blue");});
  s=apply(s,{type:"draft",source:-1,color:"red",target:-1});
  assert.equal(s.firstPlayer,"p0");assert.equal(s.players[0].floor.length,7);assert(!s.players[0].floor.includes("first"));assert.deepEqual(s.discard,["red"]);assert(validateAzulState(s));
});
test("pattern restrictions and previews: same color, occupied wall, full lines, floor overflow",()=>{
  let s=fixture(s=>{s.factories[0]=["red","red","red","red"];s.factories[1]=["blue"];s.players[0].pattern[2]={color:"red",count:2};s.players[0].pattern[1]={color:"white",count:1};s.players[0].wall[3][WALL[3].indexOf("red")]=true;});
  const offer=e.getOffers(s,"p0").find(o=>o.color==="red")!;
  assert.equal(offer.targets.find(t=>t.target===2)!.placed,1);assert.equal(offer.targets.find(t=>t.target===2)!.floor,3);
  assert.match(offer.targets.find(t=>t.target===1)!.reason,/สีเดิม/);assert.match(offer.targets.find(t=>t.target===3)!.reason,/ผนัง/);
  const before=structuredClone(s);
  for(const target of [1,3,9]) assert.throws(()=>apply(s,{type:"draft",source:0,color:"red",target}));
  assert.deepEqual(s,before);
  s=apply(s,{type:"draft",source:0,color:"red",target:2});assert.equal(s.players[0].pattern[2].count,3);assert.equal(s.players[0].floor.length,3);
  assert.match(e.targetReason(s.players[0],"red",2),/เต็ม/);assert(validateAzulState(s));
});
test("invalid actors/source/color/extra fields/marker-only center do not mutate",()=>{
  const s=initial(), before=structuredClone(s), legal=e.getLegalActions(s,s.turn)[0];
  for(const a of [{...legal,source:99},{...legal,color:"pink"},{...legal,playerId:"p1"},{...legal,target:1.2},{type:"draft",source:-1,color:"first",target:-1}]) assert.throws(()=>apply(s,a as AzulAction));
  assert.throws(()=>apply(s,legal,"p1"));assert.deepEqual(s,before);assert.deepEqual(e.getLegalActions(s,"unknown"),[]);
});
test("adjacency counts contiguous horizontal/vertical, double counts intersection, ignores gaps/diagonals",()=>{
  const wall=Array.from({length:5},()=>Array<boolean>(5).fill(false));wall[2][2]=true;
  assert.equal(e.placementPoints(wall,2,2),1);wall[2][1]=true;wall[2][0]=true;wall[2][4]=true;wall[0][0]=true;
  assert.equal(e.placementPoints(wall,2,2),3);wall[1][2]=true;wall[3][2]=true;assert.equal(e.placementPoints(wall,2,2),6);
  wall[2][1]=false;wall[2][0]=false;assert.equal(e.placementPoints(wall,2,2),3);
});
test("last draft settles once, top to bottom scoring, retains incomplete rows, floor minimum zero, next starter",()=>{
  let s=fixture(s=>{s.center=["blue"];s.players[0].pattern[0]={color:"blue",count:1};s.players[0].pattern[1]={color:"white",count:2};s.players[0].pattern[4]={color:"red",count:1};s.players[1].floor=Array<TileColor>(7).fill("yellow");});
  s=apply(s,{type:"draft",source:-1,color:"blue",target:3});
  assert.equal(s.phase,"results");assert.equal(s.settlements.length,1);
  assert.deepEqual(s.settlements[0].players[0].placements.map(p=>p.points),[1,2]);assert.equal(s.settlements[0].players[0].penalty,1);
  assert.equal(s.players[1].score,0);assert.equal(s.settlements[0].players[1].penalty,14);
  assert.equal(s.players[0].pattern[4].count,1);assert.equal(s.players[0].pattern[3].count,1);assert.equal(s.starter,"p0");
  const prior=structuredClone(s);assert.throws(()=>apply(s,{type:"draft",source:-1,color:"blue",target:-1}));assert.deepEqual(s,prior);
  s=apply(s,{type:"next-round"},"p1");assert.equal(s.round,2);assert.equal(s.turn,"p0");assert.equal(s.players[0].pattern[4].count,1);assert(validateAzulState(s));
});
test("refill exhausts old bag before shuffling discard and permits partially empty factories",()=>{
  const s=initial();s.bag=["blue"];s.discard=["red","yellow"];e.refill(s,()=>.42);
  assert.equal(s.factories.flat().length,3);assert.equal(s.factories[0][0],"blue");assert.equal(s.bag.length,0);assert.equal(s.discard.length,0);
  assert(s.factories.slice(1).every(f=>f.length===0));
});
test("all players settle before endgame, +2/+7/+10 bonuses, ties use rows then shared victory",()=>{
  const s=fixture(s=>{s.factories[0]=["yellow"];for(const p of s.players) {p.wall[0]=[true,true,true,true,false];p.pattern[0]={color:"white",count:1};p.score=10;}});
  const done=apply(s,{type:"draft",source:0,color:"yellow",target:-1});
  assert.equal(done.phase,"finished");assert.equal(done.settlements[0].players.length,2);assert.equal(done.bonus![0].rows,1);assert.equal(done.bonus![0].points,2);
  assert.deepEqual(done.winners,["p1"]); // p0 alone takes the floor penalty.
  const tie=structuredClone(s);tie.players[0].score=11;
  assert.deepEqual(apply(tie,{type:"draft",source:0,color:"yellow",target:-1}).winners,["p0","p1"]);
  const p=e.emptyBoard("x","x");p.wall=p.wall.map(r=>r.map(()=>true));assert.deepEqual(e.bonuses(p),{id:"x",rows:5,columns:5,colors:5,points:95,total:95});
  assert.throws(()=>apply(done,{type:"next-round"}));assert(validateAzulState(done));
});
test("public boards are open, bag order never projected; private actions only for authenticated actor",()=>{
  const s=initial();const view=e.getDisplayView(s,"ABC234",3);
  assert.equal(view.players.length,2);assert.equal(view.players[1].wall.length,5);assert(!("bag" in view));assert(!("discard" in view));assert(!("me" in view));
  assert.equal(e.getPlayerView(s,"p1").legal.length,0);assert(e.getPlayerView(s,"p0").offers.length);assert.throws(()=>e.getPlayerView(s,"unknown"));
  view.players[0].wall[0][0]=true;assert.equal(s.players[0].wall[0][0],false);
});
test("seeded 2–4 player complete games conserve 20 tiles of each color after every accepted action",()=>{
  for(const n of [2,3,4]) for(let seed=1;seed<=8;seed++) {
    let value=seed;const random=()=>((value=(value*1664525+1013904223)>>>0)/2**32);
    let s=e.createInitialState(seats(n),random), moves=0;
    while(s.phase!=="finished" && moves++<1500) {
      const legal=e.getLegalActions(s,s.turn);
      const best=[...legal].sort((a,b)=>(a.type==="draft" ? a.target===-1?99:a.target : -1)-(b.type==="draft"? b.target===-1?99:b.target:-1))[0];
      assert(best);s=e.applyAction(s,s.turn,best,random);assert(validateAzulState(s),`invariant n=${n} seed=${seed} round=${s.round}`);
    }
    assert.equal(s.phase,"finished");assert(s.winners!.length);assert(s.round>=5);
  }
});

test("endgame equal points are broken by completed row count before allowing a shared win",()=>{
  const s=fixture(s=>{
    s.factories[0]=["yellow"];
    for(const p of s.players){p.wall[0]=[true,true,true,true,false];p.pattern[0]={color:"white",count:1};}
    s.players[0].wall[1]=[true,true,true,true,false];s.players[0].pattern[1]={color:"black",count:2};s.players[1].score=8;
  });
  const result=apply(s,{type:"draft",source:0,color:"yellow",target:-1});
  assert.equal(result.players[0].score,result.players[1].score);
  assert.equal(result.bonus![0].rows,2);assert.equal(result.bonus![1].rows,1);assert.deepEqual(result.winners,["p0"]);assert(validateAzulState(result));
});

test("zero available tiles enters results atomically instead of leaving a drafting turn without any action",()=>{
  const s=initial(4);s.factories=s.factories.map(()=>[]);s.bag=[];s.discard=[];s.center=[];
  for(const [i,p] of s.players.entries()) {
    const missing=TILE_COLORS[i];
    p.wall=WALL.map(row=>row.map(c=>c!==missing));
    p.pattern=[{color:null,count:0},{color:missing,count:1},{color:missing,count:1},{color:missing,count:1},{color:missing,count:2}];
  }
  assert(validateAzulState(s));e.settle(s);assert.equal(s.phase,"results");
  const after=e.nextRound(s,()=>.42);assert.equal(after.phase,"results");assert.equal(after.round,2);
  assert.equal(after.settlements.length,2);assert(after.players.every(p=>p.score===0));assert(validateAzulState(after));
  assert.deepEqual(e.getLegalActions(after,"p0"),[{type:"next-round"}]);
  // Move three held tiles back to the two supplies: a real conserved shortage.
  const partial=structuredClone(after);
  partial.players[0].pattern[1]={color:null,count:0};
  partial.players[0].pattern[4]={color:null,count:0};
  partial.bag=["blue"];partial.discard=["blue","blue"];
  assert(validateAzulState(partial));
  const refilled=e.nextRound(partial,()=>.42);
  assert.equal(refilled.phase,"playing");assert.equal(refilled.factories[0].length,3);
  assert(refilled.factories.slice(1).every(f=>f.length===0));assert(validateAzulState(refilled));
});
