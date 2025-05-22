from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import json
import werkzeug.utils
import werkzeug.urls
from pyspark.sql import SparkSession
from pyspark.ml.classification import RandomForestClassificationModel
from pyspark.ml.feature import VectorAssembler
import jinja2
import markupsafe
import itsdangerous
import json as _stdlib_json

try:
    from flask_cors import CORS, cross_origin
except ImportError:
    # Path hack allows examples to be run without installation.
    import os
    parentdir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.sys.path.insert(0, parentdir)
    from flask_cors import CORS, cross_origin


app = Flask(__name__)
CORS(app)  # Cross-Origin Resource Sharing etkinleştirme

# Veri dosyası yolu - HDFS ve yerel dosya sistemi için alternatifler
HDFS_DATA_PATH = "hdfs://namenode:9000/user/hadoop/agri_predict/raw/fake_agricultural_data.csv"
LOCAL_DATA_PATH = "../data/raw/fake_agricultural_data.csv"
HDFS_MODEL_PATH = "hdfs://namenode:9000/user/hadoop/agri_predict/models/random_forest_model"
LOCAL_MODEL_PATH = "../data/models/random_forest_model"

# Model nesnesi
model = None
spark = None

def create_spark_session():
    """Hadoop ile entegre Spark oturumu oluşturur"""
    global spark
    if spark is None:
        spark = SparkSession.builder \
            .appName("Tarım Tahmin - Flask API") \
            .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
            .getOrCreate()
    return spark

def load_data():
    """Veri dosyasını yükler ve DataFrame olarak döndürür"""
    try:
        # Önce HDFS'ten okumayı dene
        spark = create_spark_session()
        spark_df = spark.read.csv(HDFS_DATA_PATH, header=True, inferSchema=True)
        df = spark_df.toPandas()
        print(f"Veri HDFS'ten başarıyla yüklendi: {HDFS_DATA_PATH}")
        return df
    except Exception as e:
        print(f"HDFS'ten veri yükleme hatası: {e}")

        # Yerel dosyadan okumayı dene
        if os.path.exists(LOCAL_DATA_PATH):
            df = pd.read_csv(LOCAL_DATA_PATH)
            print(f"Veri yerel dosyadan yüklendi: {LOCAL_DATA_PATH}")
            return df
        else:
            print(f"Hata: Veri dosyası bulunamadı!")
            return None

def load_model():
    """Eğitilmiş modeli yükler"""
    global model

    try:
        # Önce HDFS'ten modeli yüklemeyi dene
        spark = create_spark_session()
        model = RandomForestClassificationModel.load(HDFS_MODEL_PATH)
        print(f"Model HDFS'ten başarıyla yüklendi: {HDFS_MODEL_PATH}")
        return True
    except Exception as e:
        print(f"HDFS'ten model yükleme hatası: {e}")

        # Yerel dosyadan yüklemeyi dene
        try:
            model = RandomForestClassificationModel.load(LOCAL_MODEL_PATH)
            print(f"Model yerel dosyadan yüklendi: {LOCAL_MODEL_PATH}")
            return True
        except Exception as e:
            print(f"Yerel dosyadan model yükleme hatası: {e}")
            return False

@app.route('/api/provinces', methods=['GET'])
def get_provinces():
    """Tüm illerin listesini döndürür"""
    df = load_data()
    if df is None:
        return jsonify({"error": "Veri yüklenemedi"}), 500

    provinces = df[['province_id', 'province_name']].to_dict('records')
    return jsonify(provinces)

@app.route('/api/province/<int:province_id>', methods=['GET'])
def get_province_data(province_id):
    """Belirli bir ilin tarım verilerini döndürür"""
    df = load_data()
    if df is None:
        return jsonify({"error": "Veri yüklenemedi"}), 500

    province_data = df[df['province_id'] == province_id]
    if province_data.empty:
        return jsonify({"error": "İl bulunamadı"}), 404

    return jsonify(province_data.iloc[0].to_dict())

@app.route('/api/predict', methods=['POST'])
def predict_crop():
    """Verilen toprak pH, yağış ve sıcaklık değerlerine göre ürün tahmini yapar"""
    global model

    # Model yüklenmemişse yükle
    if model is None:
        success = load_model()
        if not success:
            return jsonify({"error": "Model yüklenemedi"}), 500

    # İstek verilerini al
    data = request.get_json()
    if not data or not all(key in data for key in ["soil_ph", "rainfall_mm", "temperature_celsius"]):
        return jsonify({"error": "Geçersiz veri formatı. 'soil_ph', 'rainfall_mm' ve 'temperature_celsius' değerleri gerekli"}), 400

    try:
        # Spark oturumu oluştur
        spark = create_spark_session()

        # Tahmin için veriyi hazırla
        input_data = [(
            float(data['soil_ph']),
            float(data['rainfall_mm']),
            float(data['temperature_celsius'])
        )]

        # Spark DataFrame'e dönüştür
        columns = ["soil_ph", "rainfall_mm", "temperature_celsius"]
        spark_df = spark.createDataFrame(input_data, columns)

        # Özellikleri vektöre dönüştür
        assembler = VectorAssembler(inputCols=columns, outputCol="features")
        vector_df = assembler.transform(spark_df)

        # Tahmin yap
        prediction = model.transform(vector_df)
        predicted_crop_id = prediction.select("prediction").collect()[0][0]

        # İl adını bul
        df = load_data()
        province_name = df[df['province_id'] == int(predicted_crop_id)]['province_name'].values[0]

        # Sonucu döndür
        return jsonify({
            "predicted_province_id": int(predicted_crop_id),
            "predicted_province_name": province_name,
            "input_data": data
        })
    except Exception as e:
        return jsonify({"error": f"Tahmin yapılırken bir hata oluştu: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """API sağlık kontrolü"""
    return jsonify({
        "status": "healthy",
        "message": "Flask API çalışıyor",
        "hadoop_connection": "Kontrol ediliyor...",
        "spark_connection": "Kontrol ediliyor..."
    })

@app.route('/api/hadoop/status', methods=['GET'])
def hadoop_status():
    """Hadoop bağlantı durumunu kontrol eder"""
    try:
        spark = create_spark_session()
        # HDFS'e basit bir erişim testi
        test_df = spark.read.csv(HDFS_DATA_PATH, header=True, inferSchema=True)
        count = test_df.count()
        return jsonify({
            "status": "connected",
            "message": f"Hadoop HDFS bağlantısı başarılı. {count} satır veri erişilebilir."
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Hadoop HDFS bağlantı hatası: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Flask uygulamasını başlat
    app.run(host='0.0.0.0', port=5000, debug=True)
