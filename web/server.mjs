import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm'};
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;const data=await fs.readFile(p);res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache','Service-Worker-Allowed':'/'});res.end(data);}catch{res.writeHead(404).end('Not found');}});
const port=Number(process.env.AEROSTAT_PORT||4173);server.on('error',error=>{console.error('Aerostat sunucu hatasi:',error.code,error.message);process.exitCode=1;});server.listen(port,process.env.AEROSTAT_HOST||'127.0.0.1',()=>console.log('Local: http://localhost:'+port));
