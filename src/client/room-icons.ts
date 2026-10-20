export function roomActionIcon(kind:'play'|'display'|'exit'){
 const path=kind==='play'?'<path d="m9 6 9 6-9 6z"/>':kind==='display'?'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>':'<path d="M10 4H4v16h6m4-13 5 5-5 5m-6-5h11"/>';
 return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
