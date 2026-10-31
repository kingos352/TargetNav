import {validLL,validateGrid,toGrid,fromGrid,parseCoord} from './core.mjs';

export function automaticGrid(p){
 validLL(p);
 if(p.lat < -80 || p.lat > 84)throw Error('Bu konum UTM kapsamı dışında (80°G–84°K). GPS koordinatı kullanın.');
 let zone=Math.min(60,Math.floor((p.lng+180)/6)+1);
 if(p.lat>=56&&p.lat<64&&p.lng>=3&&p.lng<12)zone=32;
 if(p.lat>=72&&p.lng>=0&&p.lng<42)zone=p.lng<9?31:p.lng<21?33:p.lng<33?35:37;
 const hemisphere=p.lat<0?'S':'N';
 return {zone,hemisphere,baseE:0,baseN:0,unit:10,verified:true,shortReady:true,
  crs:`+proj=utm +zone=${zone}${hemisphere==='S'?' +south':''} +datum=WGS84 +units=m +no_defs`,
  source:'Konumdan otomatik WGS84 / UTM',automatic:true};
}
export function explicitGrid(g){return g&&!g.provisional&&g.shortReady!==false?g:null;}
export function describePoint(p,profile){
 const configured=explicitGrid(profile),natural=automaticGrid(p);
 const grid=configured&&(!/\+datum=WGS84\b/i.test(configured.crs)||(configured.zone===natural.zone&&configured.hemisphere===natural.hemisphere))?configured:natural;validateGrid(grid);
 if(grid.unit!==10)throw Error('4/4 gösterimi için 10 m grid gerekli.');
 const {e,n}=toGrid(p,grid);
 if(e<100000||e>900000||n<0||n>10000000)throw Error('Nokta seçili projeksiyonun kapsamı dışında. Otomatik WGS84 seçin.');
 const re=Math.round(e/10)*10,rn=Math.round(n/10)*10;
 const code=[re,rn].map(v=>String(Math.floor(v/10)%10000).padStart(4,'0')).join('/');
 const datum=/\+datum=WGS84\b/i.test(grid.crs)?'WGS84':'Yarışma datumu';
 return {code,e,n,grid,label:`${datum} · UTM ${grid.zone}${grid.hemisphere}`};
}
export function resolveCoordinate(text,profile,anchor){
 validLL(anchor);
 try{const gps=parseCoord(text,null);if(gps.format==='WGS84')return {...gps,reference:'WGS84 · GPS'};}catch{}
 const grid=explicitGrid(profile);
 if(grid)return {...parseCoord(text,grid),reference:`Yarışma profili · UTM ${grid.zone}${grid.hemisphere}`};
 let auto=automaticGrid(anchor);
 const clean=text.trim().replace(/^(?:Goal|Hedef)\s*(?:[A-C]\s+)?/i,'').replace(/\s*(?:[·•]\s*|-\s+)?-?\d+(?:[.,]\d+)?\s*(?:ft|feet|m)\s*$/i,'').trim();
 const short=clean.match(/^(\d{4})\s*(?:[/–-]|\s)\s*(\d{4})$/)||clean.match(/^(\d{4})(\d{4})$/);
 if(short){
  const a=toGrid(anchor,auto),se=Number(short[1])*10,sn=Number(short[2])*10;
  const eb=Math.round((a.e-se)/100000)*100000,nb=Math.round((a.n-sn)/100000)*100000,candidates=[];
  for(const be of [eb-100000,eb,eb+100000])for(const bn of [nb-100000,nb,nb+100000]){
   const e=be+se,n=bn+sn;
   try{const p=fromGrid(e,n,auto);if((p.lat<0)!==(auto.hemisphere==='S'))continue;
    candidates.push({e,n,d:Math.hypot(e-a.e,n-a.n),be,bn});}catch{}
  }
  candidates.sort((a,b)=>a.d-b.d);
  if(!candidates.length)throw Error('Bu bölgede kısa koordinat çözülemedi. Tam GPS veya UTM girin.');
  if(candidates[1]&&Math.abs(candidates[1].d-candidates[0].d)<1)throw Error('İki olası konum eşit uzaklıkta. Haritayı hedef bölgesine yaklaştırın veya tam UTM girin.');
  auto={...auto,baseE:candidates[0].be,baseN:candidates[0].bn};
  return {...parseCoord(text,auto),reference:`WGS84 · UTM ${auto.zone}${auto.hemisphere} · harita merkezi`,automatic:true};
 }
 // Explicit full UTM carries its own zone. N/S here are hemisphere letters;
 // other letters are latitude bands.
 const zone=clean.match(/^(\d{1,2})([C-HJ-NP-X])\s+/i);
 if(zone){const z=Number(zone[1]),band=zone[2].toUpperCase();if(z<1||z>60)throw Error('UTM zonu 1–60 olmalı.');
  const south=band==='S'||band<'N';
  auto={...auto,zone:z,hemisphere:south?'S':'N',band:band==='N'||band==='S'?undefined:band,crs:`+proj=utm +zone=${z}${south?' +south':''} +datum=WGS84 +units=m +no_defs`};
 }
 const p=parseCoord(text,auto);
 return {...p,reference:p.format==='WGS84'?'WGS84 · GPS':`WGS84 · UTM ${auto.zone}${auto.hemisphere}`};
}
export function preserveShapeReferences(state){
 if(state.grid)for(const shape of state.shapes)if(shape.method==='grid'&&!shape.grid)shape.grid=structuredClone(state.grid);
}
