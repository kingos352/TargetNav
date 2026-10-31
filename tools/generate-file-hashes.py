"""FILE_HASHES.json uretir ve dogrular.

Proje, dagitilan her dosyanin SHA-256 ozetini FILE_HASHES.json icinde tutar; APK
varliklarinin Android kaynaklariyla byte duzeyinde esleStigi iddiasi buna dayanir.
Simdiye kadar bu dosyayi ureten bir arac yoktu, yani manifesto elle bakimdaydi ve
her degisiklikte sessizce bayatlayabiliyordu.

Dosya listesi `git ls-files` ile alinir. Boylece .gitignore otomatik uygulanir:
node_modules, android/app/build, local.properties ve derleme onbellekleri manifestoya
sizmaz; listeleme calisma agacindaki geziye degil surum kontrolune baglidir.

Kullanim:
    python tools/generate-file-hashes.py            # FILE_HASHES.json yaz
    python tools/generate-file-hashes.py --check    # yazma, sadece dogrula (CI icin)

--check modu farklari satir satir bildirir ve fark varsa 1 ile cikar.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'FILE_HASHES.json'
# Manifesto kendi ozetini iceremez; yazildigi anda deger degisirdi.
SELF = 'FILE_HASHES.json'


def tracked_files():
    out = subprocess.run(
        ['git', 'ls-files', '-z'],
        cwd=ROOT, check=True, capture_output=True,
    ).stdout
    names = [n.decode('utf-8') for n in out.split(b'\0') if n]
    return sorted(n for n in names if n != SELF)


def digest(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        # Yarisma haritalari ve APK onlarca MB; parca parca okunur.
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def build():
    hashes = {}
    missing = []
    for name in tracked_files():
        p = ROOT / name
        if not p.is_file():
            missing.append(name)
            continue
        hashes[name] = digest(p)
    return hashes, missing


def main():
    check = '--check' in sys.argv[1:]
    hashes, missing = build()

    if missing:
        for name in missing:
            print('EKSIK  ' + name)
        print('%d takipli dosya diskte yok.' % len(missing))
        return 1

    if check:
        if not MANIFEST.is_file():
            print('FILE_HASHES.json yok.')
            return 1
        stored = json.loads(MANIFEST.read_text(encoding='utf-8'))
        problems = 0
        for name, want in sorted(stored.items()):
            if name not in hashes:
                print('FAZLA  ' + name + ' (manifestoda var, takipli degil)')
                problems += 1
            elif hashes[name] != want:
                print('FARKLI ' + name)
                problems += 1
        for name in hashes:
            if name not in stored:
                print('YENI   ' + name + ' (takipli, manifestoda yok)')
                problems += 1
        if problems:
            print('%d sorun. Duzeltmek icin: python tools/generate-file-hashes.py' % problems)
            return 1
        print('%d dosyanin tamami manifestoyla esleSiyor.' % len(hashes))
        return 0

    text = json.dumps(hashes, indent=2, ensure_ascii=False, sort_keys=True) + '\n'
    MANIFEST.write_text(text, encoding='utf-8', newline='\n')
    print('FILE_HASHES.json yazildi: %d dosya.' % len(hashes))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
