from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.evaluation import MulticlassClassificationEvaluator
from pyspark.sql.functions import udf
from pyspark.sql.types import IntegerType, ArrayType, DoubleType
import os
import pickle
import numpy as np

# --- Mevcut Fonksiyonlar (çoğunlukla değişmedi) ---

def create_spark_session():
    """Hadoop ile entegre Spark oturumu oluşturur"""
    spark = SparkSession.builder \
        .appName("Tarım Tahmin - Spark ML") \
        .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
        .config("spark.yarn.appMasterEnv.PYSPARK_PYTHON", "/usr/local/bin/python") \
        .config("spark.executorEnv.PYSPARK_PYTHON", "/usr/local/bin/python") \
        .config("spark.driver.extraJavaOptions", "-Dlog4j.configuration=file:/opt/spark/conf/log4j.properties") \
        .config("spark.executor.extraJavaOptions", "-Dlog4j.configuration=file:/opt/spark/conf/log4j.properties") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN") # Daha az log çıktısı için
    return spark

def load_data_from_hdfs(spark: SparkSession):
    """HDFS'ten tarım verilerini yükler; başarısız olursa yerelden okumaya çalışır."""
    hdfs_path = "hdfs://namenode:9000/user/hadoop/agri_predict/raw/fake_agricultural_data.csv"
    # spark_ml_pipeline.py dosyasının konumuna göre yerel yol ayarlandı
    local_path = "../../data/raw/fake_agricultural_data.csv"

    try:
        print(f"HDFS'ten veri okunuyor: {hdfs_path}")
        df = spark.read.csv(hdfs_path, header=True, inferSchema=True)
        print("✅ HDFS'ten veri başarıyla okundu.")
        return df
    except Exception as e:
        print(f"⚠️ HDFS'ten veri okuma hatası: {e}")

    print(f"Yerel dosyadan veri okunuyor: {local_path}")
    if os.path.exists(local_path):
        try:
            df_local = spark.read.csv(local_path, header=True, inferSchema=True)
            print("✅ Yerel dosyadan veri başarıyla okundu.")
            return df_local
        except Exception as e_local:
            raise RuntimeError(f"Yerel dosyadan okuma esnasında hata: {e_local}")
    else:
        raise FileNotFoundError(f"Veri dosyası ne HDFS'te ne de yerelde bulundu:\n"
                                f" - HDFS: {hdfs_path}\n"
                                f" - Yerel: {local_path}")

def prepare_data_for_prediction(df):
    """Tahmin için veriyi hazırlar (VectorAssembler kullanır)"""
    feature_cols = ["soil_ph", "rainfall_mm", "temperature_celsius"]
    assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
    data = assembler.transform(df)
    return data

# --- Pickle Modeli İçin Yeni Fonksiyonlar ve Mantık ---

def load_pickle_model(model_path):
    """Belirtilen yoldan bir pickle modelini yükler."""
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print(f"✅ Pickle modeli başarıyla yüklendi: {model_path}")
        return model
    except FileNotFoundError:
        print(f"❌ Model dosyası bulunamadı: {model_path}. Lütfen dosya yolunu kontrol edin.")
        raise
    except Exception as e:
        print(f"❌ Pickle modeli yüklenirken hata oluştu: {e}. "
              f"Modelin doğru bir pickle dosyası olduğundan ve gerekli kütüphanelerin (örn. numpy, scikit-learn) kurulu olduğundan emin olun.")
        raise

# Modelin yolu (spark_ml_pipeline.py dosyasından data/models/crop_predict_model.pkl'a göre)
PICKLE_MODEL_PATH = "../../data/models/crop_predict_model.pkl"

# Spark driver'ında modelin bir kez yüklenmesini sağlamak için global bir değişken kullanıyoruz.
# UDF'ler, closure'ları otomatik olarak serileştirir ve işçilere gönderir.
# Eğer model çok büyükse ve bu yöntemle performans sorunları yaşarsanız,
# SparkContext.broadcast kullanmayı düşünebilirsiniz.
loaded_sk_model = None
try:
    loaded_sk_model = load_pickle_model(PICKLE_MODEL_PATH)
except Exception as e:
    print(f"Uygulama başlatılırken pickle modeli yüklenemedi: {e}")
    # Model yüklenemezse uygulamanın devam etmemesi için burada bir hata fırlatılabilir.
    # raise # Eğer model yüklenemezse uygulamanın başlamasını engellemek için bu satırı etkinleştirin.

# UDF için tahmin fonksiyonu
def predict_with_sk_model(features):
    """
    Scikit-learn modelini kullanarak tek bir özellik vektörü üzerinde tahmin yapar.
    Bu fonksiyon bir Spark UDF'i olarak kullanılacaktır.
    """
    if loaded_sk_model is None:
        # Bu durum normalde olmamalı, çünkü modelin uygulama başlangıcında yüklenmesi beklenir.
        print("Hata: Scikit-learn modeli yüklenmemiş veya yüklenirken hata oluştu!")
        return -1 # Veya uygun bir hata değeri döndürün

    # Spark'ın VectorAssembler'dan gelen yoğun vektörü NumPy dizisine dönüştürür.
    # Eğer seyrek vektör geliyorsa 'features.toArray()' kullanın.
    # .reshape(1, -1) tek bir örneği (row) bekleyen scikit-learn modelleri için gereklidir.
    feature_array = np.array(features.toArray()).reshape(1, -1)
    prediction = loaded_sk_model.predict(feature_array)[0]
    return int(prediction) # Tahmin genellikle bir tamsayıdır (sınıf etiketi)

# UDF'i tanımla
# IntegerType, tahmin çıktısının türünü belirtir (province_id gibi).
predict_udf = udf(predict_with_sk_model, IntegerType())


def main():
    """Ana fonksiyon"""
    spark = create_spark_session()

    try:
        # Veriyi yükle
        df = load_data_from_hdfs(spark)

        # Tahmin için veriyi hazırla (features sütunu oluştur)
        data_for_prediction = prepare_data_for_prediction(df)

        # Pickle modeli ile tahmin yap
        # 'features' sütununu UDF'e girdi olarak veriyoruz
        predictions_df = data_for_prediction.withColumn("prediction", predict_udf(data_for_prediction["features"]))

        print("\n--- Tahmin Sonuçları (İlk 5 satır) ---")
        # Gerçek 'province_id' sütunu varsa karşılaştırma için gösterilebilir.
        predictions_df.select("soil_ph", "rainfall_mm", "temperature_celsius", "province_id", "prediction").show(5)

        # Modeli değerlendirme (eğer gerçek etiketler varsa)
        # Bu kısım, province_id'nin gerçek etiket olduğunu varsayar.
        # Eğer sadece tahmin yapılıyorsa bu kısma gerek yoktur.
        print("\n--- Model Değerlendirme ---")
        evaluator = MulticlassClassificationEvaluator(
            labelCol="province_id", predictionCol="prediction", metricName="accuracy")
        accuracy = evaluator.evaluate(predictions_df)
        print(f"Model doğruluğu (pickle modeli): {accuracy:.4f}")

        print("\nPickle modeli ile tahmin ve değerlendirme başarıyla tamamlandı.")

    except Exception as e:
        print(f"\n🚨 Uygulama sırasında genel bir hata oluştu: {e}")
    finally:
        spark.stop()

if __name__ == "__main__":
    main()
