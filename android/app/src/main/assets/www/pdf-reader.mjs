// PDF.js legacy build includes the compatibility shims needed by older WebViews.
export async function readFileBytes(file){
 if(typeof file.arrayBuffer==='function')return file.arrayBuffer();
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Dosya okunamadı. Lütfen dosyayı İndirilenler klasörüne kaydedip yeniden seçin.'));r.readAsArrayBuffer(file);});
}
export function documentKind(file,bytes){
 const head=String.fromCharCode(...new Uint8Array(bytes).subarray(0,1024));
 if(head.includes('%PDF-')||file.type==='application/pdf'||/\.pdf$/i.test(file.name||''))return 'pdf';
 if(file.type==='text/plain'||/\.txt$/i.test(file.name||''))return 'text';
 return 'image';
}
export async function extractPDFText(bytes,{onProgress=()=>{},ocr,webview=false}={}){
 onProgress('PDF motoru hazırlanıyor…');
 const pdfjs=await import('./vendor/pdf.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdf.worker.mjs',import.meta.url).href;
 // WebView's native asset interception is not guaranteed to service module-worker requests.
 // PDF.js officially supports its in-process worker handler; use it for bundled Android assets.
 if(webview)globalThis.pdfjsWorker=await import('./vendor/pdf.worker.mjs');
 const task=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useWasm:false,cMapUrl:new URL('./vendor/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./vendor/standard_fonts/',import.meta.url).href});
 let timer;const timedOut=new Promise((_,reject)=>{timer=setTimeout(()=>{task.destroy().catch(()=>{});reject(Error('PDF okuma zaman aşımı. Daha küçük veya şifresiz bir PDF ile deneyin.'));},90000);});
 const work=(async()=>{let doc;try{
  doc=await task.promise;if(doc.numPages>20)throw Error('TDS PDF en fazla 20 sayfa olabilir.');
  const pages=[];
  for(let i=1;i<=doc.numPages;i++){
   onProgress('PDF okunuyor: '+i+' / '+doc.numPages+' sayfa');
   const page=await doc.getPage(i),items=(await page.getTextContent()).items;
   let text='',lastY=null;
   for(const item of items){if(typeof item.str!=='string')continue;const y=Math.round(item.transform?.[5]||0);if(lastY!==null&&Math.abs(y-lastY)>3)text+='\n';text+=item.str+(item.hasEOL?'\n':' ');lastY=y;}
   if(text.replace(/\s/g,'').length<30){
    if(typeof ocr!=='function')throw Error('Bu PDF taranmış bir görüntü içeriyor; OCR gerekiyor.');
    onProgress('Taranmış PDF: '+i+' / '+doc.numPages+' sayfa için OCR');
    const initial=page.getViewport({scale:1}),scale=Math.min(2.5,2200/Math.max(initial.width,initial.height));
    const viewport=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    try{await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;text=await ocr(canvas);}finally{canvas.width=canvas.height=0;}
   }
   pages.push(text);page.cleanup();
  }
  return pages.join('\n');
 }catch(e){if(e?.name==='PasswordException')throw Error('PDF şifreli. Önce şifresiz bir kopyasını kaydedip yükleyin.');throw e;}finally{if(doc)await doc.destroy();else await task.destroy();}})();
 try{return await Promise.race([work,timedOut]);}finally{clearTimeout(timer);}
}
