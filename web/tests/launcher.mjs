import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{launch,probe,isFree}=require('../launcher.cjs');
const base=path.resolve('../launcher-check/Aerostat boşluk ve Türkçe');await fs.mkdir(path.join(base,'dist'),{recursive:true});await fs.copyFile('server.mjs',path.join(base,'server.mjs'));await fs.copyFile('dist/index.html',path.join(base,'dist/index.html'));await fs.copyFile('dist/health.json',path.join(base,'dist/health.json'));
const results=[];let busy,pids=[];
async function stop(){for(const pid of pids){try{process.kill(pid);}catch{}}pids=[];}
try{
let port=52417;while(!await isFree(port)||!await isFree(port+1))port+=2;
let r=await launch({root:base,firstPort:port,openBrowser:false,quiet:true});pids.push(Number(await fs.readFile(path.join(base,'runtime/server.pid'),'utf8')));assert.equal(r.reused,false);assert.equal(r.port,port);assert.equal((await probe(port)).app,'Aerostat');results.push({name:'Yeni sunucu boşluk/Türkçe içeren klasörden açılır',status:'PASS'});
r=await launch({root:base,firstPort:port,openBrowser:false,quiet:true});assert.equal(r.reused,true);assert.equal(r.port,port);assert.equal(Number(await fs.readFile(path.join(base,'runtime/server.pid'),'utf8')),pids[0]);results.push({name:'İkinci başlatma mevcut sunucuyu kullanır',status:'PASS'});
await stop();await new Promise(r=>setTimeout(r,300));
busy=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/plain'});res.end('Another application');});await new Promise((resolve,reject)=>{busy.once('error',reject);busy.listen(port,'127.0.0.1',resolve);});
r=await launch({root:base,firstPort:port,openBrowser:false,quiet:true});pids.push(Number(await fs.readFile(path.join(base,'runtime/server.pid'),'utf8')));assert.equal(r.reused,false);assert.equal(r.port,port+1);results.push({name:'Port başka uygulamadaysa boş porta geçer ve hazır olmasını bekler',status:'PASS'});
const again=await launch({root:base,firstPort:port,openBrowser:false,quiet:true});assert.equal(again.port,port+1);assert.equal(again.reused,true);results.push({name:'Alternatif port sonraki açılışta korunur',status:'PASS'});
const response=await fetch('http://127.0.0.1:'+r.port+'/');assert.match(await response.text(),/AEROSTAT/);results.push({name:'Doğru uygulama yanıtı doğrulanır',status:'PASS'});
}catch(e){results.push({name:'Başlatıcı doğrulama',status:'FAIL',detail:e.message});throw e;}finally{await stop();if(busy)await new Promise(r=>busy.close(r));await fs.writeFile('../../outputs/baslatici-test-sonuclari.json',JSON.stringify({date:new Date().toISOString(),results},null,2));results.forEach(r=>console.log(r.status+' '+r.name));}
