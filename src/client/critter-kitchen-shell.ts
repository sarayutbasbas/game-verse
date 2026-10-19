const paths:Record<string,string>={
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 chain:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
 fridge:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 9h14M8 5v2m0 5v4"/>',
 star:'<path d="m12 2 3 6.2 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1Z" fill="currentColor"/>',
 loading:'<circle cx="12" cy="12" r="8" opacity=".2"/><path d="M12 4a8 8 0 0 1 8 8"/>',
 minus:'<path d="M5 12h14"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 supplies:'<path d="M4 9h16l-2 12H6L4 9Zm3 0 3-6m7 6-3-6M9 13v4m6-4v4"/>',
 cards:'<rect x="8" y="6" width="12" height="15" rx="2"/><path d="M5 17H4V3h12M12 11h4m-4 4h4"/>',
 logout:'<path d="M10 4H4v16h6M9 12h12m-5-5 5 5-5 5"/>',
 home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
 market:'<path d="M4 9v12h16V9M3 9l2-6h14l2 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M8 21v-7h8v7"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 menu:'<path d="M5 6h14M5 12h14M5 18h14"/>',
 help:'<path d="M8 8a4 4 0 1 1 6 3.5c-1.3.7-2 1.5-2 3"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/>',
 clear:'<path d="M5 9a8 8 0 1 1 0 7M5 4v5h5"/>',
 confirm:'<path d="m5 12 4 4L19 6"/>',
 edit:'<path d="m5 15 10-10 4 4L9 19H5v-4ZM13 7l4 4"/>'
};
export const ckIcon=(name:string)=>`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]??paths.help}</svg>`;
const ship='<ellipse cx="50" cy="20" rx="39" ry="13" fill="#fff0c3" stroke="#b29c68"/><path d="M18 13q30 13 64 0M20 26q30-12 60 0" fill="none" stroke="#d5bf8f"/><path d="m12 16-9-8v17l9-2m70-8 11-6v17l-11-3" fill="#8da99d"/><path d="m38 32 4 10h17l6-10" fill="#7b6948"/><path d="M43 32v10m15-10v10" stroke="#294e4c"/>';
export const ckSky=`<div class="ck-sky" data-ui-key="ambient-sky" data-preserve-content aria-hidden="true"><svg class="ck-airship" viewBox="0 0 100 48">${ship}</svg><svg class="ck-airship second" viewBox="0 0 100 48">${ship}</svg></div>`;
