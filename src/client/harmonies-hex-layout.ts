/** Canonical flat-top axial geometry, shared by board and every habitat view.
 * STEP_X is exactly 3/4 W (49.5, not rounded 49), so neighbors share an edge.
 */
export const HEX = {width:66,height:56,stepX:49.5,stepY:56,sideDepth:4,tokenWidth:52,tokenHeight:46,layerHeight:17,cubeWidth:25,cubeHeight:28,padding:8} as const;
export const hexPoint=(q:number,r:number)=>({x:q*HEX.stepX,y:(r+q/2)*HEX.stepY});
export const hexVertices=(x=0,y=0)=>[[x-33,y],[x-16.5,y-28],[x+16.5,y-28],[x+33,y],[x+16.5,y+28],[x-16.5,y+28]];
export const hexPolygon=hexVertices().map(p=>p.join(',')).join(' ');
export const axialNeighbors=(a:{q:number;r:number},b:{q:number;r:number})=>Math.max(Math.abs(a.q-b.q),Math.abs(a.r-b.r),Math.abs(a.q+a.r-b.q-b.r))===1;
export const boardCellPosition=(q:number,r:number)=>{const p=hexPoint(q,r);return {x:(39+p.x)/3,y:(30+p.y)/3};};
export function habitatGeometry<T extends {q:number;r:number;cube:boolean;displayStack:unknown[]}>(input:T[]){
 const cells=input.map(p=>({...p,...hexPoint(p.q,p.r)})).sort((a,b)=>a.y-b.y||a.x-b.x);
 const bounds={minX:Infinity,minY:Infinity,maxX:-Infinity,maxY:-Infinity};
 for(const c of cells){const top=c.y-(c.displayStack.length-1)*HEX.layerHeight;bounds.minX=Math.min(bounds.minX,c.x-33);bounds.maxX=Math.max(bounds.maxX,c.x+33);bounds.minY=Math.min(bounds.minY,c.y-28,top-30-(c.cube?HEX.cubeHeight:0));bounds.maxY=Math.max(bounds.maxY,c.y+34);}
 bounds.minX-=HEX.padding;bounds.minY-=HEX.padding;bounds.maxX+=HEX.padding;bounds.maxY+=HEX.padding;
 return {cells,...bounds,width:bounds.maxX-bounds.minX,height:bounds.maxY-bounds.minY};
}
