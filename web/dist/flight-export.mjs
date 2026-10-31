const xml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function flightKML(state){
 const segments=[];let current=[];
 for(const p of state.track||[]){
  if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180){current=[];continue;}
  if(p.segmentStart||!current.length){current=[];segments.push(current);}current.push(p);
 }
 const body=segments.filter(s=>s.length).map((s,i)=>'<Placemark><name>Uçuş rotası '+(i+1)+'</name><styleUrl>#flight</styleUrl><ExtendedData><Data name="gpsAltitudesM"><value>'+xml(JSON.stringify(s.map(p=>Number.isFinite(p.altitude)?p.altitude:null)))+'</value></Data><Data name="timestamps"><value>'+xml(JSON.stringify(s.map(p=>Number.isFinite(p.time)?new Date(p.time).toISOString():null)))+'</value></Data></ExtendedData>'+(s.length===1?'<Point>':'<LineString><tessellate>1</tessellate>')+'<altitudeMode>clampToGround</altitudeMode><coordinates>'+s.map(p=>p.lng+','+p.lat).join(' ')+'</coordinates>'+(s.length===1?'</Point>':'</LineString>')+'</Placemark>').join('');
 return '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>'+xml(state.name||'TargetNav uçuşu')+'</name><description>GPS uçuş rotası. Kesintiler ayrı çizilir. GPS irtifası MSL olarak doğrulanmadığından rota zemine oturtulur; ham irtifa ve zamanlar ExtendedData içinde korunur.</description><Style id="flight"><LineStyle><color>ff1557ff</color><width>4</width></LineStyle></Style>'+body+'</Document></kml>';
}
