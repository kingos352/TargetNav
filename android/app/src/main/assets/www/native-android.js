// Trusted bundled page only. Device GPS uses Android LocationManager, without GMS.
(()=>{
 if(!window.TargetNavAndroid)return;
 const watchers=new Map();let sequence=0;
 const api={
  watchPosition(success,error,options={}){
   const id=++sequence,w={success,error,timer:null};watchers.set(id,w);
   const timeout=Number(options.timeout);if(timeout>0&&Number.isFinite(timeout))w.timer=setTimeout(()=>error?.({code:3,message:'GPS zaman aşımı; yeni konum bekleniyor.'}),timeout);
   TargetNavAndroid.startGPS();return id;
  },
  clearWatch(id){const w=watchers.get(id);if(w)clearTimeout(w.timer);watchers.delete(id);if(!watchers.size)TargetNavAndroid.stopGPS();},
  getCurrentPosition(success,error,options){let id=api.watchPosition(p=>{api.clearWatch(id);success(p);},e=>{api.clearWatch(id);error?.(e);},options);}
 };
 Object.defineProperty(navigator,'geolocation',{value:api,configurable:true});
 window.TargetNavNative={
  position(p){for(const w of [...watchers.values()]){clearTimeout(w.timer);w.success(p);}},
  error(code,message){for(const w of [...watchers.values()])w.error?.({code,message});},
  save(name,data,type){const blob=new Blob([data],{type});if(blob.size>40*1024*1024){alert('Dışa aktarılan dosya 40 MB sınırını aşıyor.');return;}const r=new FileReader();r.onload=()=>TargetNavAndroid.saveFile(name,type,String(r.result).split(',')[1]);r.onerror=()=>alert('Dosya hazırlanamadı.');r.readAsDataURL(blob);}
 };
})();
