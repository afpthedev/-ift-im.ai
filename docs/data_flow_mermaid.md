```mermaid
flowchart TD
    %% Ana Bileşenler
    User([Kullanıcı])
    ReactFE[React Frontend]
    FlaskAPI[Flask API]
    SparkML[Spark ML]
    HDFS[(Hadoop HDFS)]
    
    %% Alt Bileşenler
    SelectProvince[İl Seçimi]
    PredictButton[Tahmin Yap Butonu]
    APIEndpoint[/api/predict Endpoint]
    ModelLoader[Model Yükleme]
    FeatureVector[Özellik Vektörü Oluşturma]
    ModelPredict[Model Tahmin]
    ResultProcess[Sonuç İşleme]
    
    %% Kullanıcı Etkileşimi
    User -->|1. İl Seçer| SelectProvince
    SelectProvince -->|2. Verileri Gösterir| ReactFE
    User -->|3. Tahmin Yap'a Tıklar| PredictButton
    
    %% Frontend İşlemleri
    PredictButton -->|4. POST İsteği| ReactFE
    ReactFE -->|5. Axios HTTP İsteği| APIEndpoint
    
    %% Backend İşlemleri
    APIEndpoint -->|6. Veri Doğrulama| FlaskAPI
    FlaskAPI -->|7. Model Kontrolü| ModelLoader
    
    %% Model Yükleme
    ModelLoader -->|8a. Model Yükleme İsteği| HDFS
    HDFS -->|8b. Eğitilmiş Model| ModelLoader
    ModelLoader -->|8c. Yedek Yol| LocalStorage[(Yerel Depo)]
    LocalStorage -->|8d. Yedek Model| ModelLoader
    
    %% Spark İşlemleri
    FlaskAPI -->|9. Veri Dönüşümü| SparkML
    SparkML -->|10. Pandas DataFrame| FeatureVector
    FeatureVector -->|11. Spark DataFrame| ModelPredict
    ModelPredict -->|12. Tahmin| ResultProcess
    
    %% Sonuç İşleme
    ResultProcess -->|13. JSON Yanıt| FlaskAPI
    FlaskAPI -->|14. HTTP Yanıt| ReactFE
    ReactFE -->|15. Sonuç Gösterimi| User
    
    %% Hata Yönetimi
    FlaskAPI -->|Hata Durumu| ErrorHandler[Hata Yönetimi]
    ErrorHandler -->|Hata Mesajı| ReactFE
    
    %% Stil Tanımlamaları
    classDef userClass fill:#f9f,stroke:#333,stroke-width:2px;
    classDef frontendClass fill:#bbf,stroke:#33f,stroke-width:1px;
    classDef backendClass fill:#bfb,stroke:#3b3,stroke-width:1px;
    classDef sparkClass fill:#fb7,stroke:#f70,stroke-width:1px;
    classDef storageClass fill:#ddd,stroke:#333,stroke-width:1px;
    classDef errorClass fill:#f77,stroke:#f00,stroke-width:1px;
    
    %% Sınıf Atamaları
    class User userClass;
    class ReactFE,SelectProvince,PredictButton frontendClass;
    class FlaskAPI,APIEndpoint,ResultProcess backendClass;
    class SparkML,ModelLoader,FeatureVector,ModelPredict sparkClass;
    class HDFS,LocalStorage storageClass;
    class ErrorHandler errorClass;
```
