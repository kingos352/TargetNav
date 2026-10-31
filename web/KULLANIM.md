# PUSULA · Hızlı kullanım

Türkiye Sıcak Hava Balonu Şampiyonası 2026 · Kapadokya · 4–7 Kasım

## Başlangıç

Bilgisayarda Baslat.cmd dosyasını açın. Daha önce açık olan sayfada Ctrl+F5 ile yenileyin. Eski bir yarışma planı görünüyorsa Plan sekmesindeki “Türkiye 2026 planına geç” düğmesini kullanın. Önceki plan cihazda arşivlenir; Dosyalar → Türkiye öncesindeki planı aç ile geri dönebilirsiniz. Plan yedeğini ayrıca indirmeniz de mümkündür.

## Üç adım

1. **Görev föyü:** Brifingde verilen PDF veya fotoğrafı yükleyin. Hedef koordinatı, irtifa, marker rengi, logger, süre ve özel şartları kontrol edip işaretlediğiniz görevleri aktarın.
2. **Hedefi seç:** Haritadaki hedefe veya listedeki adına dokunun. Numara görevi, renk marker rengini gösterir. Görev kartı ve fiziksel MMA çemberi aynı rengi taşır. Sarı ve beyaz markerlarda koyu yazı kullanılır. Rengi Görevler → Düzenle bölümünde değiştirebilirsiniz. Henüz belirtilmemiş renk gri gösterilir.
3. **Çiz veya ölç:** Çizgi aracında başlangıca ve bitişe dokunun. Fareyle sürükleme de mümkündür. Mesafe, gidiş ve geliş açısı çizim sırasında görünür. Kesin uzunluk/yön için “Değer gir” kullanın. Çember için bir hedef seçip yarıçapı girin. Kalkış aracıyla haritada nokta seçin.

## Silme ve geri alma

Hedef, kalkış, çizgi veya çemberi seçin → **Sil**. Listedeki çöp kutuları da kullanılabilir. Üstteki geri ok silmeyi geri alır. Klavye: Delete / Ctrl+Z. Bağlı hedefi silmek ona bağlı çizimleri de kaldırır; geri al bunları birlikte geri getirir. Geri alma geçmişi o açık oturuma aittir.

## Türkiye koordinatlarının durumu

17 Ekim 2026 tarihinde kontrol edilen resmî duyurularda kurallar mevcut; dijital yarışma haritası, kalkış noktaları ve günlük TDS henüz yayımlanmamıştı. Kurallar II.23 WGS84 / UTM 36S kullanır. S kuzey/güney yarımküre harfi değil, enlem bandıdır; Türkiye kuzey yarımkürededir.

**Kısa 4/4 koordinat, resmî haritanın referansı olmadan eklenmez.** Böylece eksik bilgiyle yanlış hedef oluşmaz. Şu an tam UTM ve GPS girişi, haritadan seçim, çizim ve ölçüm kullanılabilir. Kurallardaki örnek koordinat gerçek bir yarışma hedefi olarak yüklenmedi. Resmî harita yayımlandığında referansın eklenip doğrulanması gerekir; kullanıcıya elle grid formu açılmaz. PZ sınırları ve kalkış noktaları da resmî veri olmadan oluşturulmadı.

Desteklenen girişler: 4/4 (referans hazır olduğunda), 6/7 UTM, başında zon bulunan UTM, GPS enlem/boylam ve yanında ft/m irtifası. Kaynak metin ve orijinal feet değeri korunur.

## Tablette açma

Bilgisayar ve tablet aynı Wi-Fi ağına bağlıyken **Tablet.cmd** dosyasını çalıştırın. Pencerede gösterilen adresi tabletin Safari/Chrome tarayıcısına yazın. Pencereyi ve bilgisayarı açık tutun. Güvenlik duvarı bağlantıya izin vermelidir. Bu yerel ağ seçeneği harita ve çizim için bir önizleme/planlama bağlantısıdır.

**Yerel ağdaki HTTP bağlantısında canlı GPS, uygulama kurulumu ve çevrimdışı açılış desteklenmez.** Uçuşta bağımsız tablet kullanımı için güvenli HTTPS yayını ve o cihazda doğrulama gerekir. Bu pakette HTTPS yayını kurulmuş değildir. Yayınlanmış gibi gösterilmez. Tarayıcı güvenliğini kapatmanız istenmez.

Yatay tablette yan panel, dikey tablette açılır panel kullanılır. “Haritayı büyüt” paneli kapatıp haritayı genişletir. Görevler ve çizimler tabletin kendi tarayıcısında saklanır; bilgisayarla otomatik eşitlenmez. Dosyalar → Plan yedeğini indir / Yedekten geri yükle ile aktarın. Konum izni verilse bile cihazın konum alıcısı ve doğruluğu kontrol edilmelidir.

## Uçuş öncesi

Güncel resmî TDS, harita ve brifingi kontrol edin; plan yedeğini indirin. Güvenli adreste çevrimdışı kullanım için Katmanlar panelinden uygulama önbelleğinin hazır olduğunu kontrol edin ve kullanım hakkına sahip olduğunuz XYZ harita paketini yükleyin. Gerçek cihazda uçak moduyla açılışı, harita kapsamını, GPS doğruluğunu ve ekran davranışını deneyin. GPS irtifası barometrik irtifa değildir.

## Kaynaklar

- [Yarışma ve tarihler](https://watchmefly.net/events/event.php?e=turkiye2026)
- [Resmî duyurular](https://watchmefly.net/events/event.php?e=turkiye2026&v=enb)
- [Günlük görevler](https://watchmefly.net/events/event.php?e=turkiye2026&v=t)
- [Kurallar](https://watchmefly.net/assets/uploads/enb/turkiye2026_rules%202026%20tur.pdf)

Kontrol: 17 Ekim 2026. Duyurular uygulamaya kendiliğinden eşitlenmez.


## PUSULA 0.3.1 · Konum takibi ve yakınlaştırma

Haritayı elle kaydırmak, yakınlaştırmak veya çizim aracına geçmek ekranın GPS’i takip etmesini durdurur. GPS konumu ve açık uçuş kaydı devam eder. Sağdaki konum düğmesiyle yeniden konumunuza dönüp takibi açabilirsiniz; düğme takip açıkken mavi görünür.

Standart ve topo haritalarda mevcut görüntü, desteklenen ayrıntı seviyesinden sonra büyütülür. Uydu kaynağında yüksek çözünürlüklü karo eksikse daha alt seviyedeki görüntü otomatik kullanılır. “Görüntü büyütülüyor · ek ayrıntı yok” yazısı bu durumu belirtir. Büyütme yeni görüntü ayrıntısı üretmez; hedef ve çizim koordinatları değişmez.


## PUSULA 0.3.2 · Görünür çemberler

Çemberler belirgin, kesintisiz renkli çizgi ve açık/koyu kenarlıkla gösterilir. Seçili çemberde yarıçap etiketi bulunur. Yeni çember eklenince veya yarıçap değiştirilince harita çemberi bütünüyle gösterecek şekilde ayarlanır. Telefonda ekleme sonrası panel kapanır. Hedef, marker rengi ve gerçek çember ölçüsü korunur.


## PUSULA 0.4.0 · GPS’ten görsel rüzgâr profili

Uçuş kaydını başlatınca GPS’ten otomatik toplama varsayılan olarak açılır. Rüzgâr panelinde devre dışı bırakabilirsiniz. Yalnız GPS’in açık olması yeterli değildir; uçuş kaydı açık olmalıdır. Kayıt durdurulduğunda mevcut katmanlar cihazda kalır.

Profil, 50 metrelik GPS irtifa katmanlarında oluşur. En az 20 saniye ve 6 örnek gerekir. Son 60 saniyelik pencerede hız/yön, örnekler arasındaki süreyle ağırlıklandırılarak yatay vektörler halinde ortalanır. Böylece 359° ve 1° ortalaması yanlışlıkla 180° olmaz. Hız ekranda km/sa, mevcut manuel giriş ve hesaplamalarda m/sn saklanır.

Örnek: 1200 m GPS irtifasında 10 km/sa ile 210° yönüne gidildiğinde “1200 m · GPS / 10,0 km/sa / Gidiş 210° / Geldiği 030°” görünür. Bu bir arayüz örneğidir; gerçek yarışma veya hava tahmini verisi değildir.

Yatay doğruluk 25 m, dikey doğruluk 35 m sınırını aşarsa ya da dikey doğruluk/irtifa bilinmiyorsa örnekler katmana alınmaz. Eski, tekrarlanan ve zaman sırası bozuk örnekler kullanılmaz. 15 saniyeyi aşan boşluk, irtifa katmanı değişimi ve yeniden kayıt başlangıcı toplama penceresini sıfırlar. En az 0,5 m/sn yatay hareket, 25 m’den dar örnek irtifa aralığı, sınırlı irtifa değişimi ve kararlı yön/hız aranır. Ölçüm koşulları karşılanmadığında panel nedeni gösterir.

Cihaz hız ve yön sağlamıyorsa, yeterli süre ve ölçüm hatasına göre yeterli yer değiştirme bulunan GPS konum farkından hesap yapılabilir; bu yöntemin örnek biriktirmesi daha uzun sürebilir. Ayrıntılar satırdaki açılır alanda görünür.

Aynı GPS irtifa katmanının son kararlı ölçümü, beş saniyeden sık olmayacak şekilde yenilenir. Elle girilmiş rüzgâr katmanları otomatik ölçümle değiştirilmez. Katmanların ölçüm zamanı, örnek sayısı, gerçek GPS irtifa aralığı ve kalite bilgisi yedekte korunur. Önceki kayıttan kalmış bir katman yeni bir katmanla değiştirilene veya siz silene kadar görünür; bu nedenle ölçüm yaşını dikkate alın.

Bu, balonun yatay yer hareketinden elde edilen bir rüzgâr tahminidir. Yerde/araçta alınan hareket rüzgârı temsil etmez. GPS irtifası WGS84 elipsoidi referansındadır; barometrik irtifa, MSL veya yerden yükseklik değildir. Cihazda alan ve irtifa referansları arasında otomatik eşdeğerlik kurulmaz. Ekran kilitliyken kesintisiz arka plan ölçümü garantisi verilmez.

Yer ekibi bağlantısı kapsamdan çıkarıldı; bu özellik veri paylaşımı başlatmaz. Ölçümler mevcut uygulama gibi cihazda saklanır.
