# Araştırma notları — 16 Ekim 2026

Teknoloji: sürümleri kilitlenmiş Leaflet, Proj4js, GeographicLib, fflate, PDF.js ve Tesseract.js kullanan sade JavaScript/PWA. Harita ve hesaplama kütüphaneleri yerel vendor dosyalarıdır. Sunucu veritabanı veya ücretli API anahtarı gerekmez. Plan localStorage'da, çevrimdışı XYZ karoları IndexedDB'de tutulur. Windows paketi Node.js çalışma ortamını içerir.

İncelenen birincil kaynaklar:

- [FAI/CIA resmî belge dizini](https://www.fai.org/cia-documents): dizin 1 Temmuz 2026 tarihli AX-MER 2026 v2 sürümünü listeliyor. Bu sürümün bütün değişiklikleri bağımsız olarak doğrulanamadı; uygulama resmî kural/puanlama motoru olarak sunulmuyor.
- [CIA AX Model Event Rules 2026, WatchMeFly üzerindeki FAI belge kopyası](https://watchmefly.net/assets/uploads/enb/bbt2026_axmer2026.pdf): 7.7–7.9 ve Chapter 15 incelendi. Kısa koordinatların easting/northing sırası, yarışma grid referansı ve görev türlerinin ad/kod ilişkisi veri modeline yön verdi. 3DT ve APT şablonları ayrı tutuldu.
- [WatchMeFly gerçek TDS örneği](https://www.watchmefly.net/events/tds_print.php?e=topgun2526&fid=1627BD83-3A32-6C14-D0A7-C3BA2E81B7D6): görev başlıkları, tekrar eden hedef koordinatları, marker/logger, puanlama zamanı ve iptal bilgisi incelendi. Ayrıştırıcı testleri bu düzeni sentetikleştirerek kullanır; iptal edilmiş hedefler etkin hedefe dönüştürülmez.
- [WatchMeFly / Balloon Live iş akışı](https://www.watchmefly.net/blog/20210913-wmf-scoring.php): resmî logger, deklarasyon ve sonuç sistemlerinin varlığı değerlendirildi. Bu uygulama onlara veri göndermez ve resmî logger yerine geçmez.
- [Hot Air Balloon Pilot — geliştirici ürün açıklaması](https://play.google.com/store/apps/details?id=eu.paamand.hotairpro): hedefler, geometriler, iz kaydı ve irtifaya göre rüzgârın aynı haritada kullanılması değerlendirildi.
- [FlyOn Balloon Pilot — geliştirici ürün açıklaması](https://play.google.com/store/apps/details?id=eu.paamand.flyon): 4/4 ve tam UTM ile açık harita biçimleri değerlendirildi. Arayüz kopyalanmadı.
- [ForeFlight GPS rehberi](https://www.foreflight.com/support/gps/), [çevrimdışı hazırlık rehberi](https://www.foreflight.com/blog/managing-your-downloads-and-pack): konum kaynağı ve önceden harita hazırlığına ayrı görünür durumlar ayrıldı.
- [Leaflet API](https://leafletjs.com/reference), [Proj4js kaynak ve belgeleri](https://github.com/proj4js/proj4js), [GeographicLib JavaScript kaynakları](https://github.com/geographiclib/geographiclib-js): hesaplama ve harita API'leri.
- [OSM karo kullanım politikası](https://operations.osmfoundation.org/policies/tiles/): çevrimdışı toplu indirme yerine kullanıcıya ait XYZ paketinin yerel yüklenmesi seçildi. Sağlayıcı atıfları haritada korunur.
- [Tesseract hızlı dil verileri](https://github.com/tesseract-ocr/tessdata_fast): Türkçe ve İngilizce OCR verileri; lisansları pakette.

Bu araştırma bir ürün karşılaştırma sertifikasyonu değildir. Gerçek yarışmanın resmî grid tanımı, Section II, TDS ve son brifing verileri kullanıcı tarafından girilmelidir. Resmî yarışma haritası, gerçek uçuş GNSS kaydı ve gerçek brifing fotoğrafı sağlanmadığı için saha doğrulaması tamamlanmış sayılmaz.
