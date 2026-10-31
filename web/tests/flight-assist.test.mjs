import test from 'node:test';import assert from 'node:assert/strict';import geodesic from 'geographiclib-geodesic';globalThis.geodesic=geodesic;
const {PZAlerter,windLine,windLineOffset,preflightIssues,summarizePlan,playPZAlert}=await import('../dist/flight-assist.mjs');
const zone=(name,color='red')=>({name,color});
test('PZ uyarısı yalnız durum değişince ve bekleme süresinden sonra çalar',()=>{const a=new PZAlerter({cooldownMs:60000});assert.equal(a.update([{zone:zone('PZ 1'),inside:false}],0),'near');assert.equal(a.update([{zone:zone('PZ 1'),inside:false}],1000),null);assert.equal(a.update([{zone:zone('PZ 1'),inside:true}],2000),'inside');assert.equal(a.update([],3000),null);assert.equal(a.update([{zone:zone('PZ 1'),inside:false}],4000),null,'aynı durum bekleme süresi içinde tekrar uyarmaz');assert.equal(a.update([],5000),null);assert.equal(a.update([{zone:zone('PZ 1'),inside:false}],70000),'near');});
test('Mavi irtifa bölgeleri sesli uyarı üretmez; içerideki bölge öncelikli',()=>{const a=new PZAlerter();assert.equal(a.update([{zone:zone('PZ 10','blue'),inside:true}],0),null);assert.equal(a.update([{zone:zone('PZ 2','yellow'),inside:false},{zone:zone('PZ 3'),inside:true}],0),'inside');});
test('Kapalı mod uyarı çalmaz',()=>{assert.equal(playPZAlert('inside','off'),false);assert.equal(playPZAlert(null,'vibrate'),false);});
test('Rüzgâr çizgisi hedeften rüzgârın geldiği yöne uzanır ve dakikaları doğru işaretler',()=>{const target={lat:38.65,lng:34.85},wind={from:270,speed:5};const line=windLine(target,wind,{minutes:20,step:10});assert.deepEqual(line.map(p=>p.minute),[0,10,20]);assert.equal(line[0].lat,target.lat);assert.ok(line[1].lng<target.lng,'batıdan esen rüzgârın çizgisi batıya uzanır');const d=geodesic.Geodesic.WGS84.Inverse(target.lat,target.lng,line[1].lat,line[1].lng).s12;assert.ok(Math.abs(d-3000)<0.01);});
test('Rüzgâr çizgisine uzaklık ve varış dakikası',()=>{const target={lat:38.65,lng:34.85},wind={from:270,speed:5};const p=windLine(target,wind,{minutes:10,step:10})[1];const r=windLineOffset(p,target,wind);assert.ok(r.offset<0.5);assert.ok(Math.abs(r.minutes-10)<0.01);assert.equal(windLine(target,{from:270,speed:0}).length,0);});
test('Uçuş öncesi kontrol yalnız gerçek sorunları listeler',()=>{const race={zone:36,bounds:[[38.51,34.72],[38.78,35.06]]};const ok={points:[{id:'a',role:'target',name:'T1',lat:38.6,lng:34.8}],activeTargetId:'a',grid:{zone:36},race,base:'standard'};assert.deepEqual(preflightIssues(ok,{online:true,android:true,background:true}),[]);const bad=preflightIssues({...ok,grid:{zone:33},activeTargetId:null,points:[{id:'b',role:'target',name:'Slo',lat:46.6,lng:16.2}],pzWarnings:false},{online:false,android:true,background:false});assert.equal(bad.length,6);assert.match(bad.join(' '),/UTM 33.*UTM 36/);assert.match(bad.join(' '),/Slo/);});
test('Yedek özeti',()=>{assert.deepEqual(summarizePlan({name:'X',points:[{role:'target'},{role:'launch'}],tasks:[1],track:[1,2]}),{name:'X',targets:1,tasks:1,track:2});});
test('TDS beyan kuralları okunur maddelere çevrilir',async()=>{const {taskRules}=await import('../dist/flight-assist.mjs');
const pdg='1   PDG   Pilot Declared Goal   Rule 15.1   in any order \n\na.   Method of declaration   Loggergoal #1 \n\nb.   Number of goals permitted   1 \n\nc.   Goals available for declaration   any valid coordinate with altitude above 2999ft \n\nd.   Minimum and maximum distances\n\nbetween declaration point and declared\n\ngoal(s) \n\nmin. 2km, max. no \n\ne.   Minimum distance of goal(s) from any\n\ngoal set by the director \n\nmin. 1km, max. no \n\nMMA   -';
assert.deepEqual(taskRules(pdg),[{label:'Beyan',value:'Loggergoal #1'},{label:'Hedef sayısı',value:'1'},{label:'Geçerli hedef',value:'any valid coordinate with altitude above 2999ft'},{label:'Beyan noktasına',value:'en az 2km · üst sınır yok'},{label:'Hakem hedeflerine',value:'en az 1km · üst sınır yok'}]);
const fon='3 FON Fly On a. Method of declaration Loggergoal #2 max. 3 valid declarations b. Number of goals permitted 1 c. Goals available for declaration any coordinate with altitude e. Minimum and maximum distance between declaration point and declared goal(s) min. 2km, max. no f. Minimum and maximum distances of declared goal(s) from director goal(s) min. 1km, max. 5km The result is the ratio MMA -';
const r=taskRules(fon);assert.equal(r[0].value,'Loggergoal #2 max. 3 valid declarations');assert.equal(r[4].value,'en az 1km · en fazla 5km');
assert.deepEqual(taskRules('2 JDG Judge Declared Goal Goal 5917/8033 · 3675 ft MMA -'),[]);});

// iPhone/Safari: yerel köprü yoktur, arka planda konum alınamaz. Pilot bunu
// kalkıştan önce görmeli; uçuş sırasında fark etmesi veri kaybı demektir.
test('Tarayıcı sürümünde arka plan kaydının olmadığı uçuş öncesi bildirilir',()=>{
 const race={id:'r',name:'Kapadokya',zone:36,hemisphere:'N',cla:[],zones:[],boundary:[],bounds:[[38.4,34.5],[38.9,35.1]]};
 const plan={points:[{id:'a',role:'target',name:'T1',lat:38.6,lng:34.8}],activeTargetId:'a',grid:{zone:36},race,base:'standard'};
 const browser=preflightIssues(plan,{online:true,android:false});
 assert.equal(browser.length,1,'tarayıcıda tek uyarı beklenir: '+JSON.stringify(browser));
 assert.match(browser[0],/arka plan kaydı yok/i);
 // Yerel köprü varsa bu uyarı çıkmaz; onun yerine arka plan ayarı denetlenir.
 assert.deepEqual(preflightIssues(plan,{online:true,android:true,background:true}),[]);
 const androidOff=preflightIssues(plan,{online:true,android:true,background:false});
 assert.equal(androidOff.length,1);
 assert.match(androidOff[0],/Arka plan konumu kapalı/);
});
