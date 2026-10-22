import {metadata} from '../shared/catalog.js';
/** The URL names the surface, never the authenticated player or game authority. */
export function roomRoute(pathname:string){
 const parts=pathname.split('/').filter(Boolean);
 return parts.length===3&&metadata(parts[0])&&['play','display'].includes(parts[1])?parts.slice(1):parts;
}
export function roomPath(game:string|undefined,surface:'play'|'display',code:string){
 return `${game==='harmonies'?'/harmonies':''}/${surface}/${encodeURIComponent(code)}`;
}
