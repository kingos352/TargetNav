import {inverse,norm} from './core.mjs';
export const DRIFT_LIMITS=Object.freeze({bandM:50,windowMs:60000,minDurationSec:20,minSamples:6,maxGapMs:15000,maxHorizontalAccuracy:25,maxVerticalAccuracy:35,maxAltitudeSpan:25,maxVerticalRate:.5,minSpeed:.5,maxSpeed:40,minCoherence:.9,maxRelativeSpeedSpread:.4});
const number=v=>typeof v==='number'&&Number.isFinite(v);
export class GPSDriftCollector{
 constructor(){this.reset();}
 reset(){this.frames=[];this.band=null;this.anchor=null;this.lastInputTime=null;}
 reject(state){this.reset();return {state,count:0,duration:0};}
 push(p,now=Date.now()){
  const c=DRIFT_LIMITS;
  if(!p||!number(p.time)||p.time>now+2000||now-p.time>15000)return this.reject('stale');
  if(this.lastInputTime!==null&&p.time<=this.lastInputTime)return {state:'duplicate',count:this.frames.length,duration:0};
  if(!number(p.accuracy)||p.accuracy<0||p.accuracy>c.maxHorizontalAccuracy||!number(p.lat)||!number(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180)return this.reject('horizontal');
  if(!number(p.altitude)||!number(p.altitudeAccuracy)||p.altitudeAccuracy<0||p.altitudeAccuracy>c.maxVerticalAccuracy)return this.reject('vertical');
  if(this.lastInputTime!==null&&p.time-this.lastInputTime>c.maxGapMs)this.reset();
  this.lastInputTime=p.time;const band=Math.round(p.altitude/c.bandM)*c.bandM;
  if(this.band!==band){this.frames=[];this.anchor=null;this.band=band;}
  let speed=p.speed,to=p.heading,method='gps-speed';
  if(!number(speed)||!number(to)||speed<0||to<0||to>=360){
   method='gps-positions';
   if(!this.anchor){this.anchor={...p};return {state:'position',count:0,duration:0};}
   const dt=(p.time-this.anchor.time)/1000;
   if(dt<12)return {state:'position',count:this.frames.length,duration:0};
   const old=this.anchor;this.anchor={...p};
   if(dt>15||Math.abs(p.altitude-old.altitude)>c.maxAltitudeSpan)return this.reject('altitude');
   const v=inverse(old,p,null,'geodesic');
   if(v.distance<Math.max(20,2*(old.accuracy+p.accuracy)))return this.reject('movement');
   speed=v.distance/dt;to=v.bearing;
  }else this.anchor={...p};
  if(speed<c.minSpeed)return this.reject('movement');
  if(speed>c.maxSpeed)return this.reject('unstable');
  const angle=to*Math.PI/180;
  const frame={time:p.time,altitude:p.altitude,e:speed*Math.sin(angle),n:speed*Math.cos(angle),speed,accuracy:p.accuracy,altitudeAccuracy:p.altitudeAccuracy,method};
  this.frames.push(frame);this.frames=this.frames.filter(x=>x.time>=p.time-c.windowMs);
  let f=this.frames,rangeMin=Math.min(...f.map(x=>x.altitude)),rangeMax=Math.max(...f.map(x=>x.altitude));
  if(rangeMax-rangeMin>c.maxAltitudeSpan){this.frames=[frame];return {state:'altitude',count:1,duration:0};}
  const duration=(f.at(-1).time-f[0].time)/1000,progress={count:f.length,duration};
  if(duration<c.minDurationSec||f.length<c.minSamples)return {state:'collecting',...progress};
  if(Math.abs(f.at(-1).altitude-f[0].altitude)/duration>c.maxVerticalRate)return {state:'altitude',...progress};
  let e=0,n=0,scalar=0,square=0,altitude=0;
  for(let i=1;i<f.length;i++){const a=f[i-1],b=f[i],dt=(b.time-a.time)/1000;if(dt>c.maxGapMs/1000)return this.reject('stale');e+=(a.e+b.e)/2*dt;n+=(a.n+b.n)/2*dt;scalar+=(a.speed+b.speed)/2*dt;square+=(a.speed*a.speed+b.speed*b.speed)/2*dt;altitude+=(a.altitude+b.altitude)/2*dt;}
  e/=duration;n/=duration;scalar/=duration;square/=duration;altitude/=duration;
  const mean=Math.hypot(e,n),coherence=scalar>0?mean/scalar:0,spread=scalar>0?Math.sqrt(Math.max(0,square-scalar*scalar))/scalar:1;
  if(mean<c.minSpeed||coherence<c.minCoherence||spread>c.maxRelativeSpeedSpread)return {state:'unstable',...progress};
  to=norm(Math.atan2(e,n)*180/Math.PI);
  return {state:'ready',...progress,estimate:{altitude:band,meanAltitude:altitude,bandM:c.bandM,speed:mean,to,from:norm(to+180),sampleCount:f.length,duration,firstTime:f[0].time,lastTime:p.time,rangeMin,rangeMax,maxHorizontalAccuracy:Math.max(...f.map(x=>x.accuracy)),maxVerticalAccuracy:Math.max(...f.map(x=>x.altitudeAccuracy)),coherence,method:f.some(x=>x.method==='gps-positions')?'gps-positions':'gps-speed'}};
 }
}
