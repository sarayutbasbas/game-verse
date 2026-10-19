import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seatPositions,facingAngle,tableCardWidth} from '../src/client/name-it-layout.js';
test('three-player seats point diagonally toward the true center on portrait and landscape tables',()=>{
 const seats=seatPositions(3);assert.equal(seats.length,3);
 for(const [w,h] of [[390,700],[1000,600]]){
  const angles=seats.map(([x,y])=>facingAngle(x,y,w,h));assert.equal(angles[0],-180);assert.ok(angles[1]>-90&&angles[1]<0);assert.ok(angles[2]>0&&angles[2]<90);assert.ok(Math.abs(angles[1]+angles[2])<.001);
 }
 assert.notEqual(facingAngle(.83,.75,390,700),facingAngle(.83,.75,1000,600));
});
test('every supported table provides distinct on-table seats and keeps rotated center controls within the available area',()=>{
 for(const n of [2,3,4,5,6])for(const [w,h] of [[304,430],[374,700],[828,310],[1264,650]]){
  const seats=seatPositions(n);assert.equal(seats.length,n);assert.equal(new Set(seats.map(([x,y])=>`${x},${y}`)).size,n);
  for(const [x,y] of seats){assert.ok(x>0&&x<1&&y>0&&y<1);const a=facingAngle(x,y,w,h),size=tableCardWidth(n,w,h,a),c=Math.abs(Math.cos(a*Math.PI/180)),s=Math.abs(Math.sin(a*Math.PI/180));assert.ok(size>=70);assert.ok(size*c+(size*4/3+56)*s<w);assert.ok(size*s+(size*4/3+56)*c<h);}
 }
});
