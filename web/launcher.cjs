'use strict';
const fs=require('node:fs');
const path=require('node:path');
const net=require('node:net');
const http=require('node:http');
const {spawn}=require('node:child_process');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function probe(port){return new Promise(resolve=>{const req=http.get({host:'127.0.0.1',port,path:'/health.json',timeout:1200},res=>{let text='';res.on('data',b=>{text+=b;if(text.length>16384)req.destroy();});res.on('end',()=>{try{const j=JSON.parse(text.replace(/^\uFEFF/,''));resolve(res.statusCode===200&&j.app==='Aerostat'?j:null);}catch{resolve(null);}});});req.on('timeout',()=>req.destroy());req.on('error',()=>resolve(null));});}
function isFree(port){return new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(port,'127.0.0.1',()=>s.close(()=>resolve(true)));});}
function openBrowser(url){return new Promise(resolve=>{const child=spawn(process.env.ComSpec||'cmd.exe',['/d','/c','start','',url],{windowsHide:true,stdio:'ignore'});child.once('error',()=>resolve(false));child.once('exit',code=>resolve(code===0));});}
async function launch(options={}){
  const root=options.root||__dirname;
  const firstPort=options.firstPort||4173;
  const runtimeDir=path.join(root,'runtime');
  const logPath=path.join(runtimeDir,'baslat.log');
  fs.mkdirSync(runtimeDir,{recursive:true});
  const log=message=>{fs.appendFileSync(logPath,new Date().toISOString()+' '+message+'\r\n');if(!options.quiet)console.log(message);};
  const finish=async(port,reused)=>{const url='http://localhost:'+port;log((reused?'Calisan uygulama bulundu: ':'Uygulama hazir: ')+url);if(port!==4173&&!options.quiet)console.log('Bu adresin kayitlari diger portlardan ayridir.');const browserOpened=options.openBrowser===false?false:await openBrowser(url);if(options.openBrowser!==false&&!browserOpened)log('Tarayici otomatik acilamadi. Bu adresi tarayicida acin: '+url);return {port,url,reused,browserOpened,logPath};};
  const ports=[firstPort];
  try{const remembered=JSON.parse(fs.readFileSync(path.join(runtimeDir,'launcher-state.json'),'utf8')).port;if(Number.isInteger(remembered)&&remembered>=firstPort&&remembered<=firstPort+9&&!ports.includes(remembered))ports.push(remembered);}catch{}
  for(let port=firstPort;port<firstPort+10;port++)if(!ports.includes(port))ports.push(port);
  for(const port of ports){if(await probe(port))return finish(port,true);}
  const serverFile=path.join(root,'server.mjs');
  if(!fs.existsSync(serverFile)||!fs.existsSync(path.join(root,'dist','index.html')))throw Error('Paket eksik. ZIP dosyasinin tamamini ayni klasore cikarin.');
  for(const port of ports){
    if(!await isFree(port)){log(port+' portu baska bir uygulama tarafindan kullaniliyor.');continue;}
    const fd=fs.openSync(path.join(runtimeDir,'sunucu.log'),'a');
    let child;try{child=spawn(process.execPath,[serverFile],{cwd:root,env:{...process.env,AEROSTAT_PORT:String(port)},detached:true,windowsHide:true,stdio:['ignore',fd,fd]});}finally{fs.closeSync(fd);}
    let ended=false,spawnError=null;child.once('error',e=>{spawnError=e;ended=true;});child.once('exit',()=>{ended=true;});
    for(let attempt=0;attempt<60;attempt++){
      if(await probe(port)){if(child.pid){fs.writeFileSync(path.join(runtimeDir,'server.pid'),String(child.pid));child.unref();}fs.writeFileSync(path.join(runtimeDir,'launcher-state.json'),JSON.stringify({port}));return finish(port,false);}
      if(ended)break;
      await pause(150);
    }
    if(spawnError)throw spawnError;
    if(!ended){child.kill();log('Sunucu zamaninda hazir olmadi. runtime\\sunucu.log dosyasini kontrol edin.');throw Error('Sunucu baslatilamadi. Ayrintilar: '+path.join(runtimeDir,'sunucu.log'));}
    log(port+' portunda sunucu kapandi. Ayrintilar: runtime\\sunucu.log');
  }
  throw Error('Uygulama acilamadi. Ayrintilar: '+logPath);
}
module.exports={launch,probe,isFree};
if(require.main===module)launch().catch(e=>{console.error('\n'+e.message+'\n');process.exitCode=1;});
