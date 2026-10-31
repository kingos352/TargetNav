// ICAO standard-atmosphere altimeter scale. PALT = indicated height + reference height.
// WMO Guide 8, 3.2.2 (NOAA-hosted CWOP-WMO8.pdf), equations 3.1–3.3.
export function barometricAltitude(pressure,qnh){
 if(!Number.isFinite(pressure)||pressure<300||pressure>1100)throw Error('Ortam basıncı 300–1100 hPa olmalı.');
 if(!Number.isFinite(qnh)||qnh<850||qnh>1100)throw Error('QNH 850–1100 hPa olmalı.');
 return (.3048*1e6/6.8756)*(Math.pow(qnh/1013.25,.1903)-Math.pow(pressure/1013.25,.1903));
}
export function validateBarometer(b){
 if(!b||typeof b!=='object')throw Error('Basınç ayarı geçersiz.');
 barometricAltitude(b.pressure??1013.25,b.qnh);
 if(b.pressure!==null&&(!Number.isFinite(b.time)||b.time<=0))throw Error('Basınç ölçüm zamanı geçersiz.');
 return {qnh:b.qnh,pressure:b.pressure??null,time:b.pressure==null?null:b.time};
}
export function freshBarometer(b,now=Date.now()){return !!b&&b.pressure!==null&&Number.isFinite(b.time)&&now-b.time>=0&&now-b.time<=300000;}
