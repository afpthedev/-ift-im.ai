# Tarım Tahmin Uygulaması Veri İletişim Akışı Analizi

## Genel Bakış

Tarım Tahmin Uygulaması, kullanıcıların toprak ve iklim verilerine dayalı olarak en uygun tarım ürünlerini tahmin etmelerini sağlayan bir sistemdir. Uygulama, frontend (React), backend (Flask), veri işleme (Spark) ve veri depolama (Hadoop) katmanlarından oluşmaktadır.

## Veri İletişim Akışı

### 1. Kullanıcı Etkileşimi ve Frontend İşlemleri
- Kullanıcı, web arayüzünden bir il seçer
- Seçilen ile ait toprak pH, yağış ve sıcaklık verileri görüntülenir
- Kullanıcı "Tahmin Yap" butonuna tıklar
- Frontend, seçilen ilin verilerini içeren bir tahmin isteği oluşturur
- İstek, Axios kütüphanesi kullanılarak backend API'sine gönderilir

### 2. Backend API İşlemleri
- Flask API, `/api/predict` endpoint'i üzerinden POST isteğini alır
- İstek verileri (toprak pH, yağış, sıcaklık) doğrulanır
- Veriler, Spark işleme katmanına iletilmek üzere hazırlanır
- Eğer model henüz yüklenmemişse, HDFS'ten veya yerel depodan yüklenir

### 3. Spark Model İşlemleri
- Gelen veriler Pandas DataFrame'e dönüştürülür
- Pandas DataFrame, Spark DataFrame'e dönüştürülür
- VectorAssembler kullanılarak özellikler bir vektöre dönüştürülür
- Daha önce eğitilmiş RandomForestClassificationModel kullanılarak tahmin yapılır
- Tahmin sonucu (ürün ID'si) alınır

### 4. Sonuç İşleme ve Dönüş
- Tahmin edilen ürün ID'si, ürün adına dönüştürülür
- Sonuç, güven değeri ve giriş verileriyle birlikte JSON formatında hazırlanır
- Flask API, hazırlanan JSON yanıtını frontend'e döndürür

### 5. Frontend Sonuç Gösterimi
- Frontend, API'den gelen yanıtı alır
- Tahmin sonucu (önerilen ürün) ve güven değeri kullanıcıya gösterilir
- Kullanıcı arayüzü, sonucu vurgulayacak şekilde güncellenir

## Veri Akışı Detayları

### Frontend'den Backend'e Veri Gönderimi
```json
// POST /api/predict
{
  "soil_ph": 6.75,
  "rainfall_mm": 541,
  "temperature_celsius": 12.6
}
```

### Backend'den Frontend'e Yanıt
```json
{
  "prediction": 4,
  "crop_name": "Ayçiçeği",
  "confidence": 0.85,
  "input_data": {
    "soil_ph": 6.75,
    "rainfall_mm": 541,
    "temperature_celsius": 12.6
  }
}
```

## Teknoloji Entegrasyonu

### Frontend - Backend Entegrasyonu
- React frontend, Axios HTTP istemcisi kullanarak Flask API ile iletişim kurar
- CORS (Cross-Origin Resource Sharing) desteği, farklı kaynaklardan gelen isteklere izin verir

### Backend - Spark Entegrasyonu
- Flask, PySpark kütüphanesi aracılığıyla Spark ile entegre olur
- SparkSession, Flask uygulaması başlatıldığında oluşturulur
- Model, HDFS veya yerel depodan yüklenir

### Spark - Hadoop Entegrasyonu
- Spark, HDFS'e erişmek için Hadoop konfigürasyonunu kullanır
- Model, "hdfs://namenode:9000/user/hadoop/agri_predict/models/random_forest_model" yolundan yüklenir
- Veri akışı, Hadoop Distributed File System üzerinden gerçekleşir

## Hata İşleme

- Backend, model yükleme veya tahmin sırasında oluşabilecek hataları yakalar ve uygun hata mesajlarıyla yanıt verir
- Frontend, API çağrısı sırasında oluşabilecek hataları yakalar ve kullanıcıya bildirir
- Yedek olarak, HDFS'e erişilemediğinde yerel depolama kullanılır
