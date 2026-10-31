import test from 'node:test';import assert from 'node:assert/strict';import {VerticalSpeedEstimator,VARIO_LIMITS,formatVerticalSpeed} from '../dist/vertical-speed.mjs';
const base=1700000000000;
// Yinelenebilir sözde-gürültü: testler sabit tohumla çalışır, rastgele kırılganlık olmaz.
const noise=seed=>{let s=seed;return()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff*2-1;};};
const fix=(i,extra={})=>({time:base+i*1000,altitude:1200,altitudeAccuracy:8,accuracy:5,...extra});
const feed=(c,start=0,end=25,extra={})=>{let r;for(let i=start;i<=end;i++){const p=fix(i,typeof extra==='function'?extra(i):extra);r=c.push(p,p.time);}return r;};

test('Sabit tırmanış doğru hızı verir; işaret pozitiftir',()=>{
 const r=feed(new VerticalSpeedEstimator(),0,25,i=>({altitude:1200+1.5*i}));
 assert.equal(r.state,'ready');
 assert.ok(Math.abs(r.rate-1.5)<1e-9,'eğim 1,5 m/s olmalı, bulunan '+r.rate);
 // Belirsizlik, artıkların saçılımından değil cihazın BİLDİRDİĞİ dikey doğruluktan gelir.
 // Örnekler tesadüfen kusursuz bir doğruya otursa bile ±8 m'lik ölçümden 0,3 m/s'den
 // iyi bir eğim iddia edilemez; sapmayan ama kayan bir GNSS çözümü de düz görünür.
 assert.ok(r.sigma>.2&&r.sigma<.4,'±8 m doğrulukta beklenen belirsizlik ~0,29 m/s, bulunan '+r.sigma);
});

test('Sabit alçalma negatif işaret verir',()=>{
 const r=feed(new VerticalSpeedEstimator(),0,25,i=>({altitude:1600-2.4*i}));
 assert.equal(r.state,'ready');
 assert.ok(Math.abs(r.rate+2.4)<1e-9);
});

test('Sabit irtifada dikey hız sıfırdır',()=>{
 const r=feed(new VerticalSpeedEstimator());
 assert.equal(r.state,'ready');
 assert.ok(Math.abs(r.rate)<1e-9);
});

test('Gerçekçi GPS gürültüsü altında kestirim ±0,25 m/s içinde kalır',()=>{
 // ±8 m dikey doğruluk, 1 Hz, 20 s pencere: naif Δh/Δt burada ±10 m/s saçar.
 for(const truth of [-2,-.5,0,.8,2.5]){
  const rnd=noise(97);
  const r=feed(new VerticalSpeedEstimator(),0,25,i=>({altitude:1200+truth*i+rnd()*8}));
  assert.equal(r.state,'ready','gürültülü ama geçerli veride ready beklenir');
  assert.ok(Math.abs(r.rate-truth)<.25,truth+' m/s için sapma çok büyük: '+r.rate);
 }
});

test('Belirsizlik eşiği aşılırsa sayı gösterilmez',()=>{
 const rnd=noise(5);
 // Dikey doğruluk sınırda, irtifa tamamen gürültü: güvenilir eğim yok.
 const r=feed(new VerticalSpeedEstimator(),0,25,()=>({altitude:1200+rnd()*38,altitudeAccuracy:38}));
 assert.equal(r.state,'noisy');
 assert.equal(r.rate,null,'güvenilmeyen kestirim null dönmeli');
 assert.ok(r.sigma>VARIO_LIMITS.maxSigma);
});

test('Tek aykırı irtifa sıçraması kestirimi bozmaz',()=>{
 const r=feed(new VerticalSpeedEstimator(),0,25,i=>({altitude:1200+1*i+(i===12?60:0)}));
 assert.equal(r.state,'ready');
 assert.ok(Math.abs(r.rate-1)<.1,'aykırı örnek elenmeliydi, bulunan '+r.rate);
 assert.ok(r.rejected>=1,'aykırı değer sayılmalı');
});

test('Kısa pencere ready vermez; ±8 m doğrulukta birkaç saniye eğim çözmeye yetmez',()=>{
 const c=new VerticalSpeedEstimator();
 assert.equal(feed(c,0,2).state,'collecting','örnek sayısı yetersiz');
 assert.equal(feed(c,3,8).state,'collecting','pencere dolmadan güvenilir eğim yok');
 assert.equal(feed(c,9,25).state,'ready','pencere dolunca çözülmeli');
});

test('Pencere dolduğu hâlde eğim çözülemiyorsa noisy, dolmadan önce collecting',()=>{
 const rnd=noise(31),bad=()=>({altitude:1200+rnd()*38,altitudeAccuracy:38});
 const c=new VerticalSpeedEstimator();
 assert.equal(feed(c,0,8,bad).state,'collecting');
 assert.equal(feed(c,9,25,bad).state,'noisy');
});

test('Eski, gelecekteki ve yinelenen veri reddedilir',()=>{
 const c=new VerticalSpeedEstimator(),p=fix(0);
 assert.equal(c.push(p,p.time+VARIO_LIMITS.staleMs+1000).state,'stale');
 assert.equal(c.push(p,p.time-3000).state,'stale');
 feed(c,0,6);
 assert.equal(c.push(fix(5),fix(7).time).state,'duplicate');
});

test('Uzun GPS boşluğu pencereyi sıfırlar; boşluk üstünden eğim uydurulmaz',()=>{
 const c=new VerticalSpeedEstimator();
 feed(c,0,10,i=>({altitude:1200+i}));
 const after=c.push(fix(60,{altitude:1800}),fix(60).time);
 assert.equal(after.state,'collecting');
 assert.equal(after.samples,1,'boşluk sonrası pencere sıfırlanmalı');
});

test('Eksik irtifa veya kötü dikey doğruluk kestirimi durdurur',()=>{
 for(const extra of [{altitude:null},{altitude:undefined},{altitudeAccuracy:VARIO_LIMITS.maxVerticalAccuracy+1}])
  assert.equal(feed(new VerticalSpeedEstimator(),0,25,extra).state,'vertical');
});

test('Cihaz dikey doğruluk vermese de kestirim sürer, belirsizlik görünür',()=>{
 const r=feed(new VerticalSpeedEstimator(),0,25,i=>({altitude:1200+1.2*i,altitudeAccuracy:null}));
 assert.equal(r.state,'ready','altitudeAccuracy null olduğunda reddedilmemeli');
 assert.ok(Math.abs(r.rate-1.2)<1e-9);
});

test('Fiziksel sınırın üstündeki dikey hız kabul edilmez ve durum titremez',()=>{
 const c=new VerticalSpeedEstimator();
 assert.equal(feed(c,0,25,i=>({altitude:1200+30*i})).state,'vertical');
 // Reddetme pencereyi sıfırlamamalı; aksi hâlde her örnekte vertical↔collecting salınır.
 for(let i=26;i<=30;i++){const p=fix(i,{altitude:1200+30*i});assert.equal(c.push(p,p.time).state,'vertical','durum kararlı kalmalı');}
});

test('Gecikme (lag) raporlanır ve pencerenin yarısı mertebesindedir',()=>{
 const r=feed(new VerticalSpeedEstimator(),0,25,i=>({altitude:1200+i}));
 assert.equal(r.state,'ready');
 assert.ok(r.lagSec>0&&r.lagSec<VARIO_LIMITS.windowMs/1000,'lag pencere içinde olmalı: '+r.lagSec);
 assert.ok(Math.abs(r.lagSec-10)<1.5,'20 s pencerede gecikme ~10 s beklenir: '+r.lagSec);
});

test('İyi dikey doğrulukta hızlı pencere tırmanışı kararlı pencereden önce görür',()=>{
 // 8 s'lik pencere ancak dikey doğruluk iyiyken (±3 m) eğim çözebilir.
 const c=new VerticalSpeedEstimator();
 feed(c,0,20,{altitude:1200,altitudeAccuracy:3});                        // 20 s duruş
 const r=feed(c,21,28,i=>({altitude:1200+3*(i-20),altitudeAccuracy:3})); // burner: 3 m/s
 assert.equal(r.state,'ready');
 assert.ok(r.fast,'hızlı pencere kestirimi olmalı');
 assert.ok(r.fast.rate>r.rate+.5,'hızlı pencere değişime daha çabuk tepki vermeli: fast='+r.fast.rate+' smooth='+r.rate);
});

test('Zayıf dikey doğrulukta hızlı pencere sessiz kalır, uydurma değer üretmez',()=>{
 // ±8 m / 1 Hz / 8 s fiziksel olarak eğim çözmeye yetmez; fast null olmalı.
 const c=new VerticalSpeedEstimator();
 const r=feed(c,0,25,i=>({altitude:1200+1.5*i}));
 assert.equal(r.state,'ready');
 assert.equal(r.fast,null,'çözülemeyen hızlı pencere null dönmeli');
});

test('Dikey hız biçimi işaret ve virgül kullanır',()=>{
 assert.equal(formatVerticalSpeed(1.25),'+1,3');
 assert.equal(formatVerticalSpeed(-0.84),'−0,8');
 assert.equal(formatVerticalSpeed(0),'0,0');
 assert.equal(formatVerticalSpeed(null),'—');
});
