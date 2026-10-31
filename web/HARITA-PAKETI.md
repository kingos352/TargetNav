# Yarışma haritası hazırlayıcı için koordinat referansı

Pilotun elle grid alanı doldurması gerekmez. Bu belge organizasyon veya harita paketini hazırlayan geliştirici içindir. Standart KML/KMZ noktaları otomatik olarak WGS84 okunur. Kısa FAI koordinatlarının tam konumu için resmî datum/projeksiyon ve blok tanımının ayrıca, açıkça sağlanması gerekir. Sadece KML kapsamına veya GPS konumuna bakarak resmî referans türetilmez.

Desteklenen iki taşıma biçimi:

1. KML Document/ExtendedData içinde Data name="aerostat:grid"; value içinde JSON nesnesi (CDATA kullanılabilir).
2. KMZ içinde KML dosyasına ek olarak aerostat.grid.json dosyası. Bu dosya doğrudan aynı nesneyi veya {"version":1,"grid": ...} sarmalayıcısını içerir.

Gerekli alanlar: zone (1–60), hemisphere (N/S), baseE ve baseN (100000 metre katı blok başlangıçları), unit (kısa koordinat basamağının metre değeri), crs (Proj4js'in desteklediği açık PROJ tanımı), source (resmî harita/sürüm/kaynak), verified (haritayı hazırlayanın resmî kaynaktan kontrol ettiğini belirtmek üzere true).

Değerleri örnek harita merkezinden doldurmayın. Datum dönüşüm parametreleri doğru ve mevcut olmalıdır; bu uygulama harici datum grid-shift dosyalarını yüklemez. Veri hazırlayıcısının verified bildirimi bağımsız bir sertifikasyon değildir.

Referans tüm geometri aktarımı doğrulandıktan sonra uygulanır. Çelişkili referanslar ve dolu plandaki farklı yarışma referansı reddedilir. Önceden çizilmiş geometriler kendi hesap yöntemini korur. Yeni harita referansı yüklendikten sonra yeni ölçümlerde yarışma grid yöntemi kullanılır. Normal KML/KMZ dosyası bu ek bilgiyi içermiyorsa referans varsayılmaz; geometri aktarımı çalışmaya devam eder.

Testler: tests/browser.mjs içindeki sentetik KML örneği. Gerçek organizasyon paketlerinin ayrıca doğrulanması gerekir.
