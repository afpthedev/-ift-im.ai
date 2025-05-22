from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator
import os

def create_spark_session():
    """Hadoop ile entegre Spark oturumu oluşturur"""
    spark = SparkSession.builder \
        .appName("Tarım Tahmin - Spark ML") \
        .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
        .getOrCreate()
    
    return spark

def load_data_from_hdfs(spark):
    """HDFS'ten tarım verilerini yükler"""
    try:
        # HDFS'ten veri okuma
        df = spark.read.csv("hdfs://namenode:9000/user/hadoop/agri_predict/raw/fake_agricultural_data.csv", 
                           header=True, inferSchema=True)
        print("HDFS'ten veri başarıyla okundu.")
        return df
    except Exception as e:
        print(f"HDFS'ten veri okuma hatası: {e}")
        
        # Yedek olarak yerel dosyadan okuma
        print("Yerel dosyadan veri okunuyor...")
        local_path = "../data/raw/fake_agricultural_data.csv"
        if os.path.exists(local_path):
            return spark.read.csv(local_path, header=True, inferSchema=True)
        else:
            raise Exception(f"Veri dosyası bulunamadı: {local_path}")

def prepare_data(df):
    """Makine öğrenmesi için veriyi hazırlar"""
    # Özellik sütunlarını seç
    feature_cols = ["soil_ph", "rainfall_mm", "temperature_celsius"]
    
    # Özellikleri tek bir vektör sütununa dönüştür
    assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
    data = assembler.transform(df)
    
    # Eğitim ve test verilerini ayır
    train_data, test_data = data.randomSplit([0.8, 0.2], seed=42)
    
    return train_data, test_data

def train_model(train_data):
    """RandomForest sınıflandırıcı modelini eğitir"""
    # RandomForest sınıflandırıcı oluştur
    rf = RandomForestClassifier(labelCol="province_id", 
                               featuresCol="features", 
                               numTrees=10)
    
    # Modeli eğit
    model = rf.fit(train_data)
    
    return model

def evaluate_model(model, test_data):
    """Modeli test verileri üzerinde değerlendirir"""
    # Test verileri üzerinde tahmin yap
    predictions = model.transform(test_data)
    
    # Model performansını değerlendir
    evaluator = MulticlassClassificationEvaluator(
        labelCol="province_id", predictionCol="prediction", metricName="accuracy")
    accuracy = evaluator.evaluate(predictions)
    
    print(f"Model doğruluğu: {accuracy:.4f}")
    
    return predictions

def save_model_to_hdfs(model, spark):
    """Eğitilmiş modeli HDFS'e kaydeder"""
    try:
        # Modeli HDFS'e kaydet
        model.write().overwrite().save("hdfs://namenode:9000/user/hadoop/agri_predict/models/random_forest_model")
        print("Model HDFS'e başarıyla kaydedildi.")
    except Exception as e:
        print(f"Model HDFS'e kaydedilemedi: {e}")
        
        # Yedek olarak yerel dizine kaydet
        local_path = "../data/models/random_forest_model"
        print(f"Model yerel dizine kaydediliyor: {local_path}")
        model.write().overwrite().save(local_path)

def main():
    """Ana fonksiyon"""
    # Spark oturumu oluştur
    spark = create_spark_session()
    
    try:
        # Veriyi yükle
        df = load_data_from_hdfs(spark)
        
        # Veriyi hazırla
        train_data, test_data = prepare_data(df)
        
        # Modeli eğit
        model = train_model(train_data)
        
        # Modeli değerlendir
        predictions = evaluate_model(model, test_data)
        
        # Modeli kaydet
        save_model_to_hdfs(model, spark)
        
        print("Spark-Hadoop entegrasyonu ve model eğitimi başarıyla tamamlandı.")
        
    finally:
        # Spark oturumunu kapat
        spark.stop()

if __name__ == "__main__":
    main()
