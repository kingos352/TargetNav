// Uçuş yardımcıları: PZ titreşim/ses uyarısı, hedeften rüzgâr çizgisi, cihaz içi otomatik plan yedekleri, uçuş öncesi kontrol.
import {destination,inverse,norm} from './core.mjs';

export const nativeBridge=()=>globalThis.TargetNavAndroid||null;
export function backgroundTracking(){try{return !!nativeBridge()?.isBackgroundActive?.();}catch{return false;}}

// ---- PZ uyarısı -----------------------------------------------------------
// Aynı bölge için durum değişmedikçe ve bekleme süresi dolmadıkça tekrar uyarmaz.
export const PZ_ALERT_MODES=['vibrate-sound','vibrate','off'];
export class PZAlerter{
 constructor({cooldownMs=120000}={}){this.cooldownMs=cooldownMs;this.state=new Map();this.lastAt=new Map();}
 reset(){this.state.clear();}
 update(items,now=Date.now()){
  let level=null;const seen=new Set();
  for(const i of items||[]){
   if(!i?.zone||i.zone.color==='blue')continue;
   const key=i.zone.name,current=i.inside?'inside':'near';seen.add(key);
   if(this.state.get(key)===current)continue;
   this.state.set(key,current);
   const stamp=key+'|'+current;if(now-(this.lastAt.get(stamp)??-Infinity)<this.cooldownMs)continue;
   this.lastAt.set(stamp,now);if(level!=='inside')level=current;
  }
  for(const key of [...this.state.keys()])if(!seen.has(key))this.state.delete(key);
  return level;
 }
}
let audio=null;
function unlockAudio(){try{audio=audio||new (globalThis.AudioContext||globalThis.webkitAudioContext)();if(audio.state==='suspended')audio.resume();}catch{}}
if(globalThis.addEventListener)globalThis.addEventListener('pointerdown',unlockAudio,{once:true,capture:true});
function beep(count){if(!audio)return;const t=audio.currentTime;for(let i=0;i<count;i++){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(0,t+i*.28);g.gain.linearRampToValueAtTime(.18,t+i*.28+.02);g.gain.linearRampToValueAtTime(0,t+i*.28+.18);o.connect(g).connect(audio.destination);o.start(t+i*.28);o.stop(t+i*.28+.2);}}
export function playPZAlert(level,mode){
 if(!level||mode==='off'||!PZ_ALERT_MODES.includes(mode))return false;
 const sound=mode==='vibrate-sound',strong=level==='inside',bridge=nativeBridge();
 if(bridge?.alertPZ){try{bridge.alertPZ(strong?2:1,sound);return true;}catch{}}
 try{navigator.vibrate?.(strong?[180,120,180]:[140]);}catch{}
 if(sound)beep(strong?2:1);
 return true;
}

// ---- Hedeften rüzgâr çizgisi ----------------------------------------------
// Rüzgârın geldiği yöne doğru, hedeften geriye çizilir: çizgi üzerindeki bir noktadan
// bu katmanda kalan balon, işaretli dakika sonra hedefe varır (sabit rüzgâr varsayımı).
export function windLine(target,wind,{minutes=30,step=5}={}){
 if(!target||!wind||!(wind.speed>0)||!Number.isFinite(wind.from))return [];
 const out=[];for(let m=0;m<=minutes;m+=step){const p=m?destination(target,wind.speed*60*m,norm(wind.from),null,'geodesic'):{lat:target.lat,lng:target.lng};out.push({minute:m,lat:p.lat,lng:p.lng});}
 return out;
}
// GPS konumunun bir rüzgâr çizgisine yatay uzaklığı (m) ve çizgi üzerindeki dakika konumu.
export function windLineOffset(fix,target,wind){
 if(!fix||!target||!(wind?.speed>0))return null;
 const r=inverse(target,fix),delta=(r.bearing-norm(wind.from))*Math.PI/180,along=r.distance*Math.cos(delta);
 return {offset:Math.abs(r.distance*Math.sin(delta)),minutes:along>0?along/wind.speed/60:null};
}

// ---- Cihaz içi otomatik yedekler -------------------------------------------
const DB='targetnav-backups-v1',STORE='snapshots';
let dbPromise=null;
function openDB(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
function tx(mode,fn){return openDB().then(d=>new Promise((resolve,reject)=>{const t=d.transaction(STORE,mode),s=t.objectStore(STORE);let result;Promise.resolve(fn(s,v=>result=v)).catch(reject);t.oncomplete=()=>resolve(result);t.onerror=()=>reject(t.error);}));}
export function summarizePlan(s){return {name:String(s?.name||'Plan'),targets:(s?.points||[]).filter(p=>p.role==='target').length,tasks:(s?.tasks||[]).length,track:(s?.track||[]).length};}
export function createBackups({getState,isBlocked=()=>false,intervalMs=5*60000,keep=20}={}){
 let lastText=null,lastAt=0,pending=null;
 async function snapshot(reason='auto',force=false){
  if(isBlocked()||!globalThis.indexedDB)return false;
  const s=getState(),text=JSON.stringify(s);
  // Uygulama yeniden açıldığında son yedekle karşılaştır: değişmeyen plan tekrar kaydedilmez.
  if(!force&&lastText===null){const latest=(await list())[0];if(latest){lastText=(await getEntry(latest.id))?.data??null;lastAt=latest.id;}}
  if(!force&&text===lastText)return false;
  const now=Date.now(),entry={id:now,time:new Date(now).toISOString(),reason,...summarizePlan(s),data:text};
  await tx('readwrite',st=>{st.put(entry);});
  lastText=text;lastAt=now;
  const ids=await list().then(xs=>xs.map(x=>x.id));if(ids.length>keep)await tx('readwrite',st=>{for(const id of ids.slice(keep))st.delete(id);});
  return true;
 }
 return {
  snapshot:(reason,force)=>snapshot(reason,force).catch(()=>false),
  // save() her çağrıldığında: en fazla intervalMs aralıkla yedek al.
  changed(){if(pending)return;const wait=Math.max(0,intervalMs-(Date.now()-lastAt));pending=setTimeout(()=>{pending=null;snapshot('auto').catch(()=>{});},wait);},
  list,get:getEntry
 };
 function getEntry(id){return tx('readonly',(st,done)=>{const q=st.get(id);q.onsuccess=()=>done(q.result);});}
 function list(){return globalThis.indexedDB?tx('readonly',(st,done)=>{const q=st.getAll();q.onsuccess=()=>done((q.result||[]).map(({data,...meta})=>meta).sort((a,b)=>b.id-a.id));}).catch(()=>[]):Promise.resolve([]);}
}

// ---- Uçuş öncesi kontrol ---------------------------------------------------
// Yalnız sorun varsa kısa bir liste döner; boş liste uyarı gösterilmeyeceği anlamına gelir.
export function preflightIssues(s,{online=true,offlineMap=false,android=false,background=false}={}){
 const issues=[],targets=(s.points||[]).filter(p=>p.role==='target'),race=s.race;
 if(!targets.length)issues.push('Planda hedef yok.');
 else if(!s.activeTargetId)issues.push('Aktif hedef seçilmedi; hedefe mesafe ve yön gösterilmez.');
 if(race){
  if(s.grid&&Number.isFinite(s.grid.zone)&&Number.isFinite(race.zone)&&s.grid.zone!==race.zone)issues.push('Plan koordinat referansı (UTM '+s.grid.zone+') yarışma haritasıyla (UTM '+race.zone+') uyuşmuyor. Ayarlar’dan yarışma profilini seçin.');
  const b=race.bounds;if(Array.isArray(b)&&b.length===2&&targets.length){const [[south,west],[north,east]]=b,pad=.25,out=targets.filter(p=>p.lat<south-pad||p.lat>north+pad||p.lng<west-pad||p.lng>east+pad);if(out.length)issues.push(out.length+' hedef yarışma alanının çok dışında: '+out.slice(0,3).map(p=>p.name).join(', ')+'.');}
  if(s.pzWarnings===false)issues.push('PZ yaklaşma uyarıları kapalı.');
 }
 if(!online&&!offlineMap&&s.base!=='offline'&&!race?.mapType)issues.push('İnternet yok ve çevrimdışı harita yüklü değil; harita boş görünebilir.');
 if(android&&!background)issues.push('Arka plan konumu kapalı: Balloon Live’a geçince konum ve rüzgâr kaydı durur.');
 // Yerel köprü yoksa (tarayıcı/iOS) arka planda kayıt teknik olarak mümkün değildir;
 // pilot bunu kalkıştan önce bilmeli, uçuş sırasında fark etmemeli.
 if(!android)issues.push('Tarayıcı sürümünde arka plan kaydı yok: ekran kilitlenirse veya uygulamadan çıkarsanız rota, rüzgâr ve dikey hız kaydı durur. Otomatik kilidi kapatın ve uygulamayı önde tutun.');
 return issues;
}

// TDS'deki pilot beyanı kuralları (PDG, FON vb.): ham metinden kısa, Türkçe maddeler.
const RULE_END='(?= [a-h]\. | MMA | NOTES|$)';
const RULES=[
 ['Beyan',new RegExp('Method of declaration (.+?)'+RULE_END,'i')],
 ['Hedef sayısı',new RegExp('Number of goals permitted (.+?)'+RULE_END,'i')],
 ['Geçerli hedef',new RegExp('Goals available for declaration (.+?)'+RULE_END,'i')],
 ['Beyan noktasına',/between declaration point and declared goal\(s\) (min\..*?max\. ?\S+)/i],
 ['Hakem hedeflerine',/(?:from any goal set by the director|from director goal\(s\)) (min\..*?max\. ?\S+)/i]
];
function distanceRule(v){return v.replace(/min\.\s*/i,'en az ').replace(/,?\s*max\.\s*no\b/i,' · üst sınır yok').replace(/,?\s*max\.\s*/i,' · en fazla ');}
export function taskRules(raw){
 const text=String(raw||'').replace(/\s+/g,' ');
 return RULES.map(([label,re])=>{const m=text.match(re);if(!m)return null;const v=m[1].trim();return {label,value:/uzaklık|noktasına|hedeflerine/.test(label)?distanceRule(v):v};}).filter(Boolean);
}
