export function normalizeNavigation(state){
 if(!state.points.some(p=>p.id===state.activeTargetId&&p.role==='target'))state.activeTargetId=null;
 if(![0,1,3,5].includes(state.projectionMinutes))state.projectionMinutes=3;
 return state;
}
export class MotionEstimate{
 constructor(){this.reset();}
 reset(){this.value=null;this.time=null;}
 update(fix,now=Date.now()){
  if(!fix||!Number.isFinite(fix.time)||now-fix.time>15000||fix.time-now>2000||!Number.isFinite(fix.accuracy)||fix.accuracy<0||fix.accuracy>50||!Number.isFinite(fix.speed)||fix.speed<1||!Number.isFinite(fix.heading)){this.reset();return null;}
  if(this.time===fix.time)return this.value;
  const heading=((fix.heading%360)+360)%360;
  if(!this.value||fix.time-this.time>15000||fix.time<=this.time)this.value={speed:fix.speed,heading};
  else{const alpha=.4,delta=((heading-this.value.heading+540)%360)-180;this.value={speed:this.value.speed*(1-alpha)+fix.speed*alpha,heading:(this.value.heading+alpha*delta+360)%360};}
  this.time=fix.time;return this.value;
 }
}
