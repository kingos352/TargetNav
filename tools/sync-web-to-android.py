from pathlib import Path
import shutil
root=Path(__file__).resolve().parent.parent
source=root/'web/dist'
target=root/'android/app/src/main/assets/www'
if not (target/'native-android.js').is_file():
    raise SystemExit('Android native-android.js köprüsü eksik; aktarım durduruldu.')
shutil.copytree(source,target,dirs_exist_ok=True)
p=target/'index.html'
s=p.read_text(encoding='utf-8')
if 'Content-Security-Policy' not in s:
    s=s.replace('<meta charset="UTF-8">','<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="frame-src \'none\'; object-src \'none\'; base-uri \'self\'">')
if '<script src="native-android.js"></script>' not in s:
    s=s.replace('<script type="module" src="app.mjs">','<script src="native-android.js"></script><script type="module" src="app.mjs">')
p.write_text(s,encoding='utf-8',newline=chr(10))
p=target/'app.mjs';s=p.read_text(encoding='utf-8')
s=s.replace("function download(name,data,type='application/json'){", "function download(name,data,type='application/json'){if(window.TargetNavNative){window.TargetNavNative.save(name,data,type);return;}")
s=s.replace("if('serviceWorker'in navigator)","if(!window.TargetNavAndroid&&'serviceWorker'in navigator)")
s=s.replace('extractPDFText(bytes,{ocr,','extractPDFText(bytes,{webview:!!window.TargetNavAndroid,ocr,')
s=s.replace("async function updateShellStatus(){const el=$('#shellStatus');if(!el)return;", "async function updateShellStatus(){const el=$('#shellStatus');if(!el)return;if(window.TargetNavAndroid){el.textContent='TargetNav uygulama dosyaları cihazda hazır. Çevrimiçi haritalar internet gerektirir.';return;}")
p.write_text(s,encoding='utf-8',newline=chr(10))
print('Web dosyaları Android projesine aktarıldı. Şimdi APK’yı yeniden derleyin.')
