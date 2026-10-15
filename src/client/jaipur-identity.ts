import type { JaipurView } from "../games/jaipur/types.js";
/** Seat and winner identities always use server IDs, including duplicate names. */
export const seatLabel = (v: JaipurView, id: string) =>
  `ผู้เล่น ${v.players.findIndex((p) => p.id === id) + 1}${v.me?.id === id ? " · คุณ" : ""}`;
export const crown = () =>
  '<svg class="jp-crown" viewBox="0 0 28 24" width="24" height="22" role="img" aria-label="มงกุฎผู้ชนะ"><path d="M3 7l6 5 5-9 5 9 6-5-3 14H6Z" fill="#eebd3e" stroke="#80540d" stroke-width="1.5"/><path d="M7 17h14" stroke="#fff2b6" stroke-width="2"/></svg>';
