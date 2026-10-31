import test from 'node:test';
import assert from 'node:assert/strict';
import {barometricAltitude,validateBarometer,freshBarometer} from '../dist/barometer.mjs';
import {validateState} from '../dist/core.mjs';
test('QNH eşit ortam basıncı sıfır irtifa verir',()=>assert.equal(barometricAltitude(1010,1010),0));
test('ICAO basınç irtifası referansı ve QNH yönü',()=>{assert.ok(Math.abs(barometricAltitude(900,1013.25)-988.5)<2);assert.ok(barometricAltitude(900,1020)>barometricAltitude(900,1000));assert.ok(barometricAltitude(1020,1013.25)<0);});
test('Geçersiz veya boş basınçlar kabul edilmez',()=>{for(const p of [NaN,Infinity,0,299,1101])assert.throws(()=>barometricAltitude(p,1013.25));for(const q of [NaN,0,849,1101])assert.throws(()=>barometricAltitude(900,q));assert.throws(()=>validateBarometer({qnh:1000,pressure:900,time:null}));});
test('QNH tek başına ölçüm değildir; eski ve gelecekteki veri canlı gösterilmez',()=>{const b={qnh:1013.25,pressure:900,time:1000000};assert.equal(freshBarometer(b,1001000),true);assert.equal(freshBarometer(b,1300001),false);assert.equal(freshBarometer(b,999999),false);assert.equal(freshBarometer({qnh:1000,pressure:null,time:null}),false);});
test('Basınç ayarı yedeklemede korunur ve bozuk ayar reddedilir',()=>{const s={version:1,name:'Test',method:'geodesic',base:'standard',center:[38,34],zoom:12,points:[],shapes:[],tasks:[],track:[],winds:[],barometer:{qnh:1013.25,pressure:900,time:Date.now()}};assert.deepEqual(validateState(structuredClone(s)).barometer,s.barometer);s.barometer.qnh=100;assert.throws(()=>validateState(s));});
