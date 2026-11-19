import type{Good,Industry,Stock}from'./types.js';
export const GOODS:Good[]=['food','energy','labor','ore','capital'];
export const INDUSTRIES:Industry[]=[...GOODS,'bank'];
export const LABEL:Record<Industry,string>={food:'อาหาร',energy:'พลังงาน',labor:'แรงงาน',ore:'แร่',capital:'ทุน',bank:'การเงิน'};
export const BUILDING:Record<Industry,string>={food:'ฟาร์ม',energy:'โรงไฟฟ้า',labor:'สถาบัน',ore:'เหมือง',capital:'โรงงาน',bank:'ธนาคาร'};
export const COLOR:Record<Industry,string>={food:'#e5bd26',energy:'#2674ae',labor:'#c84132',ore:'#d9dedc',capital:'#282b2e',bank:'#76528f'};
export const NATIONS=['Bolshevia','Federal Provinces','Bharat','Arazzaq','Showa Republic','Anglica'];
export const FLAG_COLORS=['#b62736','#318a64','#e4b934','#328797','#7460ab','#354c85'];
export const stock=(food=0,energy=0,labor=0,ore=0,capital=0):Stock=>({food,energy,labor,ore,capital});
export const TILE_TOTAL:Record<Industry,number>={food:15,energy:9,labor:9,ore:9,capital:9,bank:9};
export const CUBE_TOTAL=stock(60,50,50,40,40);
export const COST:Record<Industry,Stock>={food:stock(0,0,0,1,1),energy:stock(0,0,0,1,1),labor:stock(0,0,0,1,1),ore:stock(0,1,1,0,1),capital:stock(0,0,1,2,0),bank:stock(0,1,0,1,1)};
export const MARKET:Record<Good,{buy:number[];sell:number[]}>={
 food:{buy:[13,12,12,12,11,11,11,10,10,10,9,9,9,9,8,8,8,7,7,7,6,6,6,6,6,6,6,5,5,5,5,5,5,5,4,4,4,3,3,2],sell:[10,9,9,9,8,8,8,7,7,7,6,6,6,6,5,5,5,5,5,5,4,4,4,4,4,4,4,3,3,3,3,3,3,3,2,2,2,2,2,1]},
 energy:{buy:[24,23,23,22,21,21,20,20,19,19,18,17,16,16,15,15,14,14,13,13,12,12,11,11,11,10,10,10,9,9,8,8,8,7,7,7,6,6,6,5],sell:[19,18,18,17,16,16,15,15,14,14,13,13,12,12,11,11,11,10,10,10,9,9,8,8,8,7,7,7,6,6,5,5,5,4,4,4,3,3,3,2]},
 labor:{buy:[30,29,29,28,27,26,25,24,24,23,23,22,21,21,20,19,19,18,18,17,17,16,16,15,15,14,14,13,13,13,12,12,11,11,11,10,10,10,9,9],sell:[24,23,23,22,21,21,20,19,19,18,18,17,17,16,16,15,15,14,14,13,13,13,12,12,11,11,11,10,10,9,9,9,8,8,8,7,7,7,6,6]},
 ore:{buy:[35,34,33,32,30,29,28,27,26,25,24,23,22,21,20,20,19,18,17,16,16,15,15,14,13,13,12,12,12,11],sell:[28,27,26,25,24,23,22,21,20,20,19,18,17,16,16,15,15,14,13,12,12,11,11,10,10,10,9,9,9,8]},
 capital:{buy:[42,41,40,38,36,35,34,33,32,30,29,28,27,26,25,24,23,22,21,20,20,19,18,17,16,16,15,15,14,13],sell:[34,33,32,30,29,28,27,26,25,24,23,22,21,20,20,19,18,17,16,16,15,15,14,13,12,12,11,11,10,10]}
};
export const BARTER:Record<Good,number[]>={
 food:[11,11,11,10,9.5,9.5,9,8.5,8.5,8,7.5,7.5,7.5,7,6.5,6.5,6.5,6,6,5.5,5,5,5,5,5,5,4.5,4,4,4,4,4,4,3.5,3,3,3,2.5,2,1.5],
 energy:[21,21,20,19,19,18,18,17,17,16,16,15,14,13,13,13,12,12,12,11,11,10,9.5,9.5,9,8.5,8.5,8,7.5,7,6.5,6.5,6,5.5,5.5,5,4.5,4.5,4,3.5],
 labor:[27,26,26,25,24,23,22,22,21,21,20,20,19,19,18,17,17,16,16,15,15,14,14,13,13,13,12,12,11,11,11,10,9.5,9.5,9,8.5,8.5,8,7.5,7.5],
 ore:[31,30,29,28,27,26,25,24,23,22,21,20,19,19,18,18,17,16,15,14,14,13,13,12,12,11,11,11,10,9.5],
 capital:[38,37,35,34,32,31,30,29,28,27,26,25,24,23,22,21,20,19,19,18,18,17,16,15,14,14,13,13,12,12]
};
export const prices=(good:Good,count:number)=>{const m=MARKET[good],buy=m.buy[Math.max(0,count-1)],sell=m.sell[Math.min(m.sell.length-1,count)];return{buy,sell,barter:count?BARTER[good][count-1]:null};};
export const PACKAGES=[...(['food','food','energy','labor','ore','capital']as Industry[]).map((kind,i)=>({id:'i'+(i+1),kind,count:i<2?3:2,cash:i===2||i===3?10:0,goods:stock(),name:`ชุดโรงงาน ${i+1}`})),...[stock(9,1),stock(3,2,1),stock(0,1,3),stock(0,0,1,1,1),stock(0,0,0,3),stock(0,1,0,0,2)].map((goods,i)=>({id:'c'+(i+1),kind:null,count:0,cash:40,goods,name:`ชุดสินค้า ${i+1}`}))];
export const pkg=(id:string)=>PACKAGES.find(p=>p.id===id)!;
export const DOTS:Record<Industry,{center:boolean;edges:number[];corners:number[]}>= {food:{center:true,edges:[0,1,2,3,4,5],corners:[]},energy:{center:true,edges:[0,2,4],corners:[]},labor:{center:true,edges:[0,3],corners:[0,4]},ore:{center:true,edges:[1,4],corners:[]},capital:{center:true,edges:[],corners:[1,2,4,5]},bank:{center:false,edges:[0,5],corners:[]}};
