# backend/app.py
import os
import pickle
import requests
import pandas as pd

from flask import Flask, jsonify, request
from flask_cors import CORS
from pyspark.sql import SparkSession
from sklearn.naive_bayes import GaussianNB

# --- Configuration ---
BASE_DIR = os.getcwd()
CSV_DATA_PATH = os.path.join(BASE_DIR, "data", "crop_recommendation.csv")
MODEL_PATH    = os.path.join(BASE_DIR, "data", "models", "naive_bayes_model.pkl")

FEATURE_COLS = ['soil_ph', 'rainfall_mm', 'temperature_celsius']
LABEL_COL    = 'label'

HDFS_DATA_PATH  = "hdfs://namenode:9000/user/hadoop/agri_predict/raw/fake_agricultural_data.csv"
LOCAL_DATA_PATH = os.path.join(BASE_DIR, "data", "raw", "fake_agricultural_data.csv")

WEATHERSTACK_KEY = 'ff78c869ec8eb45895ed86afcf2d08c9'
WEATHER_API_URL  = 'http://api.weatherstack.com/current'

# --- Flask setup ---
app = Flask(__name__)
CORS(app)

# --- Spark session ---
spark = None
def create_spark_session():
    global spark
    if spark is None:
        spark = SparkSession.builder \
            .appName("TarimTahminAPI") \
            .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
            .getOrCreate()
    return spark

def load_soil_data():
    """Try HDFS first, fallback to local CSV."""
    try:
        sdf = create_spark_session().read.csv(HDFS_DATA_PATH, header=True, inferSchema=True)
        df = sdf.toPandas()
        app.logger.info(f"Loaded soil data from HDFS ({len(df)} rows).")
    except Exception as e:
        app.logger.warning(f"HDFS load failed ({e}); trying local CSV.")
        if os.path.exists(LOCAL_DATA_PATH):
            df = pd.read_csv(LOCAL_DATA_PATH)
            app.logger.info(f"Loaded soil data from local CSV ({len(df)} rows).")
        else:
            app.logger.error("Soil data not found locally either.")
            df = pd.DataFrame()
    return df

# --- Model persistence ---
nb_model = None

def train_and_persist_model():
    global nb_model
    df = pd.read_csv(CSV_DATA_PATH)
    df = df.rename(columns={
        'ph': 'soil_ph',
        'rainfall': 'rainfall_mm',
        'temperature': 'temperature_celsius'
    })
    missing = [c for c in FEATURE_COLS + [LABEL_COL] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing columns after rename: {missing}")
    X = df[FEATURE_COLS]
    y = df[LABEL_COL]
    nb_model = GaussianNB().fit(X, y)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(nb_model, f)
    app.logger.info("Trained and saved Naive Bayes model.")

def load_model():
    global nb_model
    if nb_model is not None:
        return
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            nb_model = pickle.load(f)
        app.logger.info("Loaded Naive Bayes model from disk.")
    else:
        train_and_persist_model()

with app.app_context():
    load_model()

# --- Endpoints ---
@app.route('/api/provinces', methods=['GET'])
def get_provinces():
    df = load_soil_data()
    if df.empty:
        return jsonify({'error': 'Soil data unavailable'}), 500
    recs = df[['province_id', 'province_name']].drop_duplicates().to_dict('records')
    return jsonify(recs)

@app.route('/api/province/<int:province_id>', methods=['GET'])
def get_province_data(province_id):
    df = load_soil_data()
    row = df[df['province_id'] == province_id]
    if row.empty:
        return jsonify({'error': 'Province not found'}), 404

    soil_ph = float(row.iloc[0]['soil_ph'])
    province_name = row.iloc[0]['province_name']

    # Weather
    try:
        resp = requests.get(WEATHER_API_URL, params={
            'access_key': WEATHERSTACK_KEY,
            'query': province_name
        })
        weather = resp.json().get('current', {})
        temperature = weather.get('temperature', 0.0)
        rainfall = weather.get('precip', 0.0)
    except Exception as e:
        app.logger.error(f"Weather API failed: {e}")
        temperature = None
        rainfall = None

    load_model()
    features = [[
        soil_ph,
        float(rainfall) if rainfall is not None else 0.0,
        float(temperature) if temperature is not None else 0.0
    ]]
    try:
        pred = nb_model.predict(features)[0]
    except Exception as e:
        app.logger.error(f"Prediction failed: {e}")
        pred = None

    return jsonify({
        'province_id': province_id,
        'province_name': province_name,
        'soil_ph': soil_ph,
        'temperature_celsius': temperature,
        'rainfall_mm': rainfall,
        'recommended_crop': pred
    })

@app.route('/api/predict', methods=['POST'])
def predict_crop():
    load_model()
    payload = request.get_json(force=True)
    data = {
        'soil_ph': payload.get('ph', payload.get('soil_ph')),
        'rainfall_mm': payload.get('rainfall', payload.get('rainfall_mm')),
        'temperature_celsius': payload.get('temperature', payload.get('temperature_celsius')),
    }
    missing = [c for c in FEATURE_COLS if data.get(c) is None]
    if missing:
        return jsonify({'error': f'Missing features: {missing}'}), 400
    try:
        features = [[float(data[c]) for c in FEATURE_COLS]]
    except ValueError:
        return jsonify({'error': 'Feature values must be numeric'}), 400
    try:
        pred = nb_model.predict(features)[0]
    except Exception as e:
        app.logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Prediction failed'}), 500
    return jsonify({'predicted_crop': pred, 'input': data})

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'model_ready': nb_model is not None})

@app.route('/api/accuracy', methods=['GET'])
def get_accuracy():
    df = pd.read_csv(CSV_DATA_PATH)
    df = df.rename(columns={
        'ph': 'soil_ph',
        'rainfall': 'rainfall_mm',
        'temperature': 'temperature_celsius'
    })
    score = nb_model.score(df[FEATURE_COLS], df[LABEL_COL])
    return jsonify({'accuracy': round(score * 100, 2)})

@app.route('/api/hadoop/status', methods=['GET'])
def hadoop_status():
    try:
        spark = create_spark_session()
        count = spark.read.csv(HDFS_DATA_PATH, header=True, inferSchema=True).count()
        return jsonify({'status': 'connected', 'message': f'HDFS accessible: {count} rows'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
