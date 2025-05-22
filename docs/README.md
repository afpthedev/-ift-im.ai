# Tarım Tahmin Projesi Dokümantasyonu

## Proje Genel Bakış

Bu proje, çiftçilere tarla verilerine (toprak pH, yağış, sıcaklık) dayalı ürün tahmini sunan, Hadoop, Spark, Flask ve React teknolojilerini kullanan ve Docker üzerinde çalışan bir uygulamadır. Kullanıcılar, Türkiye haritası üzerinden illerini seçerek o bölgeye ait tarımsal verileri görebilecek ve makine öğrenmesi algoritmaları ile oluşturulan tahminlere erişebileceklerdir.

## Proje Bileşenleri ve Veri Akışı

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

## Kurulum ve Çalıştırma Talimatları

### Ön Gereksinimler
- Docker ve Docker Compose yüklü olmalıdır
- Git (opsiyonel, projeyi klonlamak için)

### Kurulum Adımları

1. Projeyi indirin veya klonlayın:
```bash
git clone https://github.com/kullanici/agri_predict_project.git
cd agri_predict_project
```

2. Proje yapısını kontrol edin ve eksik dizinleri oluşturun:
```bash
chmod +x check_project_structure.bat
./check_project_structure.bat
```

3. Docker Compose ile tüm servisleri başlatın:
```bash
docker-compose up -d
```

4. Servislerin başlamasını bekleyin (ilk başlatma biraz zaman alabilir) ve test edin:
```bash
chmod +x test_services.sh
./test_services.sh
```

5. Uygulamaya tarayıcıdan erişin:
```
http://localhost:3000
```

### Servis Portları
- React Frontend: http://localhost:3000
- Flask API: http://localhost:5000
- Hadoop NameNode UI: http://localhost:9870
- Spark Master UI: http://localhost:8080

## Kullanım Kılavuzu

1. Ana sayfada Türkiye haritası görüntülenir
2. Haritadan bir il seçin veya açılır menüden il seçimi yapın
3. Seçilen ile ait toprak pH, yağış ve sıcaklık verileri görüntülenir
4. Makine öğrenmesi modeli tarafından önerilen ürün tahminini görün
5. Sistem durumu bölümünden Hadoop ve API bağlantılarının durumunu kontrol edin

## API Dokümantasyonu

### Tüm İlleri Listeleme
- **Endpoint**: `/api/provinces`
- **Metod**: GET
- **Yanıt**: İl ID ve adlarını içeren JSON listesi

### İl Verilerini Getirme
- **Endpoint**: `/api/province/<province_id>`
- **Metod**: GET
- **Parametre**: `province_id` - İl ID'si
- **Yanıt**: İle ait tarımsal verileri içeren JSON nesnesi

### Ürün Tahmini
- **Endpoint**: `/api/predict`
- **Metod**: POST
- **İstek Gövdesi**: JSON formatında toprak pH, yağış ve sıcaklık değerleri
- **Yanıt**: Tahmin edilen ürün bilgisini içeren JSON nesnesi

### Sistem Durumu
- **Endpoint**: `/api/health`
- **Metod**: GET
- **Yanıt**: API durumunu içeren JSON nesnesi

### Hadoop Durumu
- **Endpoint**: `/api/hadoop/status`
- **Metod**: GET
- **Yanıt**: Hadoop bağlantı durumunu içeren JSON nesnesi

## Hadoop ve HDFS Kullanımı

### HDFS'e Veri Yükleme
Hadoop konteynerine bağlanarak HDFS komutlarını çalıştırabilirsiniz:

```bash
docker exec -it namenode bash
hdfs dfs -ls /user/hadoop/agri_predict/raw
```

Veya hazır script kullanarak:

```bash
docker exec -it namenode bash -c "/hadoop/scripts/load_data_to_hdfs.sh"
```

### HDFS Dizin Yapısı
- `/user/hadoop/agri_predict/raw`: Ham veri dosyaları
- `/user/hadoop/agri_predict/processed`: İşlenmiş veri dosyaları
- `/user/hadoop/agri_predict/models`: Eğitilmiş model dosyaları

## Spark ile Veri İşleme

### Spark Uygulamasını Çalıştırma
Spark konteynerine bağlanarak PySpark uygulamasını çalıştırabilirsiniz:

```bash
docker exec -it spark-master bash
cd /opt/bitnami/spark/data
spark-submit spark_ml_pipeline.py
```

### Scala Uygulamasını Çalıştırma
```bash
docker exec -it spark-master bash
cd /opt/bitnami/spark/data
spark-shell -i SparkHDFSIntegration.scala
```

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

## Proje Yapısı

```
agri_predict_project/
├── data/
│   ├── raw/                      # Ham veri dosyaları
│   │   └── fake_agricultural_data.csv
│   ├── processed/                # İşlenmiş veri dosyaları
│   └── models/                   # Eğitilmiş model dosyaları
├── backend/
│   ├── app.py                    # Flask API uygulaması
│   ├── Dockerfile                # Backend Docker yapılandırması
│   └── requirements.txt          # Python bağımlılıkları
├── frontend/
│   ├── public/                   # Statik dosyalar
│   │   ├── index.html            # HTML ana dosyası
│   │   └── manifest.json         # Web uygulama manifest dosyası
│   ├── src/                      # React kaynak kodları
│   │   ├── App.js                # Ana uygulama bileşeni
│   │   ├── index.js              # Giriş noktası
│   │   ├── index.css             # Stil dosyası
│   │   └── turkey-provinces.json # Türkiye illeri GeoJSON
│   ├── Dockerfile                # Frontend Docker yapılandırması
│   └── package.json              # NPM bağımlılıkları
├── hadoop/
│   ├── config/                   # Hadoop konfigürasyon dosyaları
│   │   ├── core-site.xml         # Hadoop çekirdek yapılandırması
│   │   ├── hdfs-site.xml         # HDFS yapılandırması
│   │   └── hadoop-env.sh         # Hadoop ortam değişkenleri
│   ├── data/                     # HDFS veri dizinleri
│   │   ├── namenode/             # NameNode veri dizini
│   │   └── datanode/             # DataNode veri dizini
│   ├── scripts/                  # Hadoop yardımcı scriptleri
│   │   └── load_data_to_hdfs.sh  # HDFS'e veri yükleme scripti
│   └── hadoop.env                # Hadoop ortam değişkenleri
├── spark/
│   ├── spark_ml_pipeline.py      # PySpark ML pipeline
│   └── SparkHDFSIntegration.scala # Spark-HDFS entegrasyon örneği
├── docker-compose.yml            # Docker Compose yapılandırması
├── check_project_structure.sh    # Proje yapısı kontrol scripti
├── test_services.sh              # Servis test scripti
└── README.md                     # Proje dokümantasyonu
```

## Geliştirme ve Genişletme

### Yeni İl Verisi Ekleme
1. `data/raw/fake_agricultural_data.csv` dosyasını düzenleyin
2. Docker konteynerlerini yeniden başlatın

### Makine Öğrenmesi Modelini Geliştirme
1. `spark/spark_ml_pipeline.py` dosyasını düzenleyin
2. Yeni özellikler ekleyin veya model parametrelerini ayarlayın
3. Spark konteynerinde uygulamayı çalıştırın

### Kullanıcı Arayüzünü Özelleştirme
1. `frontend/src/` altındaki dosyaları düzenleyin
2. Yeni bileşenler ekleyin veya mevcut bileşenleri değiştirin
3. Frontend konteynerini yeniden başlatın

## Sorun Giderme

### Servisler Başlamıyor
- Docker loglarını kontrol edin: `docker-compose logs`
- Tüm servisleri yeniden başlatın: `docker-compose down && docker-compose up -d`

### API Yanıt Vermiyor
- Flask API loglarını kontrol edin: `docker-compose logs flask-backend`
- API'nin çalıştığını doğrulayın: `curl http://localhost:5000/api/health`

### Frontend Yüklenmiyor
- React loglarını kontrol edin: `docker-compose logs react-frontend`
- Tarayıcı konsolunda hata mesajlarını kontrol edin

### Hadoop veya HDFS Sorunları
- Hadoop loglarını kontrol edin: `docker-compose logs namenode`
- HDFS dizin izinlerini kontrol edin: `docker exec -it namenode hdfs dfs -ls /`

### Spark Sorunları
- Spark loglarını kontrol edin: `docker-compose logs spark-master`
- Spark UI'ı kontrol edin: `http://localhost:8080`

## Sonuç

Bu proje, modern veri işleme ve makine öğrenmesi teknolojilerini kullanarak çiftçilere değerli tarımsal tahminler sunan kapsamlı bir uygulamadır. Hadoop ve Spark ile büyük veri işleme, Flask ile API hizmetleri ve React ile kullanıcı dostu arayüz sağlayarak, tarımsal verilerin analizini ve görselleştirilmesini kolaylaştırır.

Projenin her bileşeni, tarım dünyasından benzetmelerle açıklanarak, teknik kavramların daha anlaşılır olması hedeflenmiştir. Bu sayede, başlangıç seviyesindeki kullanıcılar bile sistemin nasıl çalıştığını anlayabilir ve kendi ihtiyaçlarına göre özelleştirebilir.
