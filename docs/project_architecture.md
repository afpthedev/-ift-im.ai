# Tarım Tahmin Projesi Mimari Tasarımı

## Proje Genel Bakış

Bu proje, çiftçilere tarla verilerine (toprak pH, yağış, sıcaklık) dayalı ürün tahmini sunan, Hadoop, Spark, Flask ve React teknolojilerini kullanan ve Docker üzerinde çalışan bir uygulamadır. Kullanıcılar, Türkiye haritası üzerinden illerini seçerek o bölgeye ait tarımsal verileri görebilecek ve makine öğrenmesi algoritmaları ile oluşturulan tahminlere erişebileceklerdir.

## Mimari Bileşenler ve Veri Akışı

### 1. Veri Katmanı (Hadoop Ekosistemi)
- **HDFS (Hadoop Distributed File System)**: Tarımsal verilerin depolanması
- **Veri Yapısı**: İllere göre toprak pH, yağış, sıcaklık ve geçmiş ürün verileri
- **Veri Akışı Benzetmesi**: *"Veri yükleme, toprağa tohum ekme gibidir - doğru hazırlanmış bir zemin, sonraki tüm süreçlerin temelidir."*

### 2. Veri İşleme Katmanı (Apache Spark)
- **Spark Core**: Dağıtık veri işleme
- **Spark MLlib**: Makine öğrenmesi modellerinin eğitimi
- **Veri Dönüşümü**: Ham verilerin temizlenmesi, dönüştürülmesi ve analize hazırlanması
- **İşleme Akışı Benzetmesi**: *"Veri işleme, tarladaki ürünlerin sulanması gibidir - ham veriler işlenerek değerli bilgilere dönüştürülür."*

### 3. API Katmanı (Flask)
- **RESTful API**: Frontend ile veri alışverişi
- **Model Servisi**: Eğitilmiş ML modellerinin tahmin için sunulması
- **Veri Erişim Katmanı**: Hadoop/Spark ile iletişim
- **API Benzetmesi**: *"API, çiftçi ile tarla arasındaki köprü gibidir - kullanıcı isteklerini alır ve uygun yanıtları döndürür."*

### 4. Sunum Katmanı (React)
- **Türkiye Haritası**: İnteraktif il seçimi
- **Veri Görselleştirme**: Seçilen ile ait tarımsal verilerin gösterimi
- **Tahmin Sonuçları**: ML modelinden gelen tahminlerin kullanıcı dostu gösterimi
- **Kullanıcı Deneyimi Benzetmesi**: *"Kullanıcı arayüzü, çiftçinin ürünlerini sergilediği pazar yeri gibidir - karmaşık veriler anlaşılır ve çekici bir şekilde sunulur."*

### 5. Konteynerizasyon (Docker)
- **Mikroservisler**: Her bileşen ayrı konteynerda çalışır
- **Docker Compose**: Tüm servislerin orkestrasyon ve yönetimi
- **Ağ Yapılandırması**: Servisler arası iletişim
- **Konteyner Benzetmesi**: *"Docker, her bitkinin kendi saksısında büyümesi gibidir - her bileşen izole edilmiş ancak birlikte çalışan bir ekosistem oluşturur."*

## Veri Akışı Diyagramı

```
[Kullanıcı] <--> [React Frontend] <--> [Flask API] <--> [Spark İşleme] <--> [Hadoop Veri Depolama]
    ^                  |                   |                  |
    |                  v                   v                  v
    +--- [Tahmin Sonuçları] <--- [ML Model Servisi] <--- [Model Eğitimi]
```

## Bileşenler Arası İletişim

1. **Kullanıcı -> React**: İl seçimi ve veri görüntüleme talebi
2. **React -> Flask**: API çağrıları ile veri ve tahmin talebi
3. **Flask -> Spark**: Veri işleme ve model tahmin talebi
4. **Spark -> Hadoop**: Veri okuma ve yazma işlemleri
5. **Spark -> Flask**: İşlenmiş veri ve tahmin sonuçları
6. **Flask -> React**: API yanıtları
7. **React -> Kullanıcı**: Görselleştirilmiş veri ve tahminler

## Teknik Detaylar Basitleştirilmiş Açıklaması

### Hadoop Nedir?
Hadoop, büyük veri setlerini depolamak ve işlemek için kullanılan bir sistemdir. Bunu, çok büyük bir ambar gibi düşünebilirsiniz - tüm tarımsal verilerimizi güvenle saklar ve gerektiğinde erişmemizi sağlar.

### Spark Nedir?
Spark, büyük veri setlerini hızlı bir şekilde işleyen bir araçtır. Tıpkı modern bir hasat makinesi gibi, ham verileri alır ve onları anlamlı bilgilere dönüştürür. Ayrıca, makine öğrenmesi modellerimizi eğitmek için de kullanılır.

### Flask Nedir?
Flask, Python dilinde yazılmış hafif bir web uygulaması çerçevesidir. Çiftçi ile tarla arasındaki iletişimi sağlayan bir tercüman gibi çalışır - kullanıcı isteklerini alır, gerekli işlemleri yapar ve sonuçları geri gönderir.

### React Nedir?
React, kullanıcı arayüzü oluşturmak için kullanılan bir JavaScript kütüphanesidir. Tıpkı bir sergi salonu gibi, karmaşık verileri kullanıcıların kolayca anlayabileceği ve etkileşime geçebileceği bir formatta sunar.

### Docker Nedir?
Docker, uygulamaları konteynerlar içinde paketleyen ve çalıştıran bir platformdur. Her bir bitki için ayrı saksılar kullanmak gibi, her bileşeni kendi ortamında izole eder ama hepsinin birlikte çalışmasını sağlar.

## Proje Geliştirme Aşamaları

1. **Temel Kurulum**: Docker, Hadoop, Spark, Flask ve React ortamlarının hazırlanması
2. **Veri Hazırlama**: Fake tarımsal verilerin oluşturulması ve Hadoop'a yüklenmesi
3. **Model Geliştirme**: Spark MLlib ile tahmin modellerinin oluşturulması
4. **API Geliştirme**: Flask ile RESTful API'nin oluşturulması
5. **Frontend Geliştirme**: React ile kullanıcı arayüzünün oluşturulması
6. **Entegrasyon**: Tüm bileşenlerin Docker üzerinde entegrasyonu
7. **Test ve Doğrulama**: Uçtan uca test ve kullanıcı deneyimi doğrulaması

Bu mimari, başlangıç seviyesindeki kullanıcılar için anlaşılır olacak şekilde tasarlanmıştır, ancak aynı zamanda projenin tüm teknik gereksinimlerini karşılayacak kadar kapsamlıdır.
