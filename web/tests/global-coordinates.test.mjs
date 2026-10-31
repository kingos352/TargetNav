import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import proj4 from 'proj4';import geodesic from 'geographiclib-geodesic';
import {automaticGrid,describePoint,resolveCoordinate,preserveShapeReferences} from '../dist/global-coordinates.mjs';
import {fromGrid,circlePoints,validateState} from '../dist/core.mjs';
globalThis.proj4=proj4;globalThis.geodesic=geodesic;
const profiles=JSON.parse(fs.readFileSync(new URL('../dist/competitions.json',import.meta.url)));
test('Global display ignores SHM bounds and returns point-specific zones in both hemispheres',()=>{
 for(const [p,zone,hem] of [[{lat:38.628177,lng:34.863813},36,'N'],[{lat:38.2855,lng:34.542},36,'N'],[{lat:46.635,lng:16.175},33,'N'],[{lat:-33.8688,lng:151.2093},56,'S'],[{lat:35.68,lng:139.76},54,'N'],[{lat:40.7,lng:-74},18,'N']]){
  const c=describePoint(p,profiles[0].grid);assert.equal(c.grid.zone,zone);assert.equal(c.grid.hemisphere,hem);
  const decoded=resolveCoordinate(c.code,null,p);assert.ok(geodesic.Geodesic.WGS84.Inverse(p.lat,p.lng,decoded.lat,decoded.lng).s12<7.2);
 }
 assert.equal(describePoint({lat:38.628177,lng:34.863813}).code,'6224/7716');
 assert.equal(describePoint({lat:-33.8688,lng:151.2093},profiles[1].grid).grid.zone,56);
});
test('Short input chooses nearest map-center block across a 100km boundary',()=>{
 const g=automaticGrid({lat:38.6,lng:34.8});
 const anchor=fromGrid(699990,4299990,g),p=resolveCoordinate('0001/0001 - 4500ft',null,anchor);
 assert.equal(p.e,700010);assert.equal(p.n,4300010);assert.equal(p.altitudeOriginal,4500);
 const elsewhere=resolveCoordinate('0001/0001',null,fromGrid(599990,4199990,g));assert.equal(elsewhere.e,600010);assert.equal(elsewhere.n,4200010);
 assert.throws(()=>resolveCoordinate('0000/5000',null,fromGrid(450000,4250000,g)),/eşit uzaklıkta/);
});
test('Explicit competition profile overrides center; provisional profile does not',()=>{
 const anchor={lat:38.64,lng:34.83};const p=resolveCoordinate('9116/6847',profiles[1].grid,anchor);
 assert.ok(p.lat>46&&p.lat<48);assert.ok(p.lng>15&&p.lng<18);
 assert.doesNotThrow(()=>resolveCoordinate('3486/3862',profiles[0].grid,anchor));
});
test('Explicit full UTM and GPS do not depend on the current map region',()=>{
 const center={lat:-33.8,lng:151.2};const p=resolveCoordinate('36N 662238 4277164',null,center);
 assert.ok(Math.abs(p.lat-38.628177)<.00002);assert.ok(Math.abs(p.lng-34.863813)<.00002);
 assert.equal(resolveCoordinate('89, 30',null,center).lat,89);
 assert.throws(()=>describePoint({lat:89,lng:30}),/UTM kapsamı/);
 assert.throws(()=>resolveCoordinate('61N 662238 4277164',null,center));
});
test('Norway, Svalbard and longitude endpoints use valid UTM zones',()=>{
 assert.equal(automaticGrid({lat:60,lng:4}).zone,32);assert.equal(automaticGrid({lat:75,lng:10}).zone,33);
 assert.equal(automaticGrid({lat:0,lng:180}).zone,60);assert.equal(automaticGrid({lat:0,lng:-180}).zone,1);
});
test('Saved point locations and grid geometry survive profile changes and backup validation',()=>{
 const grid=profiles[0].grid,point={id:'p1',name:'Hedef',role:'target',lat:38.64,lng:34.83};
 const state={version:1,name:'Test',competitionId:'turkiye2026',grid:structuredClone(grid),points:[point],shapes:[{id:'s1',kind:'circle',ids:['p1'],radius:1000,method:'grid'}],tasks:[],track:[],winds:[],center:[point.lat,point.lng],zoom:12,base:'standard',method:'geodesic',selected:'p1'};
 const before=circlePoints(point,1000,state.grid,'grid');preserveShapeReferences(state);state.grid=null;state.competitionId=null;
 assert.deepEqual(circlePoints(point,1000,state.shapes[0].grid,'grid'),before);
 assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))).points[0],point);
});
