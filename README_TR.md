# TargetNav — Tam proje 1.1.1

Web ve Android arayüz kaynakları 1.1.1 sürümünde birleştirildi. Web yayın sürümü: 19.
Web: https://aerostat-competition-assistant.mlhykskky.chatgpt.site

## İçerik

- web/: Yayımlanan web sürümünün tüm takip edilen kaynakları, dist, görseller, paketli kütüphaneler ve testler.
- android/: Android Studio projesi; Java GPS/WebView/dosya köprüsü, konum servisi, kaynaklar ve paketlenmiş web dosyaları.
- apk/TargetNav-1.1.1-test.apk: İmzalı test APK’sı, versionCode 13.
- competition-originals/: Kaynak paketteki altı özgün Kapadokya yarışma dosyası.
- tools/sync-web-to-android.py: Web değişikliklerini Android’e, yerel köprüleri koruyarak aktarır.
- VERSION.json: Sürüm ve doğrulama bilgileri. FILE_HASHES.json: Dosya SHA-256 listesi.

## Android Studio

ZIP’i tamamen çıkarın. Android Studio > Open > android klasörünü seçin.
JDK 17, Android SDK Platform 35; Gradle 8.9 ve Android Gradle Plugin 8.7.3 kullanılır.
İlk eşitleme için internet gerekir. Build > Build APK(s) ile debug APK oluşturun.
Alternatif: android klasöründe Windows’ta gradlew.bat assembleDebug; Linux/macOS’ta ./gradlew assembleDebug.
Çıktı android/app/build/outputs/apk/debug/app-debug.apk konumundadır.

Projede önceki APK’larla aynı TEST imza anahtarı bulunur: android/targetnav-test.jks,
alias targetnav-test, anahtar ve depo parolası android. Bu anahtar üretim/Play Store anahtarı değildir.
Aynı imzalı mevcut TargetNav üzerine güncellenebilir; önce JSON plan yedeği alın.

## Web’i yerelde çalıştırma

Node.js 20 veya üstü kullanın. web klasöründe npm ci, ardından npm start.
Tarayıcıdan http://localhost:4173 adresini açın (sunucunun terminalde yazdığı adresi esas alın).
Windows’ta web/Baslat.cmd veya aynı Wi-Fi tablet erişimi için web/Tablet.cmd kullanılabilir.
Yerel ağdaki HTTP erişiminde GPS ve çevrimdışı kurulum kullanılamaz; güvenli HTTPS gerekir.
Test: web klasöründe npm test. Yerel Android köprü testi: node --test android/tests/native-bridge.test.cjs.

## Kod değişiklikleri

Web arayüzü web/dist içindedir. Ana klasörde python tools/sync-web-to-android.py çalıştırın,
ardından Android Studio’dan yeniden derleyin. Java/izin değişiklikleri android/app/src/main içinde yapılır.
web/.openai/hosting.json mevcut yayının kimliğidir; yeni bir siteye taşırken yayın kimliğini ayrıca ayarlayın.
Git erişim kimlik bilgileri, node_modules, Android SDK ve derleme önbellekleri pakette yoktur.

## 1.1.1 değişiklikleri

Uçuş kaydı durdurulduğunda cihaza kaydetme, KML rota aktarımı ve JSON yedek indirme penceresi açılır.
Uçuş KML aktarımı ayrıca Dosyalar bölümündedir. GPS kesintileri ayrı çizilir; ham zaman ve GPS irtifaları
ExtendedData içinde korunur. MSL doğrulanmadığından görüntü zemine oturtulur.
Sol üstteki logo sayfayı yeniden yüklemeden genel uçuş görünümünü açar.
Önceki kaynak paketteki rüzgâr çizgileri, otomatik plan yedekleri ve PZ ses/titreşim özellikleri korunmuştur.
Web ve APK dosyaları ortak arayüz sürümünü kullanır; Android köprü farkları korunur.

## Doğrulama ve sınırlar

81 web testi, 4 yerel GPS köprü testi geçti. APK web varlıkları Android kaynaklarıyla byte düzeyinde eşleşir.
Web önizlemesinde logo geçişi, plan paneline dönüş ve uçuş KML düğmesi kontrol edildi.
Fiziksel tablet ve uçuş testi yapılmadı. Arka plan servisi mevcut olsa da konum/kayıt Activity/WebView’e
bağlıdır; ekran kilidi veya süreç sonlanmasında kesintisiz kayıt garantisi verilmez.
PZ uyarıları yatay yakınlık içindir; zaman ve MSL/AGL ihlali doğrulaması değildir.
Rüzgâr çizgileri sabit rüzgâr varsayımına dayanır. Kapadokya mavi sınırı yaklaşık sayısallaştırılmıştır.
OZF4 doğrudan desteklenmez; NTAMAP veya kalibre MAP+JPG kullanın.
Cihaza kaydedilen kişisel hedefler/rotalar bu ZIP’e dahil değildir. Uygulama içinden JSON yedeğini ayrıca alın.
