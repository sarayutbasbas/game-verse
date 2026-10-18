import { DEAL_GAP_MS } from "./dracula-assets.js";
import type { RoomView } from "../shared/types.js";
export function endedTurn(
  previous: RoomView | undefined,
  next: RoomView,
  snapshot: boolean,
) {
  return (
    !!previous &&
    !snapshot &&
    previous.code === next.code &&
    previous.gameId === next.gameId &&
    next.revision === previous.revision + 1 &&
    previous.phase === "playing" &&
    (next.phase !== "playing" || next.turn !== previous.turn || (next.gameId === "calico" && next.event?.kind === "calico-draft") || (next.gameId === "seven-wonders-duel" && !next.pending && !!next.event && ["build", "discard", "wonder", "wonders-decide"].includes(next.event.kind)))
  );
}
export type GameEffect = "turn" | "draw" | "swap" | "reveal" | "deal" | "select" | "place" | "validate" | "round" | "finish" | "wood" | "cube" | "pencil" | "coin" | "combo";
export function gameEffects(previous:RoomView|undefined,next:RoomView,snapshot:boolean):GameEffect[] {
  if(!previous || snapshot || previous.code!==next.code || next.revision!==previous.revision+1)return [];
  const out:GameEffect[]=endedTurn(previous,next,false)?["turn"]:[];
  if(next.gameId==="locus"&&previous.gameId==="locus"){
    if(next.sequence===previous.sequence)return out;
    const kind=next.event.kind;
    if(next.me&&next.event.actor&&next.event.actor!==next.me.id)return next.turn===next.me.id&&next.turn!==previous.turn?['turn']:[];
    if(kind==='mark'){out.push('pencil');if(next.event.effects?.length)out.push('combo');}
    if(next.event.gained||kind==='coin')out.push('coin');
    if(kind==='setup'&&previous.phase==='lobby'||kind==='pick')out.push(kind==='pick'?'draw':'deal');if(kind==='deal'||kind==='extra')out.push('deal');if(kind==='finish')out.push('finish');return out;
  }
  if(next.gameId==="critter-kitchen"&&previous.gameId==="critter-kitchen"){
    if(next.sequence===previous.sequence)return out;
    const kind=next.event.kind;
    if(kind==='pick')out.push('place');if(kind==='reveal')out.push('reveal');if(kind==='round')out.push('deal');if(kind==='challenge')out.push('round');if(kind==='finish')out.push('finish');
    if(next.turn&&next.turn!==previous.turn)out.push('turn');return out;
  }
  if(next.gameId==="sky-team"&&previous.gameId==="sky-team"){
    if(next.sequence!==previous.sequence){if(next.event==="place")out.push("place");if(next.event==="round"&&next.phase==="resolution")out.push("round");if(next.event==="finish")out.push("finish");}return out;
  }
  if(next.gameId==="harmonies"&&previous.gameId==="harmonies"){
    if(next.sequence===previous.sequence)return out;
    const cue:Partial<Record<string,GameEffect>>={setup:'deal',group:'wood',place:'place',card:'draw',cube:'cube',finish:'finish'};
    const kind=next.event&&cue[next.event.kind];if(next.deckCount!==undefined&&previous.deckCount!==undefined&&next.deckCount<previous.deckCount)out.push('deal');if(kind)out.push(kind);return out;
  }
  if(next.gameId==="pixies"&&previous.gameId==="pixies") {
    if(next.sequence===previous.sequence)return out;
    if(next.event?.kind==="deal"||next.phase==="playing"&&!next.pending&&previous.deckCount!==undefined&&next.deckCount!==undefined&&next.deckCount<previous.deckCount)out.push("deal");
    if(previous.pending&&!next.pending&&["round","finish"].includes(next.event?.kind??""))out.push("place");
    if(next.event&&["place","validate","round","finish"].includes(next.event.kind))out.push(next.event.kind as GameEffect);
    return out;
  }
  if(previous.gameId!=="dracula-vs-van-helsing" || next.gameId!==previous.gameId)return out;
  if(next.phase==="playing" && previous.phase!=="playing")return [...out,"deal"];
  if(next.phase==="playing" && previous.step==="draw" && next.step==="discard" && next.deckCount===previous.deckCount!-1)out.push("draw");
  if(next.event && ["replace","swap"].includes(next.event.kind) && next.event?.serial!==previous.event?.serial)out.push("swap");
  if(previous.result && (next.revealedCount??0)>(previous.revealedCount??0) || next.event?.kind==="reveal" && next.event?.serial!==previous.event?.serial)out.push("reveal");
  return out;
}
/** Audio follows accepted revisions. Music and effects have independent gains/preferences. */
export class TurnSound {
  private previous?:RoomView;
  private context?:AudioContext;
  private fxBus?:GainNode;
  private enabled=true;
  private musicEnabled=false;
  private unlocked=false;
  private active=false;
  private gameId="";
  private fxVolume=1;
  private musicVolume=1;
  private musicBus?:GainNode;
  configureGame(id:string){
    if(this.gameId===id)return;
    this.active=false;this.updateMusic();this.gameId=id;
    try{const saved=localStorage.getItem('gameverse:bg-sound');this.musicEnabled=saved===null?id==='harmonies':saved==='on';}catch{this.musicEnabled=id==='harmonies';}
    this.paint();
  }
  playLocal(kind:GameEffect){this.effect(kind);}

  private musicNodes:AudioNode[]=[];
  private musicTimer?:ReturnType<typeof setInterval>;
  readonly button=document.createElement("button");
  readonly musicButton=document.createElement("button");
  readonly controls=document.createElement("details");
  constructor(){
    try{this.enabled=localStorage.getItem("gameverse:turn-sound")!=="off";this.musicEnabled=localStorage.getItem("gameverse:bg-sound")==="on";}catch{}
    this.controls.className="audio-settings";
    const summary=document.createElement("summary");summary.setAttribute("aria-label","ตั้งค่าเสียง");
    summary.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9h4l5-4v14l-5-4H4zM17 8q5 4 0 8"/></svg>';
    const panel=document.createElement("div");panel.className="audio-panel";
    this.button.type=this.musicButton.type="button";
    this.button.className="turn-sound-button";this.musicButton.className="music-sound-button";
    panel.append(this.button,this.musicButton);this.controls.append(summary,panel);
    try{this.fxVolume=Number(localStorage.getItem("gameverse:fx-volume")??1);this.musicVolume=Number(localStorage.getItem("gameverse:music-volume")??1);}catch{}
    for(const [label,key,value] of [["ระดับเอฟเฟกต์","fx",this.fxVolume],["ระดับพื้นหลัง","music",this.musicVolume]] as const){const wrap=document.createElement("label"),range=document.createElement("input");wrap.textContent=label;range.type="range";range.min="0";range.max="100";range.value=String(value*100);range.setAttribute("aria-label",label);range.oninput=()=>{const n=Number(range.value)/100;if(key==="fx")this.fxVolume=n;else this.musicVolume=n;try{localStorage.setItem(`gameverse:${key}-volume`,String(n));}catch{}this.paint();};wrap.append(range);panel.append(wrap);}
    document.addEventListener("gameverse-audio",(event)=>{if((event as CustomEvent).detail==="select")this.playLocal("select");});
    this.button.onclick=()=>{this.enabled=!(this.enabled&&this.unlocked);this.save();if(this.enabled)void this.unlock(true);else this.paint();};
    this.musicButton.onclick=()=>{this.musicEnabled=!(this.musicEnabled&&this.unlocked);this.save();if(this.musicEnabled)void this.unlock();else {this.updateMusic();this.paint();}};
    document.addEventListener('pointerdown',event=>{if(this.controls.open&&!this.controls.contains(event.target as Node))this.controls.open=false;});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&this.controls.open){this.controls.open=false;summary.focus({preventScroll:true});}});
    const gesture=(e:Event)=>{if(!this.button.contains(e.target as Node)&&!this.musicButton.contains(e.target as Node)&&(this.enabled||this.musicEnabled))void this.unlock();};
    document.addEventListener("pointerdown",gesture,{once:true});document.addEventListener("keydown",gesture,{once:true});
    document.addEventListener("visibilitychange",()=>this.updateMusic());this.paint();
  }
  setCompact(compact:boolean){this.controls.classList.toggle("compact-audio",compact);}
  setActive(active:boolean){const starting=active&&!this.active;this.active=active;this.updateMusic();if(starting&&this.gameId==='harmonies'&&this.musicEnabled&&!this.unlocked)void this.unlock();}
  private save(){try{localStorage.setItem("gameverse:turn-sound",this.enabled?"on":"off");localStorage.setItem("gameverse:bg-sound",this.musicEnabled?"on":"off");}catch{}}
  private paint(){
    this.button.textContent=`เสียงเอฟเฟกต์: ${this.enabled?"เปิด":"ปิด"}`;
    this.musicButton.textContent=`เสียงพื้นหลัง: ${this.musicEnabled?"เปิด":"ปิด"}`;
    this.button.setAttribute("aria-label",this.button.textContent);this.musicButton.setAttribute("aria-label",this.musicButton.textContent);
    this.button.setAttribute("aria-pressed",String(this.enabled&&this.unlocked));this.musicButton.setAttribute("aria-pressed",String(this.musicEnabled&&this.unlocked));
    if(this.fxBus&&this.context)this.fxBus.gain.setValueAtTime(this.enabled?this.fxVolume:0,this.context.currentTime);
    if(this.musicBus&&this.context)this.musicBus.gain.setValueAtTime(this.musicVolume,this.context.currentTime);
    this.controls.title="ตั้งค่าเสียงเฉพาะเครื่องนี้ • แตะเพื่ออนุญาตเสียง";
  }
  private async unlock(preview=false){
    try{const Audio=window.AudioContext??(window as any).webkitAudioContext;if(!Audio){this.button.disabled=this.musicButton.disabled=true;return;}
      this.context??=new Audio();await this.context!.resume();this.unlocked=this.context!.state==="running";this.paint();this.updateMusic();if(preview)this.effect("turn");
    }catch{this.paint();}
  }
  private updateMusic(){
    const play=this.active&&this.musicEnabled&&this.unlocked&&!document.hidden&&this.context?.state==="running";
    if(!play){if(this.musicTimer)clearInterval(this.musicTimer);this.musicTimer=undefined;for(const n of this.musicNodes){if(typeof (n as AudioScheduledSourceNode).stop==="function")(n as AudioScheduledSourceNode).stop();n.disconnect();}this.musicNodes=[];this.musicBus=undefined;this.controls.dataset.musicPlaying="false";return;}
    if(this.musicNodes.length)return;
    if(this.gameId==="locus"||this.gameId==="pixies"||this.gameId==="harmonies"||this.gameId==="critter-kitchen"||this.gameId==="name-it"){this.startPixiesMusic();return;}
    const ctx=this.context!,bus=ctx.createGain(),filter=ctx.createBiquadFilter();const master=ctx.createGain();this.musicBus=master;master.gain.value=this.musicVolume;bus.gain.value=.018;filter.type="lowpass";filter.frequency.value=650;bus.connect(filter);filter.connect(master);master.connect(ctx.destination);
    const voices=[130.81,155.56,196].map(f=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f;g.gain.value=.16;o.connect(g);g.connect(bus);o.start();this.musicNodes.push(o,g);return o;});
    const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=.08;depth.gain.value=.004;lfo.connect(depth);depth.connect(bus.gain);lfo.start();this.musicNodes.push(bus,filter,master,lfo,depth);
    const chords=[[130.81,155.56,196],[103.83,155.56,207.65],[130.81,174.61,207.65],[116.54,146.83,196]];let chord=0;
    this.musicTimer=setInterval(()=>{chord=(chord+1)%chords.length;voices.forEach((o,i)=>o.frequency.setTargetAtTime(chords[chord][i],ctx.currentTime,3));},12000);
    this.controls.dataset.musicPlaying="true";
  }
  /** Light C-major plucks with silence between notes; no drone or pitch glides. */
  private startPixiesMusic(){
    const ctx=this.context!,master=ctx.createGain();master.gain.value=this.musicVolume;master.connect(ctx.destination);this.musicBus=master;this.musicNodes.push(master);
    const melody=[523.25,659.25,783.99,0,587.33,659.25,880,783.99,659.25,0,523.25,587.33,783.99,659.25,587.33,0];
    let beat=0,next=ctx.currentTime+.04;
    const pluck=(frequency:number,start:number,volume:number)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=frequency;g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+.45);o.connect(g);g.connect(master);o.start(start);o.stop(start+.48);this.musicNodes.push(o,g);o.onended=()=>{o.disconnect();g.disconnect();this.musicNodes=this.musicNodes.filter(n=>n!==o&&n!==g);};};
    const schedule=()=>{while(next<ctx.currentTime+.5){const note=melody[beat%melody.length];if(note)pluck(note,next,.025);if(beat%4===0)pluck(beat%8===0?261.63:392,next,.012);next+=.38;beat++;}};
    schedule();this.musicTimer=setInterval(schedule,200);this.controls.dataset.musicPlaying='true';this.controls.dataset.musicStyle=this.gameId+'-meadow';
  }
  private effect(kind:GameEffect,offset=0){
    if(!this.enabled||!this.unlocked||this.context?.state!=="running")return;
    const ctx=this.context,start=ctx.currentTime+offset;
    this.fxBus??=ctx.createGain();this.fxBus.gain.value=this.enabled?this.fxVolume:0;this.fxBus.disconnect();this.fxBus.connect(ctx.destination);
    this.controls.dataset.fxCount=String(Number(this.controls.dataset.fxCount??0)+1);this.controls.dataset.lastEffect=kind;
    if(kind==='wood'||kind==='cube'){
      const o=ctx.createOscillator(),g=ctx.createGain();o.type=kind==='wood'?'triangle':'sine';o.frequency.setValueAtTime(kind==='wood'?620:1174,start);o.frequency.exponentialRampToValueAtTime(kind==='wood'?240:880,start+.08);g.gain.setValueAtTime(.045,start);g.gain.exponentialRampToValueAtTime(.0001,start+.12);o.connect(g);g.connect(this.fxBus);o.start(start);o.stop(start+.14);o.onended=()=>{o.disconnect();g.disconnect();};return;
    }
    if(kind==="draw"||kind==="deal"||kind==="pencil"){
      const noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.12),ctx.sampleRate),data=noise.getChannelData(0);
      for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=noise;filter.type=kind==='pencil'?'bandpass':'highpass';filter.frequency.value=kind==='pencil'?2400:1200;gain.gain.setValueAtTime(kind==='pencil'?.025:.045,start);gain.gain.exponentialRampToValueAtTime(.001,start+.12);source.connect(filter);filter.connect(gain);gain.connect(this.fxBus);source.start(start);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};return;
    }
    const notes=kind==="coin"?[[0,1318],[.065,1760]]:kind==="combo"?[[0,659],[.075,880],[.15,1046]]:kind==="select"?[[0,880]]:kind==="place"?[[0,440],[.06,660]]:kind==="validate"?[[0,659],[.09,880],[.18,1046]]:kind==="round"||kind==="finish"?[[0,523],[.12,659],[.24,784],[.36,1046]]:kind==="turn"?[[0,523.25],[.14,783.99]]:kind==="reveal"?[[0,659.25],[.08,987.77]]:[[0,400],[.08,300]];
    for(const [time,f]of notes){const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(0,start+time);g.gain.linearRampToValueAtTime(.08,start+time+.012);g.gain.exponentialRampToValueAtTime(.001,start+time+.2);o.connect(g);g.connect(this.fxBus);o.start(start+time);o.stop(start+time+.22);o.onended=()=>{o.disconnect();g.disconnect();};}
  }
  accept(next:RoomView,snapshot:boolean,forceDeal=false){const prior=this.previous;const harmoniesDeals=next.gameId==="harmonies"&&prior?.gameId==="harmonies"&&prior.deckCount!==undefined&&next.deckCount!==undefined?Math.max(0,prior.deckCount-next.deckCount):5;this.configureGame(next.gameId);const effects=gameEffects(this.previous,next,snapshot);if(forceDeal&&!effects.includes("deal"))effects.push("deal");this.previous=next;this.setActive(next.phase!=="lobby");for(const kind of effects){if(kind==="deal")for(let i=0;i<(next.gameId==="locus"?next.market.length:next.gameId==="pixies"?next.market?.length??0:next.gameId==="harmonies"?forceDeal?5:harmoniesDeals:10);i++)this.effect(kind,i*DEAL_GAP_MS/1000);else this.effect(kind,next.gameId==="pixies"&&(kind==="round"||kind==="finish")?.22:0);}}
}
