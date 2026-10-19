import {gameIntroduction,bindGameIntroduction} from './game-learning.js';
import {gameBoxArt} from './game-box-art.js';
import { critterKitchenSetup } from './critter-kitchen-setup.js';
import { rolePortrait } from "./dracula-assets.js";
import { roomCode } from "./ui.js";
import { GAME_CATALOG } from "../shared/catalog.js";
import { platform, avatar, api, refreshAccount } from "./account.js";
import QRCode from "qrcode";
import type { GameId, RoomView, RoomAction } from "../shared/types.js";
import "./platform.css";
export const esc = (x: unknown) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const CATALOG = GAME_CATALOG.map((g) => ({
  ...g,
  count:
    g.minPlayers === g.maxPlayers
      ? `${g.minPlayers} คน`
      : `${g.minPlayers}–${g.maxPlayers} คน`,
}));
export {gallery} from "./platform-gallery.js";
function gameRooms(game?: GameId) {
  const rooms = platform.rooms.filter(r => !game || r.gameId === game);
  return rooms.length ? `<nav class="active-rooms game-rooms" aria-label="กลับเข้าห้องเดิม"><h2>กลับเข้าห้อง${game ? 'เกมนี้' : 'เดิม'}</h2>${rooms.map(r => {const g=GAME_CATALOG.find(g=>g.id===r.gameId);const name=g?.name??r.gameId;return `<div><div class="room-game-identity">${g?`<img src="${gameBoxArt(g.id)}" alt="" width="44" height="56">`:''}<div><strong translate="no">${esc(name)}</strong><small>ห้อง <b>${esc(r.code)}</b> • ${r.phase==='lobby'?'รอผู้เล่น':r.phase==='finished'?'จบเกม':'กำลังเล่น'}</small></div></div><div class="game-room-links">${r.player ? `<a href="/play/${r.code}">กลับไปเล่น</a>` : ''}${r.owner ? `<a href="/display/${r.code}">เปิดจอกลาง</a><button type="button" class="close-game-room" data-close-game-room="${r.code}" aria-label="ปิดห้อง ${r.code} ${esc(name)}">×</button>` : ''}</div></div>`;}).join('')}<p id="game-room-error" role="alert"></p></nav>` : '';
}
export function entry(
  root: HTMLElement,
  options: {
    game?: GameId;
    code: string;
    connected: boolean;
    busy: boolean;
    error: string;
    resuming: boolean;
    canCreate: boolean;
  },
  submit: (code: string, name: string) => void,
  create: (game: GameId,displayMode?:"shared-table"|"full-mobile") => void,
) {
  const g = CATALOG.find((g) => g.id === options.game),
    fixed = !!options.code,
    chooseMode = g?.id === "critter-kitchen" || g?.id === "locus",
    available = !!g && ["ready", "beta"].includes(platform.games.find(x => x.id === g.id)?.status ?? g.status),
    createBlocked = !options.connected || options.busy || !options.canCreate || !available;
  root.innerHTML = `<section class="platform-entry">${g ? `<div class="entry-context"><img class="entry-box" src="${gameBoxArt(g.id)}" width="640" height="800" alt="กล่องเกม ${esc(g.name)}"><div class="entry-game-info"><h1 translate="no">${esc(g.name)}</h1><p class="entry-player-count">${g.count}</p><p class="entry-intro">สร้างห้องใหม่ หรือเข้าห้องของเพื่อน</p></div></div>${gameIntroduction(g.id)}<div class="entry-create" id="entry-actions"><div class="entry-create-row">${chooseMode ? `<label class="entry-mode" for="ck-entry-mode">รูปแบบมือถือ<select id="ck-entry-mode" name="display-mode" ${options.busy ? 'disabled' : ''}><option value="shared-table">เล่นร่วมกับจอกลาง</option><option value="full-mobile">เล่นครบจากมือถือ</option></select></label>` : '<div class="entry-create-label"><strong>สร้างห้องใหม่</strong><span>เปิดกระดานบนจอกลาง</span></div>'}<button id="create" type="button" class="entry-go" aria-label="สร้างห้องบนจอกลาง" title="สร้างห้องบนจอกลาง" ${createBlocked ? 'disabled' : ''}>GO</button></div>${!available ? '<p class="entry-host-note">เกมนี้พักการสร้างห้องใหม่ ห้องที่เริ่มแล้วเล่นต่อได้</p>' : ''}${!options.canCreate ? `<p class="entry-host-note"><a href="/login?returnTo=${encodeURIComponent(location.pathname)}">ล็อกอิน Google เพื่อสร้างห้อง</a></p>` : ''}</div>` : '<div class="entry-join-intro"><h1>เข้าห้อง</h1><p>ร่วมเล่นกับเพื่อนผ่านรหัสบนจอกลาง</p></div>'}<form id="join" class="platform-form entry-join" aria-busy="${options.busy}"><div class="entry-form-heading"><h2>เข้าห้องจากมือถือ</h2><p>${fixed ? 'ใส่ชื่อของคุณ แล้วเข้าร่วมเกมได้เลย' : 'ใส่รหัสห้องจากจอกลาง แล้วบอกชื่อให้เพื่อนรู้จัก'}</p></div>${fixed ? `<input type="hidden" name="code" value="${esc(options.code)}"><p class="fixed-code"><span>รหัสห้อง</span><strong>${esc(options.code)}</strong></p>` : ''}<div class="entry-fields ${fixed ? 'entry-fields-fixed' : ''}">${!fixed ? '<div class="entry-field"><label for="join-code">รหัสห้อง</label><input id="join-code" name="code" maxlength="12" value="" autocapitalize="characters" autocomplete="off" spellcheck="false" required placeholder="ABC234" aria-describedby="entry-error"></div>' : ''}<div class="entry-field"><label for="join-name">ชื่อของคุณ</label><input id="join-name" name="name" ${platform.profile && !platform.profile.guest ? 'readonly' : ''} maxlength="24" autocomplete="nickname" value="${esc(platform.profile?.guest ? '' : (platform.profile?.name ?? ''))}" required placeholder="ชื่อที่เพื่อนรู้จัก" aria-describedby="entry-error"></div></div>${!platform.profile ? `<p class="entry-guest-hint">เข้าร่วมเป็น Guest ได้เลย หรือ <a href="/login?returnTo=${encodeURIComponent(location.pathname)}">ล็อกอิน Google</a></p>` : ''}<p id="entry-error" class="entry-error" role="alert">${esc(options.error)}</p><button type="submit" ${!options.connected || options.busy || options.resuming ? 'disabled' : ''}>${options.resuming ? 'กำลังกลับเข้าห้องเดิม…' : options.busy ? 'กำลังเข้าห้อง…' : 'เข้าห้อง'}</button></form>${gameRooms(g?.id)}</section>`;
  bindGameIntroduction(root);
  root.querySelectorAll<HTMLButtonElement>('[data-close-game-room]').forEach(button=>{button.onclick=async()=>{
    if(button.disabled)return;button.disabled=true;const room=button.dataset.closeGameRoom!;
    try{await api('/api/rooms/leave','POST',{code:room,close:true});for(const k of Object.keys(localStorage))if(k.startsWith('games:')&&k.includes(room))localStorage.removeItem(k);await refreshAccount();entry(root,options,submit,create);}
    catch(error){const message=root.querySelector('#game-room-error');if(message)message.textContent=(error as Error).message;button.disabled=false;}
  };});
  root
    .querySelector("#create")
    ?.addEventListener("click", () => g && create(g.id,g.id==="critter-kitchen"||g.id==="locus"?root.querySelector<HTMLSelectElement>("#ck-entry-mode")!.value as "shared-table"|"full-mobile":undefined));
  root.querySelector<HTMLFormElement>("#join")!.onsubmit = (event) => {
    event.preventDefault();
    if (options.busy || !options.connected || options.resuming) return;
    const form = event.currentTarget as HTMLFormElement,
      data = new FormData(form);
    const code = String(data.get("code")).replace(/\s/g, "").toUpperCase(),
      name = String(data.get("name")).trim();
    const error = root.querySelector("#entry-error")!;
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      error.textContent = "ใส่รหัสห้อง 6 ตัวอักษรจากจอกลาง";
      root.querySelector<HTMLInputElement>('[name="code"]')?.focus();
      return;
    }
    if (!name) {
      error.textContent = "กรุณาใส่ชื่อที่เพื่อนรู้จัก";
      root.querySelector<HTMLInputElement>('[name="name"]')?.focus();
      return;
    }
    submit(code, name);
  };
}
let hmLobbyDraft:{code:string;side:"A"|"B";solo:boolean;natureSpirits:boolean;whispers:boolean}|undefined;
let ckLobbyDraft:{code:string;restaurateurs:boolean;tutorial:boolean;expanded?:number[]}|undefined;
export function lobby(
  root: HTMLElement,
  v: RoomView,
  isPlayer: boolean,
  host: boolean,
  blocked: boolean,
  command: (a: RoomAction) => void,
) {
  const game = CATALOG.find((g) => g.id === v.gameId)!;
  const joinURL = new URL(
    `/play/${v.code}`,
    platform.joinOrigin ?? location.origin,
  ).href;
  const mine = v.me,
    own = v.players.find((p) => p.id === mine?.id);
  const duel = v.gameId === "dracula-vs-van-helsing";
  const calico = v.gameId === "calico";
  const wonders = v.gameId === "seven-wonders-duel";
  const jaipur=v.gameId==="jaipur";
  const pixies=v.gameId==="pixies";
  const locus=v.gameId==="locus";
  const ck=v.gameId==="critter-kitchen";
  const tt=v.gameId==="take-time";
  const sky=v.gameId==="sky-team";
  const harmonies=v.gameId==="harmonies";
  const azul = v.gameId === "azul" || calico || wonders || jaipur || pixies || harmonies || sky || ck || locus || tt;
  root.innerHTML = `<section class="platform-lobby"><div class="lobby-heading"><img src="${gameBoxArt(game.id)}" width="640" height="800" alt=""><div><h1 translate="no">${game.name}</h1><p>${game.count}</p></div>${roomCode(v.code)}</div><div class="lobby-grid"><section class="join-panel"><h2>${isPlayer ? "คุณเข้าห้องแล้ว" : "ชวนเพื่อนมาที่กระดานนี้"}</h2>${isPlayer ? "<p>รอเริ่มเกมที่จอกลาง ใช้หน้านี้เลือกการกระทำเมื่อเกมเริ่ม</p>" : `<canvas id="qr" aria-label="QR สำหรับเข้าห้อง"></canvas><a class="join-link" href="${esc(joinURL)}">${esc(joinURL)}</a><p>มือถือกับจอกลางต้องเข้าถึงที่อยู่นี้ได้ บน Wi-Fi ให้เปิดจอกลางด้วย LAN IP ของคอม</p>`}${duel && isPlayer ? `<div class="role-choices">${(["dracula", "helsing"] as const).map((character) => `<button data-character="${character}" aria-label="${character === "dracula" ? "Dracula" : "Van Helsing"}" aria-pressed="${own && "character" in own && own.character === character}" ${blocked || v.players.some((p) => "character" in p && p.id !== mine?.id && p.character === character) ? "disabled" : ""}>${rolePortrait(character)}<strong>${character === "dracula" ? "Dracula" : "Van Helsing"}</strong><span class="role-choice-check">${own && "character" in own && own.character === character ? "✓ ฝั่งของคุณ" : "เลือกฝั่งนี้"}</span></button>`).join("")}</div><button id="lobby-ready" ${blocked || !own || !("character" in own) || !own.character ? "disabled" : ""}>${own && "ready" in own && own.ready ? "ยกเลิกพร้อม" : "พร้อมเล่น"}</button>` : ""}${azul && isPlayer ? `<button id="lobby-ready" ${blocked ? "disabled" : ""}>${own && "ready" in own && own.ready ? "ยกเลิกพร้อม" : "พร้อมเล่น"}</button>` : ""}${host ? `${!duel && !sky && !ck && !tt ? `<label>${locus ? "ผู้เริ่มเกม (วันเกิดใกล้ถึงที่สุด)" : harmonies ? "ผู้เริ่มเกม (คนเห็นทิวทัศน์สวยล่าสุด)" : pixies ? "ผู้เริ่มเกม (สุ่มที่ server)" : jaipur ? "ผู้เริ่มเกม (ตกลงร่วมกัน หรือสุ่ม)" : wonders ? "ผู้เริ่มเกม (ตกลงร่วมกันก่อนเลือก Wonders)" : calico ? "ผู้เริ่มเกม (คนลูบแมวล่าสุด)" : azul ? "ผู้เริ่มเกม (เว็บ: เลือกผู้ไปโปรตุเกสล่าสุด หรือสุ่ม)" : "ผู้เริ่มเกม (เลือกคนอายุน้อยที่สุด)"}<select id="starter" name="starter">${azul && !calico && !locus ? `<option value="">สุ่มที่ server</option>` : ""}${v.players.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select></label>` : ""}<button id="start" type="button" class="entry-go" aria-label="เริ่มเกม" ${blocked || v.players.some((p) => !p.connected) || (!duel && !azul && v.players.length < 3) || (azul && (v.players.length < (calico?1:harmonies&&hmLobbyDraft?.code===v.code&&hmLobbyDraft.solo?1:2) || v.players.some(p => !("ready" in p) || !p.ready))) || (duel && (v.players.length !== 2 || v.players.some((p) => !("ready" in p) || !p.ready || !p.character))) ? "disabled" : ""}>GO</button><p>${tt ? "2–4 คนกดพร้อม • เปิดเล่นนาฬิกา 1–1 • ปรึกษาก่อนเปิดมือ แล้ววางการ์ดโดยงดพูด" : locus ? "2–5 คนกดพร้อม • ทุกชุดเลือกการ์ดคนละใบ แล้วกากบาทและต่อโบนัส" : ck ? "2–5 คนกดพร้อม • แผนลับเปิดพร้อมกัน • เลือกกติกาเสริมภาคหลักก่อนเริ่ม" : sky ? "2 คนกดพร้อม • คนเข้าคนแรกเป็น Pilot สีฟ้า คนที่สองเป็น Co-pilot สีส้ม • YUL เที่ยวบินแรก" : duel ? "ทั้งสองคนเลือกคนละบทบาทและกดพร้อม Dracula เริ่มก่อน" : harmonies ? "Solo 1 คน หรือ 2–4 คนกดพร้อม • เลือกภาคเสริมและด้านกระดานร่วมกัน" : pixies ? "ผู้เล่น 2–5 คนกดพร้อม • เล่นสะสมคะแนน 3 รอบ" : jaipur ? "ผู้เล่น 2 คนกดพร้อม • ชนะ 2 รอบเพื่อชนะ match" : wonders ? "ผู้เล่น 2 คนกดพร้อม แล้วเลือก Wonders คนละ 4 ใบ" : calico ? "ผู้เล่น 1 คนเริ่ม Solo · 2–4 คนเล่นร่วมกัน ทุกคนกดพร้อม" : azul ? "รอผู้เล่น 2–4 คนเชื่อมต่อและกดพร้อมครบ" : "รอผู้เล่นอย่างน้อย 3 คนเชื่อมต่อก่อนเริ่ม"}</p>` : ""}</section><aside><h2>ผู้เล่น ${v.players.length}/${game.maxPlayers}</h2><ol class="lobby-players">${v.players.map((p) => `<li>${duel && "character" in p && p.character ? rolePortrait(p.character) : avatar(p)}<strong>${esc(p.name)}</strong><span>${p.connected ? "เชื่อมต่อแล้ว" : "หลุด • รอกลับเข้าห้อง"}</span>${azul ? `<small>${"ready" in p && p.ready ? "พร้อมแล้ว" : "ยังไม่พร้อม"}</small>` : ""}${"character" in p ? `<small>${p.character === "dracula" ? "Dracula" : p.character === "helsing" ? "Van Helsing" : "ยังไม่เลือกบทบาท"} • ${p.ready ? "พร้อมแล้ว" : "ยังไม่พร้อม"}</small>` : ""}</li>`).join("") || "<li>ยังไม่มีผู้เล่น สแกน QR ด้วยมือถือเพื่อเข้าห้อง</li>"}</ol></aside></div></section>`;
  if(ck&&host){if(ckLobbyDraft?.code!==v.code)ckLobbyDraft={code:v.code,restaurateurs:false,tutorial:false};const options=document.createElement("div");options.innerHTML=critterKitchenSetup();root.querySelector("#start")?.before(options);for(const key of ["restaurateurs","tutorial"] as const){const input=options.querySelector<HTMLInputElement>("#ck-"+key)!;input.checked=ckLobbyDraft![key];input.disabled=blocked;input.onchange=()=>{ckLobbyDraft![key]=input.checked;};}}
  if(ck&&host&&v.gameId==='critter-kitchen'){for(const key of ['luckyDuck','rudy','aLaCartChefs','aLaCartMoreChefs'] as const){const input=root.querySelector<HTMLInputElement>('#ck-'+key)!;input.checked=!!v.expansions?.[key];input.disabled=blocked;input.onchange=()=>command({type:'ck-expansions',expansions:{...v.expansions,[key]:input.checked}});}}
  if(ck&&host&&ckLobbyDraft){const all=[...root.querySelectorAll<HTMLDetailsElement>('.ck-setup details')];all.forEach((details,i)=>{details.open=ckLobbyDraft!.expanded?.includes(i)??false;details.ontoggle=()=>{if(details.isConnected)ckLobbyDraft!.expanded=all.flatMap((d,j)=>d.open?[j]:[]);};});}
  if(harmonies&&host){
    if(hmLobbyDraft?.code!==v.code)hmLobbyDraft={code:v.code,side:'A',solo:v.players.length===1,natureSpirits:false,whispers:false};
    const options=document.createElement('fieldset');options.className='hm-lobby-options';options.innerHTML='<legend>เลือกโหมดและภาคเสริม</legend>'+[['solo','Solo · เล่นคนเดียว','ใช้ภูมิประเทศ 3 กลุ่มและการ์ด 3 ใบ ทิ้งชิ้นไม้กลางที่ไม่ได้เลือกเมื่อจบตา'],['natureSpirits','Nature’s Spirits · จิตวิญญาณธรรมชาติ','ได้รับการ์ดลับ 2 ใบ เลือกเก็บ 1 ใบเมื่อถึงตาแรก ทำถิ่นอาศัยให้สำเร็จเพื่อปลดล็อกคะแนนพิเศษ'],['whispers','Crescendo · เสียงกระซิบ','เพิ่ม 10 ใบ วางคิวบ์ได้ใบละ 2 ชิ้น ชิ้นละ 2 คะแนน หรือ 5 คะแนนเมื่ออยู่ร่วมกับสัตว์หรือจิตวิญญาณ']].map(([key,title,desc])=>'<label><input id="hm-'+key+'" type="checkbox"> <span><b>'+title+'</b><small>'+desc+'</small></span></label>').join('')+'<label>ด้านกระดาน<select id="hm-side" aria-label="ด้านกระดาน"><option value="A">A · แม่น้ำ</option><option value="B">B · หมู่เกาะ</option></select></label>';
    root.querySelector('#start')?.before(options);
    const updateStart=()=>{const b=root.querySelector<HTMLButtonElement>('#start')!;b.disabled=blocked||v.players.length<(hmLobbyDraft!.solo?1:2)||v.players.length>(hmLobbyDraft!.solo?1:4)||v.players.some(p=>!p.connected||!('ready' in p)||!p.ready);};
    for(const key of ['solo','natureSpirits','whispers'] as const){const input=options.querySelector<HTMLInputElement>('#hm-'+key)!;input.checked=hmLobbyDraft[key];input.disabled=blocked;input.onchange=()=>{hmLobbyDraft![key]=input.checked;updateStart();};}
    const side=options.querySelector<HTMLSelectElement>('#hm-side')!;side.value=hmLobbyDraft.side;side.disabled=blocked;side.onchange=()=>{hmLobbyDraft!.side=side.value as 'A'|'B';};updateStart();
  }
  if(calico && host){
    const label=document.createElement("label");label.textContent="การจัดเกม";
    const select=document.createElement("select");select.name="calico-preset";select.setAttribute("aria-label","การจัดเกม");
    select.innerHTML='<option value="standard">มาตรฐาน • เลือกเป้าหมาย 3 จาก 4</option><option value="first">เกมแรก • เป้าหมายและแมวตามคู่มือ</option>';
    select.value=v.gameId==="calico"?v.preset:"standard";select.disabled=blocked;
    select.onchange=()=>command({type:"calico-preset",preset:select.value as "standard"|"first"});label.append(select);
    root.querySelector("#start")?.before(label);
  }
  if (platform.profile) {
    const controls = document.createElement("div");
    controls.className = "room-lifecycle";
    controls.innerHTML = `${isPlayer ? '<button id="leave-room">ออกจากห้องรอ</button>' : ""}${platform.rooms.some((r) => r.code === v.code && r.owner) ? '<button id="close-room">ปิดห้อง</button>' : ""}<p id="room-action-error" role="alert"></p>`;
    root.append(controls);
    for (const [id, close] of [
      ["leave-room", false],
      ["close-room", true],
    ] as const)
      root
        .querySelector<HTMLButtonElement>("#" + id)
        ?.addEventListener("click", async () => {
          const b = root.querySelector<HTMLButtonElement>("#" + id)!;
          if (
            close &&
            !confirm("ปิดห้องนี้? ผู้เล่นทุกคนจะออกจากห้องและเล่นต่อไม่ได้")
          )
            return;
          b.disabled = true;
          try {
            await api("/api/rooms/leave", "POST", { code: v.code, close });
            for (const k of Object.keys(localStorage))
              if (k.startsWith("games:") && k.includes(v.code))
                localStorage.removeItem(k);
            location.assign("/");
          } catch (e) {
            root.querySelector("#room-action-error")!.textContent = (
              e as Error
            ).message;
            b.disabled = false;
          }
        });
  }
  const canvas = root.querySelector<HTMLCanvasElement>("#qr");
  if (canvas)
    void QRCode.toCanvas(canvas, joinURL, {
      width: 240,
      margin: 2,
      color: { dark: "#243341", light: "#ffffff" },
    });
  root.querySelector("#start")?.addEventListener("click", () =>
    command(
      duel || sky || ck || tt
        ? ck?{type:"start",restaurateurs:root.querySelector<HTMLInputElement>("#ck-restaurateurs")!.checked,tutorial:root.querySelector<HTMLInputElement>("#ck-tutorial")!.checked}:{ type: "start" }
        : {
            type: "start",
            ...(harmonies?{boardSide:hmLobbyDraft!.side,harmoniesOptions:{solo:hmLobbyDraft!.solo,natureSpirits:hmLobbyDraft!.natureSpirits,whispers:hmLobbyDraft!.whispers}}:{}),
            startingPlayerId:
              root.querySelector<HTMLSelectElement>("#starter")!.value || undefined,
          },
    ),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-character]").forEach((b) =>
    b.addEventListener("click", () =>
      command({
        type: "choose-role",
        character: b.dataset.character as "dracula" | "helsing",
      }),
    ),
  );
  root
    .querySelector("#lobby-ready")
    ?.addEventListener("click", () =>
      command({ type: "ready", ready: !(own && "ready" in own && own.ready) }),
    );
}
