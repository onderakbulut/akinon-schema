# Akinon Schema VS Code Uzantısı

Bu VS Code uzantısı, Akinon şema yapısını oluştururken yardımcı olan özellikler sunar. Uzantı sadece `schema.json` dosyalarında çalışır.

## Özellikler

### Veri Tipleri ve Otomatik Tamamlama
* `text`: Standart metin giriş alanı
* `image`: Resim yükleme alanı
* `dropdown`: Seçim kutusu (choices özelliği ile)
* `area`: HTML editör alanı
* `nested`: İç içe yapılar için kullanılır

### Widget Şablonları
* `widget-template`: Temel widget şablonu
* `widget-slider`: Slider widget şablonu (title, description, image, url vb. alanlar içerir)

### Doğrulama Kontrolleri
* Gerekli alanların kontrolü (`data_type`, `key`, `label`)
* Veri tipi geçerliliği kontrolü
* Key değerlerinin nesne isimleriyle eşleşme kontrolü
* HTML editor kullanımı için area veri tipi kontrolü

### Hızlı Ekleme Özellikleri
* Dropdown seçildiğinde otomatik choices örneği ekleme
* Area seçildiğinde otomatik HTML editor örneği ekleme

## Kullanım

1. `schema.json` dosyanızı oluşturun veya açın
2. Veri tiplerini yazarken otomatik tamamlama önerilerini kullanın
3. Widget şablonları için "widget" yazmaya başlayın ve önerilen şablonlardan birini seçin
4. Dropdown veya Area veri tiplerinde tıklanabilir bağlantıları kullanarak örnek yapıları ekleyin
5. Hataları ve önerileri editörde altı çizili olarak görüntüleyin

## Geliştirme

* `npm install` ile bağımlılıkları yükleyin
* F5 tuşu ile hata ayıklama modunda başlatın
* Yeni bir VS Code penceresi açılacak ve uzantınız yüklenecek 