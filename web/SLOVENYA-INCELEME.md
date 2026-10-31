# Slovenya TDS incelemesi ve Aerostat 0.2 güncellemesi

17 Ekim 2026

## Kaynak ve bulgular

Kullanıcının sağladığı tds1_1782353344.pdf iki sayfalık taranmış bir TDS'dir: Open Slovenian and Hungarian Hot Air Balloon Championship 2026, Murska Sobota, Flight 1, 25 Haziran 2026. Her iki sayfa görsel olarak incelendi. Belge içindeki operasyon talimatları kullanıcıya verilmiş yeni talimat olarak çalıştırılmadı; sadece yarışma verisi olarak değerlendirildi.

TDS'de beş görev (PDG, JDG, CRT, HWZ, LRN), beş sabit hedef ve feet irtifaları var. PDG ve LRN için TDS'de verilmeyen hedef noktaları uydurulmadı. Marker/logger ve özel şartlar belgeden kontrol edildi. Kalkış bireyseldir; genel kurallardaki ortak kalkış noktası bu uçuşun gerçek kalkışı gibi eklenmedi.

## Koordinat doğrulaması

[Resmî yarışma kuralları](https://watchmefly.net/assets/uploads/enb/slovenia2026_rules%202026sihu.pdf), II.1'de harita kapsamını 33T, NW 564000/5180000 ve SE 610000/5150000 olarak tanımlar. II.23 WGS84/UTM ve 4/4 biçimini tarif eder. Aynı bölümdeki 34U satırı biçim örneğidir; bu yarışmanın zonu olarak kullanılmadı. 4/4 çözümü için 10 m birim ve harita kapsamının tek anlamlı 100 km blokları kullanıldı.

[24 Haziran genel brifingi](https://watchmefly.net/assets/uploads/enb/slovenia2026_gb%20information1.pdf) ayrıca incelendi. Brifingde PZ değişiklikleri bulunduğu için eski kurallardaki PZ listesi eksiksiz/güncel hava sahası katmanı gibi otomatik eklenmedi. Harita dış çerçevesi de puanlama alanı sınırı diye sunulmadı.

Aşağıdaki değerler bağımsız pyproj/PROJ EPSG:32633 → EPSG:4326 dönüşümüyle hesaplandı ve uygulamanın Proj4js sonuçlarıyla karşılaştırıldı:

| TDS | Tam UTM (m) | WGS84 enlem, boylam |
|---|---|---|
| 9116/6847 | 591160 / 5168470 | 46.6635835, 16.1916162 |
| 9012/6484 | 590120 / 5164840 | 46.6310636, 16.1773157 |
| 9029/6191 | 590290 / 5161910 | 46.6046782, 16.1789637 |
| 9113/6179 | 591130 / 5161790 | 46.6034850, 16.1899060 |
| 8779/6267 | 587790 / 5162670 | 46.6118481, 16.1464709 |

Bütün hedefler sayısal olarak aynı sonucu verdi (karşılaştırma toleransı 1e-9 derece). Bu sayısal tutarlılık, 10 m çözünürlüklü TDS koordinatının veya gerçek GPS ölçümünün milimetre doğrulukta olduğu anlamına gelmez. Fiziksel hedef koordinatları sahada ölçülmedi.

## Eklenen ve sadeleştirilenler

- Tanınan Slovenya 2026 TDS'si için hazır resmî koordinat profili. Kullanıcı teknik grid alanı doldurmaz. Genel/GPS kullanımı diğer yarışmalara bağlı değildir; farklı yarışmanın kısa koordinatı için o yarışmanın doğrulanmış referansı gerekir.
- Koordinatlar slash/tire/boşluk/yeni satır ve bitişik 8 hane ile girilebilir. Tam UTM'de baştaki sıfır ve 33T bandı desteklenir.
- 9116/6847 · 610 ft gibi TDS satırı doğrudan girilebilir. 610 ft = 185.928 m dönüşümü yapılır; gösterimde kaynak feet değeri korunur. Negatif irtifa işareti korunur.
- Gerçek TDS düzenindeki sayısal görev başlıkları ve tam görev adları tanınır. Açıklamalardaki 'minimum distance' sözü yanlış MDT görevi oluşturmaz.
- Kaynakla kontrol edilmiş bu örnek PDF'nin SHA-256 kimliği yerel örnek verisiyle eşleştirilir; içerik kontrol edilmeden otomatik plana eklenmez. Genel OCR yolu da aynı PDF'nin farklı dosya kimliğiyle ayrıca test edildi.
- Görev kartlarında logger, bitiş saati, marker/bırakma yöntemi ve hedefler görünür. Uzun koşullar açılır bölümde korunur. QNH ve uçuş başlığı belge verisidir; canlı ölçüm değildir. Zamanlar Europe/Ljubljana bağlamında gösterilir; cihazın İstanbul saatine sessizce çevrilmez.
- Harita etiketleri TDS'yle eşleşir: 2, 3, 4A, 4B, 4C.
- Kullanıcı doğrularsa fiziksel MMA çemberleri (30/50/30 m) eklenir. Genel OCR'de bu seçenek varsayılan kapalıdır; yanlış okunan yarıçap otomatik çizilmez. Fiziksel MMA, bütün logger puanlama alanı olarak sunulmaz.
- Hedef, kalkış, çizgi, çember, ölçüm ve poligon silinebilir. Harita seçimi → Sil veya listedeki çöp kutusu kullanılır. Delete siler; Ctrl+Z/başlıktaki Geri al son silmeyi geri getirir. Son 20 silme oturum boyunca geri alınabilir; uygulama kapanınca geri alma geçmişi korunmaz.
- Hedef silinince bağlı geometriler ve görev bağlantıları temizlenir. Geri alma bunları geri yükler; arada eklenen başka noktaları silmez. GPS uçuş rotası genel öğe silme düğmesiyle silinmez.
- Tekrarlanan aynı TDS dosyasının yanlışlıkla ikinci kez aktarımı engellenir. Gereksiz görev kartı düğmesi ve tekrarlanan açıklamalar kaldırıldı.

## Doğrulama

Bu sürümde çalıştırılan kontroller: 21 hesaplama/koordinat testi; 16 temel tarayıcı kontrolü; 11 serbest çizim kontrolü; 5 yedek/açı/katman kontrolü; 2 PDF/çevrimdışı OCR kontrolü; 11 gerçek Slovenya TDS + silme/geri alma kontrolü; 1 gerçek PDF'yi örnek önbelleği olmadan OCR'den okuma kontrolü. Toplam 67 geçen kontrol.

Ortam: Windows x64, Microsoft Edge/Playwright. Telefon kontrolü 390×844 tarayıcı görünümünde yapıldı. Gerçek telefon/arka plan GPS/uçuş doğrulaması yapılmadı. Eski başlatıcının beş kontrolü bu toplamın içinde değildir.

Ham sonuçlar aynı outputs klasöründeki JSON/TXT dosyalarındadır. Gerçek PDF testi için kaynak paketteki tests/slovenia-browser.mjs ve tests/slovenia-ocr.mjs kullanılır; AEROSTAT_TDS_PDF ortam değişkeniyle belgenin yolu verilebilir. Ayrı test tarayıcıları kullanıcı planını değiştirmez.

## Kullanım

Güncellenmiş uygulamada TDS → Gönderdiğiniz Slovenya örneğini incele veya Belge seç yolunu kullanın. Görevleri kontrol edip aktarın. Ardından kısa koordinatları doğrudan yazın. Haritada bir öğeyi seçerek Sil'e basın; yanlışlıkla silerseniz Geri al'ı kullanın. Önceki planınız başka bir resmî haritaya bağlıysa onu yedekleyip yeni boş plan açın.
