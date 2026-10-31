import test from 'node:test';
import assert from 'node:assert/strict';
import {MotionEstimate,normalizeNavigation} from '../dist/flight-navigation.mjs';
const fix={time:100000,accuracy:5,speed:5,heading:359};
test('Motion hides stale, inaccurate, slow or missing course data and resets smoothing',()=>{for(const patch of [{time:80000},{accuracy:51},{speed:.5},{heading:null},{time:103000}]){const m=new MotionEstimate();assert.ok(m.update(fix,100000));assert.equal(m.update({...fix,...patch},100000),null);assert.equal(m.value,null);}});
test('Heading smooths across north without repeated timer drift',()=>{const m=new MotionEstimate();m.update(fix,100000);const value=m.update({...fix,time:101000,heading:1},101000);assert.ok(value.heading>358||value.heading<2);assert.deepEqual(m.update({...fix,time:101000,heading:1},102000),value);});
test('Inspection changes and reload preserve active navigation; deleted targets clear it',()=>{const state={points:[{id:'a',role:'target'},{id:'b',role:'target'}],selected:'b',activeTargetId:'a',projectionMinutes:5};normalizeNavigation(state);assert.equal(state.activeTargetId,'a');assert.equal(normalizeNavigation(JSON.parse(JSON.stringify(state))).activeTargetId,'a');state.points.shift();normalizeNavigation(state);assert.equal(state.activeTargetId,null);assert.equal(state.selected,'b');});
test('Older plans start without an inferred active target and with 3 minute projection',()=>{assert.deepEqual(normalizeNavigation({points:[],selected:'a'}),{points:[],selected:'a',activeTargetId:null,projectionMinutes:3});});
