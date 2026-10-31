// Fetch is CACHE-FIRST for every precached path below, so a deployed client keeps serving the
// cached copy until the cache name changes. BUMP `CACHE` WHENEVER ANY PRECACHED FILE CHANGES
// (html/css/mjs/vendor/assets/races/competitions/samples), otherwise pilots keep a stale shell.
const VERSION=30;
const CACHE='aerostat-shell-v'+VERSION;
// CORE: awaited by `install`. Everything needed for the app to boot and navigate offline (~1.3 MB).
const CORE=['./','./index.html','./style.css','./theme.css','./app.mjs','./confirm-action.mjs','./flight-assist.mjs','./flight-export.mjs','./race-core.mjs','./races/kapadokya-2026.json','./race-import.mjs','./race-layers.mjs','./flight-navigation.mjs','./core.mjs','./global-coordinates.mjs','./regional-reference.mjs','./wind-profile.mjs','./vertical-speed.mjs','./barometer.mjs','./pdf-reader.mjs','./competitions.json','./samples/slovenia-flight1.json','./assets/targetnav-logo-dark.png','./assets/targetnav-icon-dark.png','./assets/targetnav-logo-light.png','./assets/targetnav-icon-light.png','./assets/targetnav-app-180.png','./assets/targetnav-app-192.png','./assets/targetnav-app-512.png','./manifest.webmanifest','./vendor/leaflet.js','./vendor/leaflet.css','./vendor/proj4.js','./vendor/geodesic.js','./vendor/index.js','./vendor/images/layers.png','./vendor/images/layers-2x.png','./vendor/images/marker-icon.png','./vendor/images/marker-icon-2x.png','./vendor/images/marker-shadow.png'];
// EXTRAS: heavy optional OCR/PDF payload (~20 MB). Precached in the background AFTER activation so
// install never blocks on it, but still fully cached ahead of time -- a pilot who never opened OCR
// while online must not find it broken in the field. NOT fetch-on-first-use.
const EXTRAS=['./vendor/pdf.mjs','./vendor/pdf.worker.mjs','./vendor/tesseract.min.js','./vendor/ocr/worker.min.js','./vendor/ocr/tesseract-core-lstm.wasm.js','./vendor/ocr/tesseract-core-simd-lstm.wasm.js','./vendor/ocr/eng.traineddata','./vendor/ocr/tur.traineddata'];
const MARKER='./offline-ready.json';
const key=u=>{const x=new URL(u,self.location.href);return x.origin+x.pathname;};
const PRECACHED=new Set([...CORE,...EXTRAS,MARKER].map(key));

// `ready` stays truthy as soon as CORE is cached so the existing page reader (a presence check on
// offline-ready.json) keeps working unchanged; `extras`/`tiers` add the finer second state.
function marker(extras,cached){return new Response(JSON.stringify({ready:true,version:VERSION,core:true,extras,tiers:{core:{ready:true,count:CORE.length},extras:{ready:extras,cached,count:EXTRAS.length}}}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}

self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(CORE);await c.put(MARKER,marker(false,0));await self.skipWaiting();})()));

let extrasRun=null;
// Tolerant of individual failures: one bad response must not abort the rest of the tier.
function precacheExtras(){return extrasRun||(extrasRun=(async()=>{const c=await caches.open(CACHE);let cached=0;for(const path of EXTRAS){try{if(await c.match(key(path))){cached++;continue;}const r=await fetch(new Request(path,{cache:'reload',credentials:'same-origin'}));if(!r||!r.ok)continue;await c.put(key(path),r);cached++;}catch{}}const done=cached===EXTRAS.length;await c.put(MARKER,marker(done,cached));if(!done)extrasRun=null;return{cached,total:EXTRAS.length,done};})());}

self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('aerostat-shell-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})());precacheExtras();});

// The page may also kick the background tier off (or re-try it) without blocking anything.
self.addEventListener('message',e=>{const t=e.data&&(e.data.type||e.data);if(t==='precache-extras'||t==='sw-precache-extras'){const p=precacheExtras();if(e.ports&&e.ports[0])p.then(r=>e.ports[0].postMessage(r),()=>e.ports[0].postMessage(null));}});

self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==self.location.origin)return;const k=u.origin+u.pathname;
  // Precached shell: cache-first, so a weak or captive connection never delays a shell request.
  if(PRECACHED.has(k)){e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(k);if(hit)return hit;try{const r=await fetch(req);if(r&&r.ok)c.put(k,r.clone());return r;}catch{return req.mode==='navigate'?(await c.match(key('./index.html')))||Response.error():Response.error();}})());return;}
  // Everything else (map tiles, health.json, pdf.js cmaps/fonts, ...): network-first as before.
  e.respondWith(fetch(req).then(r=>r.ok?r:caches.match(req).then(c=>c||r)).catch(()=>caches.match(req).then(r=>r||(req.mode==='navigate'?caches.match(key('./index.html')):Response.error()))));});
