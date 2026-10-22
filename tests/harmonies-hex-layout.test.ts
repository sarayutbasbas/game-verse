import {test} from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {ANIMAL} from '../src/games/harmonies/data.js';
import {HEX,hexPoint,hexVertices,habitatGeometry,boardCellPosition} from '../src/client/harmonies-hex-layout.js';
import {habitatLayout,illustratedHabitat,habitatDiagram,setHarmoniesCardArt,crystalForCard} from '../src/client/harmonies-presentation.js';
const batch=['animal-01','animal-02','animal-03','animal-04','animal-05','animal-22','spirit-11','spirit-09','whisper-05'];
test('six axial neighbors share exactly one flat-top edge without changing q/r or handedness',()=>{
 const dirs=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
 const expected=[[49.5,28],[0,56],[-49.5,28],[-49.5,-28],[0,-56],[49.5,-28]];
 for(const [i,[q,r]] of dirs.entries()){
  const p=hexPoint(q,r);assert.deepEqual([p.x,p.y],expected[i]);
  const shared=hexVertices().filter(a=>hexVertices(p.x,p.y).some(b=>a[0]===b[0]&&a[1]===b[1]));assert.equal(shared.length,2);
  const board=boardCellPosition(q,r),origin=boardCellPosition(0,0);assert.ok(Math.abs((board.x-origin.x)*3-p.x)<1e-9);assert.ok(Math.abs((board.y-origin.y)*3-p.y)<1e-9);
 }
});
test('all review habitats preserve catalog centers, layers, destination, uniform viewBox and depth order',()=>{
 for(const id of batch){const card=ANIMAL[id],geo=habitatGeometry(habitatLayout(id).cells),small=illustratedHabitat(id,false),large=illustratedHabitat(id,true);
 assert.equal(geo.cells.length,card.pattern.length);assert.equal(small.match(/hm-joined-hex/g)?.length,card.pattern.length);
 assert.equal(small.match(/class="hm-habitat-crystal"/g)?.length,card.pattern.filter(p=>p.cube).length);
 assert.equal(small.match(/viewBox="[^"]+"/)?.[0],large.match(/viewBox="[^"]+"/)?.[0]);assert.match(small,/preserveAspectRatio="xMidYMax meet"/);
 for(const c of geo.cells){const p=card.pattern.find(p=>p.q===c.q&&p.r===c.r)!;assert.deepEqual(c.displayStack,p.stack);assert.deepEqual({x:c.x,y:c.y},hexPoint(p.q,p.r));assert.ok(c.x-33>geo.minX&&c.x+33<geo.maxX);assert.ok(c.y-30-(c.displayStack.length-1)*HEX.layerHeight-(c.cube?28:0)>geo.minY);}
 for(let i=1;i<geo.cells.length;i++){const a=geo.cells[i-1],b=geo.cells[i];assert.ok(a.y<b.y||a.y===b.y&&a.x<=b.x);}
 assert.equal(small.match(/class="hm-habitat-token-image"/g)?.length,card.pattern.reduce((n,p)=>n+p.stack.length,0));
 }
 assert.equal(crystalForCard(ANIMAL['spirit-11']),'dinosaur-white');assert.equal(crystalForCard(ANIMAL['spirit-09']),'spirit-rainbow');assert.equal(crystalForCard(ANIMAL['animal-01']),'animal-gold');assert.equal(crystalForCard(ANIMAL['whisper-05']),'whisper-purple');
});
test('all normalized terrain and crystal sprites leave at least 12% alpha padding',async()=>{
 for(const name of ['water.png','rock.png','wood.png','leaf.png','field.png','building.png','neutral-base.png','crystal-animal-gold.webp','crystal-spirit-purple.webp','crystal-dinosaur-white.webp']){
  const {data,info}=await sharp('public/art/harmonies/tokens-v5/'+name).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(x<info.width*.12||x>=info.width*.88||y<info.height*.12||y>=info.height*.88)assert.equal(data[(y*info.width+x)*4+3],0,`${name} clipped padding`);
 }
});

test('sculpted habitats use the same joined hexes, stacks and destinations at both sizes',()=>{
 try{for(const id of Object.keys(ANIMAL))for(const large of [false,true]){
 setHarmoniesCardArt('sculpted');const sculpted=habitatDiagram(id,large,false);
 setHarmoniesCardArt('illustrated');const terrain=(markup:string)=>markup.replace(/<image class="hm-habitat-model"[^>]+\/>/g,'').replace(/<g class="hm-paper-model-stars"[^>]+>.*?<\/g>/g,'').replace(/tokens-(?:paper-v1|soft-v1|v5)\/([a-z]+)\.(?:png|svg)(?:\?v=geometry-3)?/g,'token/$1');assert.equal(terrain(sculpted),terrain(habitatDiagram(id,large,false)));
 assert.equal(sculpted.match(/class="hm-joined-hex"/g)?.length,ANIMAL[id].pattern.length);
 assert.doesNotMatch(sculpted,/hm-habitat-plane|hm-pattern-base/);
 }}finally{setHarmoniesCardArt('illustrated');}
});
