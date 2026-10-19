/** Seat geometry belongs to the table presentation, independently of game rules. */
export const seatPositions=(n:number):[number,number,number][]=>n===2?[[.5,.1,180],[.5,.9,0]]:n===3?[[.5,.1,180],[.83,.75,-60],[.17,.75,60]]:n===4?[[.5,.1,180],[.86,.5,-90],[.5,.9,0],[.14,.5,90]]:n===5?[[.27,.1,180],[.73,.1,180],[.86,.64,-90],[.5,.9,0],[.14,.64,90]]:[[.27,.1,180],[.73,.1,180],[.86,.5,-90],[.73,.9,0],[.27,.9,0],[.14,.5,90]];
/** Rotate the bottom of the card toward the seat, using the actual table aspect ratio. */
export function facingAngle(x:number,y:number,width:number,height:number){
 return Math.atan2((y-.5)*height,(x-.5)*width)*180/Math.PI-90;
}
export function tableCardWidth(n:number,width:number,height:number,angle:number){
 const cos=Math.abs(Math.cos(angle*Math.PI/180)),sin=Math.abs(Math.sin(angle*Math.PI/180));
 const availableWidth=width*([4,6].includes(n)?.52:.8),availableHeight=height*.64;
 return Math.max(70,Math.min(width*.44,height*.32,260,(availableWidth-56*sin)/(cos+4/3*sin),(availableHeight-56*cos)/(sin+4/3*cos)));
}
