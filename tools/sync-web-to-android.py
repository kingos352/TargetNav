#!/usr/bin/env python3
"""web/dist -> android/app/src/main/assets/www aktarımı ve Android'e özel yamalar.

Kaynak doğruluk merkezi web/dist'tir; bu betik yalnızca Android ağacını değiştirir.

İki güvence sağlar:
  1. Her Android yaması uygulandıktan sonra DOĞRULANIR. Bir çengel (anchor)
     metni web/dist içinde değiştiyse yama sessizce atlanmaz; betik hata
     mesajıyla ve sıfırdan farklı çıkış koduyla durur.
  2. web/dist'ten silinen dosyalar Android ağacından da silinir. Yalnızca
     Android'e ait olduğu bilinen dosyalar korunur (bkz. KEEP_FILES/KEEP_DIRS).
"""
from pathlib import Path
import shutil
import sys

try:  # Türkçe mesajlar Windows konsolunda da bozulmasın
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except (AttributeError, OSError):  # pragma: no cover
    pass

root = Path(__file__).resolve().parent.parent
source = root / 'web/dist'
target = root / 'android/app/src/main/assets/www'

# --- Yalnızca Android ağacında bulunan, ASLA silinmemesi gereken yollar ------
# Bu liste iki ağaç karşılaştırılarak belirlenmiştir: web/dist'te olmayıp
# Android ağacında bulunan tek içerik native-android.js köprüsü ile licenses/
# dizinidir. Buraya eklenmeyen her "fazla" dosya web/dist'ten silinmiş kabul
# edilip temizlenir (silinenler ekrana yazılır, böylece denetlenebilir).
KEEP_FILES = {
    'native-android.js',  # Android GPS/dosya köprüsü; web sürümünde yok.
}
KEEP_DIRS = {
    'licenses',  # Yalnızca APK ile dağıtılan üçüncü taraf lisans metinleri.
}

# --- Android'e özel yamalar ---------------------------------------------------
# Her kayıt: (dosya, açıklama, çengel, yeni metin, kanıt)
# "kanıt" yamanın hedeflediği son durumdur. Kanıt dosyada zaten varsa yama
# gereksizdir (idempotent koruma) ve atlanır; yoksa çengel mutlaka bulunmalıdır.
PATCHES = [
    (
        'index.html',
        'Content-Security-Policy meta etiketi',
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" '
        'content="frame-src \'none\'; object-src \'none\'; base-uri \'self\'">',
        'Content-Security-Policy',
    ),
    (
        'index.html',
        'native-android.js betik etiketi',
        '<script type="module" src="app.mjs">',
        '<script src="native-android.js"></script><script type="module" src="app.mjs">',
        '<script src="native-android.js"></script>',
    ),
    (
        'app.mjs',
        'dosya indirme işlemini yerel köprüye yönlendirme',
        "function download(name,data,type='application/json'){",
        "function download(name,data,type='application/json'){"
        "if(window.TargetNavNative){window.TargetNavNative.save(name,data,type);return;}",
        'window.TargetNavNative.save',
    ),
    (
        'app.mjs',
        'WebView içinde service worker kaydını engelleme',
        "if('serviceWorker'in navigator)",
        "if(!window.TargetNavAndroid&&'serviceWorker'in navigator)",
        "if(!window.TargetNavAndroid&&'serviceWorker'in navigator)",
    ),
    (
        'app.mjs',
        'OCR/PDF okuyucuya webview bayrağı geçirme',
        'extractPDFText(bytes,{ocr,',
        'extractPDFText(bytes,{webview:!!window.TargetNavAndroid,ocr,',
        'extractPDFText(bytes,{webview:!!window.TargetNavAndroid,ocr,',
    ),
    (
        'app.mjs',
        'çevrimdışı kabuk durumu mesajı',
        "async function updateShellStatus(){const el=$('#shellStatus');if(!el)return;",
        "async function updateShellStatus(){const el=$('#shellStatus');if(!el)return;"
        "if(window.TargetNavAndroid){el.textContent='TargetNav uygulama dosyaları "
        "cihazda hazır. Çevrimiçi haritalar internet gerektirir.';return;}",
        "if(window.TargetNavAndroid){el.textContent='TargetNav uygulama dosyaları",
    ),
]


def die(*lines):
    """Hata mesajlarını yazıp sıfırdan farklı çıkış koduyla durur."""
    print('', file=sys.stderr)
    print('HATA: Android aktarımı başarısız oldu.', file=sys.stderr)
    for line in lines:
        print('  - ' + line, file=sys.stderr)
    print('', file=sys.stderr)
    print('Yama çengelleri web/dist içinde değişmiş olabilir. Yukarıda adı geçen '
          'yamayı ve dosyayı kontrol edip tools/sync-web-to-android.py içindeki '
          'çengel metnini güncelleyin.', file=sys.stderr)
    sys.exit(1)


def rel_files(base):
    """base altındaki tüm dosyaların '/' ayraçlı göreli yollarını döndürür."""
    return {p.relative_to(base).as_posix() for p in base.rglob('*') if p.is_file()}


def is_kept(rel):
    if rel in KEEP_FILES:
        return True
    return any(rel == d or rel.startswith(d + '/') for d in KEEP_DIRS)


# --- Ön koşullar -------------------------------------------------------------
if not source.is_dir():
    die('Kaynak dizin bulunamadı: {}'.format(source))
if not target.is_dir():
    die('Hedef dizin bulunamadı: {}'.format(target))
if not (target / 'native-android.js').is_file():
    die('Android native-android.js köprüsü eksik; aktarım durduruldu.')

# --- 1) Kopyalama ------------------------------------------------------------
shutil.copytree(source, target, dirs_exist_ok=True)
source_rel = rel_files(source)
copied = len(source_rel)

# --- 2) web/dist'ten silinmiş dosyaları Android ağacından temizleme ----------
target_rel = rel_files(target)
extra = sorted(target_rel - source_rel)
kept = [r for r in extra if is_kept(r)]
stale = [r for r in extra if not is_kept(r)]

for rel in stale:
    (target / rel).unlink()

# Temizlik sonrası boş kalan dizinleri kaldır (korunan dizinlere dokunmadan).
removed_dirs = []
for d in sorted((p for p in target.rglob('*') if p.is_dir()),
                key=lambda p: len(p.parts), reverse=True):
    rel = d.relative_to(target).as_posix()
    if is_kept(rel) or (source / rel).is_dir():
        continue  # Android'e ait ya da web/dist'te de var olan dizin.
    if not any(d.iterdir()):
        d.rmdir()
        removed_dirs.append(rel)

# --- 3) Android'e özel yamalar + doğrulama -----------------------------------
files = []
for name, _, _, _, _ in PATCHES:
    if name not in files:
        files.append(name)

errors = []
results = []
contents = {}

for name in files:
    path = target / name
    if not path.is_file():
        errors.append('{} bulunamadı; yamalar uygulanamadı.'.format(name))
        continue
    s = path.read_text(encoding='utf-8')
    for pname, label, anchor, new, proof in PATCHES:
        if pname != name:
            continue
        if proof in s:
            results.append((name, label, 'zaten mevcut'))
            continue
        hits = s.count(anchor)
        if hits == 0:
            errors.append(
                '[{}] "{}" yaması uygulanamadı: çengel metni bulunamadı.\n'
                '      Beklenen çengel: {!r}'.format(name, label, anchor))
            continue
        if hits > 1:
            errors.append(
                '[{}] "{}" yaması belirsiz: çengel metni {} kez bulundu, '
                '1 bekleniyordu.\n      Beklenen çengel: {!r}'
                .format(name, label, hits, anchor))
            continue
        s = s.replace(anchor, new, 1)
        if proof not in s:
            errors.append(
                '[{}] "{}" yaması uygulandı ama kanıt metni oluşmadı.\n'
                '      Beklenen kanıt: {!r}'.format(name, label, proof))
            continue
        results.append((name, label, 'uygulandı'))
    contents[name] = s

if errors:
    die(*errors)

# Hiçbir dosya, tüm yamalar doğrulanmadan diske yazılmaz.
for name, s in contents.items():
    (target / name).write_text(s, encoding='utf-8', newline='\n')

# --- 4) Son kapı: yamalar çıktı dosyalarında gerçekten var mı? ---------------
final_errors = []
for name in files:
    s = (target / name).read_text(encoding='utf-8')
    for pname, label, _, _, proof in PATCHES:
        if pname == name and proof not in s:
            final_errors.append(
                '[{}] "{}" yaması yazma sonrası dosyada bulunamadı.\n'
                '      Beklenen kanıt: {!r}'.format(name, label, proof))
if final_errors:
    die(*final_errors)

# --- 5) Özet -----------------------------------------------------------------
print('Web dosyaları Android projesine aktarıldı.')
print('  Kaynak : {}'.format(source))
print('  Hedef  : {}'.format(target))
print('  Kopyalanan dosya sayısı: {}'.format(copied))

print('  Korunan Android dosyaları ({}):'.format(len(kept)))
for rel in kept:
    print('    = {}'.format(rel))

if stale:
    print('  Silinen eski dosyalar ({}):'.format(len(stale)))
    for rel in stale:
        print('    - {}'.format(rel))
else:
    print('  Silinen eski dosya yok.')

if removed_dirs:
    print('  Silinen boş dizinler ({}):'.format(len(removed_dirs)))
    for rel in removed_dirs:
        print('    - {}'.format(rel))

print('  Doğrulanan yamalar ({}):'.format(len(results)))
for name, label, status in results:
    print('    + {} -> {} ({})'.format(name, label, status))

print('Tüm yamalar doğrulandı. Şimdi APK’yı yeniden derleyin.')
