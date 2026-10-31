// Dikey hız (vario) kestirimi.
//
// GNSS irtifası gürültülüdür: yatay doğruluğun 2–3 katı, tipik ±5–15 m. Ardışık iki
// örneğin farkını almak (Δh/Δt) 1 Hz'de ±10 m/s mertebesinde çöp üretir. Bunun yerine
// kayan bir zaman penceresine ağırlıklı en küçük kareler doğrusu uydurulur; doğrunun
// eğimi dikey hızdır ve uyumun kendisi bir belirsizlik (sigma) verir.
//
// Belirsizlik eşiği aşılırsa sayı DÖNDÜRÜLMEZ. Yarışma uygulamasında doğrulanamayan
// bir değeri göstermek, hiç göstermemekten kötüdür.
//
// Barometre bu modülde kullanılmaz; cihazda basınç sensörü varsa ileride aynı
// kestirimciye ikinci kaynak olarak beslenebilir (pushPressureAltitude).

export const VARIO_LIMITS=Object.freeze({
 windowMs:20000,          // kararlı pencere; eğim belirsizliği ~T^-1.5 ile düşer
 fastWindowMs:8000,       // burner tepkisini erken görmek için kısa pencere
 minSamples:5,
 minDurationSec:6,
 maxGapMs:6000,           // bu süreden uzun boşluk pencereyi sıfırlar
 staleMs:15000,           // bu yaştan eski konum kullanılmaz
 maxVerticalAccuracy:40,  // ±40 m'den kötü dikey doğruluk kestirime girmez
 defaultVerticalAccuracy:12, // cihaz dikey doğruluk vermiyorsa varsayılan sigma
 maxSigma:.45,            // m/s; bundan belirsiz kestirim 'noisy' sayılır
 outlierMAD:3,            // medyan mutlak sapmanın kaç katı aykırı sayılır
 maxRate:15               // m/s; balon için fiziksel üst sınır, üstü reddedilir
});

const number=v=>typeof v==='number'&&Number.isFinite(v);
const median=xs=>{const s=[...xs].sort((a,b)=>a-b),h=s.length>>1;return s.length%2?s[h]:(s[h-1]+s[h])/2;};

/** Ağırlıklı doğrusal regresyon. w=1/sigma^2. Eğim, kesişim ve eğimin varyansını döndürür. */
function weightedFit(points){
 let S=0,Sx=0,Sy=0,Sxx=0,Sxy=0;
 for(const p of points){const w=p.w;S+=w;Sx+=w*p.x;Sy+=w*p.y;Sxx+=w*p.x*p.x;Sxy+=w*p.x*p.y;}
 const delta=S*Sxx-Sx*Sx;
 if(!(delta>0))return null;
 const slope=(S*Sxy-Sx*Sy)/delta,intercept=(Sxx*Sy-Sx*Sxy)/delta;
 // Biçimsel varyans beyaz gürültü varsayar. GNSS irtifa hatası zaman-korelasyonludur
 // (çok yollu yayılım, uydu geometrisi değişimi), bu yüzden artıkların saçılımıyla
 // ölçeklenir: indirgenmiş ki-kare > 1 ise belirsizlik şişirilir.
 let chi2=0;
 for(const p of points){const r=p.y-(intercept+slope*p.x);chi2+=p.w*r*r;}
 const dof=points.length-2,reduced=dof>0?chi2/dof:1,scale=Math.max(1,reduced);
 return {slope,intercept,variance:(S/delta)*scale,reduced,anchorX:Sx/S};
}

/** Bir pencereden eğim çıkarır; aykırı örnekleri bir tur eleyip yeniden uydurur. */
function estimate(frames,now){
 if(frames.length<VARIO_LIMITS.minSamples)return null;
 const t0=frames.at(-1).time;
 const build=fs=>fs.map(f=>{const sigma=f.altitudeAccuracy;return {x:(f.time-t0)/1000,y:f.altitude,w:1/(sigma*sigma),frame:f};});
 let points=build(frames);
 let fit=weightedFit(points);
 if(!fit)return null;
 // MAD tabanlı aykırı değer reddi: uydu takımyıldızı değişiminde irtifa sıçraması olur.
 const residuals=points.map(p=>p.y-(fit.intercept+fit.slope*p.x));
 const center=median(residuals),mad=median(residuals.map(r=>Math.abs(r-center)));
 if(mad>0){
  const cut=VARIO_LIMITS.outlierMAD*1.4826*mad;
  const kept=points.filter((p,i)=>Math.abs(residuals[i]-center)<=cut);
  if(kept.length>=VARIO_LIMITS.minSamples&&kept.length<points.length){
   const refit=weightedFit(kept);
   if(refit){points=kept;fit=refit;}
  }
 }
 const duration=(frames.at(-1).time-frames[0].time)/1000;
 return {
  rate:fit.slope,
  sigma:Math.sqrt(fit.variance),
  samples:points.length,
  rejected:frames.length-points.length,
  duration,
  // Eğim, pencerenin ağırlık merkezindeki hızı temsil eder; son örneğe göre gecikme budur.
  lagSec:-fit.anchorX,
  residualScatter:fit.reduced
 };
}

export class VerticalSpeedEstimator{
 constructor(limits={}){this.limits={...VARIO_LIMITS,...limits};this.reset();}
 reset(){this.frames=[];this.lastInputTime=null;this.last=null;}
 idle(state){this.reset();return this.last={state,rate:null,sigma:null,samples:0,duration:0};}

 /**
  * Bir GPS konumunu kestirime besler.
  * p: {time,altitude,altitudeAccuracy,accuracy}
  * Döner: {state,rate,sigma,samples,duration,lagSec,fast}
  * state: idle | stale | duplicate | vertical | collecting | noisy | ready
  */
 push(p,now=Date.now()){
  const c=this.limits;
  if(!p||!number(p.time)||p.time>now+2000||now-p.time>c.staleMs)return this.idle('stale');
  if(this.lastInputTime!==null&&p.time<=this.lastInputTime)
   return this.last={...(this.last||{rate:null,sigma:null,samples:this.frames.length,duration:0}),state:'duplicate'};
  // Dikey doğruluk vermeyen cihazlar var; reddetmek yerine varsayılan sigma ile
  // devam edilir, belirsizlik zaten çıktıda görünür.
  const altitudeAccuracy=number(p.altitudeAccuracy)&&p.altitudeAccuracy>0?p.altitudeAccuracy:c.defaultVerticalAccuracy;
  if(!number(p.altitude)||altitudeAccuracy>c.maxVerticalAccuracy)return this.idle('vertical');
  if(this.lastInputTime!==null&&p.time-this.lastInputTime>c.maxGapMs)this.reset();
  this.lastInputTime=p.time;
  this.frames.push({time:p.time,altitude:p.altitude,altitudeAccuracy});
  this.frames=this.frames.filter(f=>f.time>=p.time-c.windowMs);

  const duration=this.frames.length>1?(this.frames.at(-1).time-this.frames[0].time)/1000:0;
  if(this.frames.length<c.minSamples||duration<c.minDurationSec)
   return this.last={state:'collecting',rate:null,sigma:null,samples:this.frames.length,duration};

  const smooth=estimate(this.frames,now);
  if(!smooth)return this.last={state:'collecting',rate:null,sigma:null,samples:this.frames.length,duration};
  // Fiziksel olarak imkânsız eğim: veri bozuk. Pencere sıfırlanmaz, yoksa
  // "reddet → sıfırla → topla → reddet" salınımı oluşur ve durum titrer.
  if(Math.abs(smooth.rate)>c.maxRate)
   return this.last={state:'vertical',rate:null,sigma:smooth.sigma,samples:smooth.samples,duration};
  // Pencere dolmadan önce belirsizlik zaten yüksektir; bu "gürültülü" değil "henüz
  // toplanıyor" demektir. 'noisy' yalnız pencere dolduğu hâlde eğim çözülemiyorsa.
  if(smooth.sigma>c.maxSigma){
   const settled=duration>=c.windowMs/1000-2;
   return this.last={state:settled?'noisy':'collecting',rate:null,sigma:smooth.sigma,samples:smooth.samples,duration};
  }

  // Kısa pencere: yanıt hızlıdır ama gürültülüdür. Yalnız yeterince kesinse yayımlanır.
  const fastFrames=this.frames.filter(f=>f.time>=this.frames.at(-1).time-c.fastWindowMs);
  const quick=fastFrames.length>=c.minSamples?estimate(fastFrames,now):null;
  const fast=quick&&quick.sigma<=c.maxSigma*2&&Math.abs(quick.rate)<=c.maxRate
   ?{rate:quick.rate,sigma:quick.sigma,duration:quick.duration}:null;

  return this.last={state:'ready',...smooth,fast};
 }
}

/** Dikey hızın insan okunur biçimi. FAI balon yarışmalarında birim m/s'dir. */
export function formatVerticalSpeed(rate,digits=1){
 if(!number(rate))return '—';
 const text=Math.abs(rate).toFixed(digits).replace('.',',');
 return (rate>0?'+':rate<0?'−':'')+text;
}

/** Göstergenin durum metni; telemetri hücresinin başlığında kullanılır. */
export const VARIO_MESSAGES=Object.freeze({
 idle:'Dikey hız için GPS bekleniyor',
 stale:'GPS verisi eski · dikey hız hesaplanamıyor',
 duplicate:'Yeni GPS örneği bekleniyor',
 vertical:'GPS irtifası veya dikey doğruluk yetersiz',
 collecting:'Dikey hız için örnek toplanıyor',
 noisy:'GPS irtifası çok gürültülü · güvenilir dikey hız yok',
 ready:'GPS irtifa eğiminden hesaplandı'
});
