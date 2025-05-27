import pickle

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

# Global model
nb_model = None
app = Flask(__name__)
CORS(app)  # Cross-Origin Resource Sharing etkinleştirme

# Veri dosyası yolu - HDFS ve yerel dosya sistemi için alternatifler
HDFS_DATA_PATH = "hdfs://namenode:9000/user/hadoop/agri_predict/raw/fake_agricultural_data.csv"
LOCAL_DATA_PATH = "../data/raw/fake_agricultural_data.csv"
HDFS_MODEL_PATH = "hdfs://namenode:9000/user/hadoop/agri_predict/models/random_forest_model"
LOCAL_MODEL_PATH = "../data/models/random_forest_model"
CSV_DATA_PATH = "backend/data/Crop_recommendation.csv"
MODEL_PATH = "data/models/naive_bayes_model.pkl"
FEATURE_COLS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
LABEL_COL = 'label'
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
from sklearn.naive_bayes import GaussianNB

def train_and_persist_model():
    """Train a Gaussian Naive Bayes on the CSV data and save the model."""
    global nb_model
    if not os.path.exists(CSV_DATA_PATH):
        raise FileNotFoundError(f"CSV data not found: {CSV_DATA_PATH}")
    df = pd.read_csv(CSV_DATA_PATH)
    missing = [c for c in FEATURE_COLS + [LABEL_COL] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns in CSV: {missing}")
    X = df[FEATURE_COLS]
    y = df[LABEL_COL]
    nb_model = GaussianNB()
    nb_model.fit(X, y)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump({'model': nb_model, 'features': FEATURE_COLS}, f)
    print("Naive Bayes model trained and saved.")


def load_model():
    """Load persisted Naive Bayes model or train if none exists."""
    global nb_model
    if nb_model is not None:
        return
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            data = pickle.load(f)
            nb_model = data['model']
        print("Naive Bayes model loaded from disk.")
    else:
        train_and_persist_model()

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

# Bootstrap model on startup
with app.app_context():
    load_model()
@app.route('/api/predict', methods=['POST'])
def predict_crop():
    load_model()
    data = request.get_json() or {}
    missing = [c for c in FEATURE_COLS if c not in data]
    if missing:
        return jsonify({'error': f"Missing features: {', '.join(missing)}"}), 400
    try:
        X = [[float(data[c]) for c in FEATURE_COLS]]
    except ValueError:
        return jsonify({'error': 'Feature values must be numeric.'}), 400
    pred = nb_model.predict(X)[0]
    return jsonify({'predicted_crop': pred, 'input': data})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health endpoint to verify model readiness."""
    ready = nb_model is not None
    return jsonify({'model_ready': ready})

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
