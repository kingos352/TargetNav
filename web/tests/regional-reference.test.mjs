import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import proj4 from 'proj4';
import {parseCoord,toGrid,shortCoordForPoint} from '../dist/core.mjs';
import {upgradeRegionalReference} from '../dist/regional-reference.mjs';
globalThis.proj4=proj4;
const profile=JSON.parse(fs.readFileSync(new URL('../dist/competitions.json',import.meta.url)))[0];
test('Seçilen GPS noktası doğru 4/4 koordinatı gösterir; geçersiz referans gösterilmez',()=>{
 const g=profile.grid, p={lat:38.628177,lng:34.863813};
 assert.equal(shortCoordForPoint(p,g).code,'6224/7716');
 const moved=parseCoord('6215/8680',g);assert.equal(shortCoordForPoint(moved,g).code,'6215/8680');
 assert.throws(()=>shortCoordForPoint({lat:38.28,lng:34.54},g));
 assert.throws(()=>shortCoordForPoint(p,null));
 assert.throws(()=>shortCoordForPoint(p,{...g,shortReady:false}));
});
test('SHM sector vertices resolve in one 100km block and sample goals roundtrip',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('./fixtures/shm-kapadokya-sectors.json',import.meta.url)));
 for(const p of source.sectors.flatMap(s=>s.points)){
  const {e,n}=toGrid(p,profile.grid);
  assert.equal(Math.floor(e/100000)*100000,600000);
  assert.equal(Math.floor(n/100000)*100000,4200000);
  const b=profile.grid.bounds;assert.ok(e>=b.minE&&e<=b.maxE&&n>=b.minN&&n<=b.maxN);
 }
 for(const coord of ['5866/7863','6026/8121','6187/8313','6272/8015','6053/8521','6215/8680']){
  const p=parseCoord(coord,profile.grid),q=toGrid(p,profile.grid);
  assert.ok(Math.abs(p.e-q.e)<.001&&Math.abs(p.n-q.n)<.001);
  assert.ok(p.lat>38.55&&p.lat<38.74&&p.lng>34.76&&p.lng<34.96);
 }
 assert.throws(()=>parseCoord('0000/0000',profile.grid));
 assert.equal(profile.grid.provisional,true);
});
test('Upgrade preserves all recorded data and never replaces a custom or official reference',()=>{
 const state={competitionId:profile.id,grid:{id:profile.id,shortReady:false},points:[{lat:38.64,lng:34.83}],tasks:[{id:'task'}],shapes:[{method:'geodesic'}],track:[{timestamp:123}],method:'geodesic'};
 const before=JSON.stringify([state.points,state.tasks,state.shapes,state.track]);
 assert.equal(upgradeRegionalReference(state,profile),true);
 assert.equal(JSON.stringify([state.points,state.tasks,state.shapes,state.track]),before);
 assert.equal(state.grid.shortReady,true);
 assert.equal(upgradeRegionalReference(state,profile),false);
 for(const grid of [{id:'custom',shortReady:true},{id:profile.id,shortReady:true}]){
  const s={competitionId:profile.id,grid};assert.equal(upgradeRegionalReference(s,profile),false);assert.equal(s.grid,grid);
 }
});
