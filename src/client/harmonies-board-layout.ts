import {boardCoords} from '../games/harmonies/boards.js';
import type {Side} from '../games/harmonies/types.js';
import {boardCellPosition,hexPoint} from './harmonies-hex-layout.js';
/** One axial projection per board; only the shared canvas scale changes. */
export function boardLayout(side:Side){
 const coords=boardCoords(side);if(side==='A'||side==='B')return {cells:coords.map(p=>boardCellPosition(p.q,p.r)),cellWidth:22,mat:{left:0,top:-1.333333,width:92,height:97.333333}};
 const points=coords.map(p=>hexPoint(p.q,p.r)),minX=Math.min(...points.map(p=>p.x))-33,maxX=Math.max(...points.map(p=>p.x))+33,minY=Math.min(...points.map(p=>p.y))-28,maxY=Math.max(...points.map(p=>p.y))+28;
 const unit=Math.max(maxX-minX,maxY-minY)/.88,offsetX=(unit-(maxX-minX))/2,offsetY=(unit-(maxY-minY))/2;
 return {cells:points.map(p=>({x:(p.x-minX+offsetX)/unit*100,y:(p.y-minY+offsetY)/unit*100})),cellWidth:66/unit*100,mat:{left:(offsetX-6)/unit*100,top:(offsetY-6)/unit*100,width:(maxX-minX+12)/unit*100,height:(maxY-minY+12)/unit*100}};
}
