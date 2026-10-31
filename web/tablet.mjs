import os from 'node:os';import net from 'node:net';
const free=port=>new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(port,'0.0.0.0',()=>s.close(()=>resolve(true)));});
let port=4180;while(port<4190&&!await free(port))port++;if(port===4190)throw Error('4180-4189 portlari dolu. Diger PUSULA tablet penceresini kontrol edin.');
console.log('\nPUSULA - TABLET BAGLANTISI\n');console.log('Bilgisayar ve tablet ayni Wi-Fi aginda olmali.');console.log('Tabletin tarayicisinda asagidaki adreslerden uygun olani acin:\n');
const addresses=Object.values(os.networkInterfaces()).flat().filter(n=>n.family==='IPv4'&&!n.internal);for(const n of addresses)console.log('  http://'+n.address+':'+port+'/');if(!addresses.length)console.log('Ag baglantisi bulunamadi. Wi-Fi baglantisini kontrol edin.');
console.log('\nBu pencere acik kalmali. Durdurmak icin Ctrl+C.');console.log('HTTP baglantisinda canli GPS ve cevrimdisi kurulum kullanilamaz.');console.log('Cihazlarin kayitlari ayridir. Dosyalar > Plan yedegi ile aktarabilirsiniz.');console.log('Ucus kullanimi icin guvenli HTTPS ve cihaz testi gerekir.\n');
process.env.AEROSTAT_PORT=String(port);process.env.AEROSTAT_HOST='0.0.0.0';await import('./server.mjs');
