import os
import pickle
import requests
import pandas as pd

from flask import Flask, jsonify, request
from flask_cors import CORS
from pyspark.sql import SparkSession

# --- Configuration ---
CSV_DATA_PATH     = "/mnt/data/Crop_recommendation.csv"
MODEL_PATH        = "data/models/naive_bayes_model.pkl"
FEATURE_COLS      = ['soil_ph', 'rainfall_mm', 'temperature_celsius']
LABEL_COL         = 'label'

HDFS_DATA_PATH    = "hdfs://namenode:9000/user/hadoop/agri_predict/raw/fake_agricultural_data.csv"
LOCAL_DATA_PATH   = "../data/raw/fake_agricultural_data.csv"

WEATHERSTACK_KEY  = 'ff78c869ec8eb45895ed86afcf2d08c9'
WEATHER_API_URL   = 'http://api.weatherstack.com/current'

# --- Flask setup ---
app = Flask(__name__)
CORS(app)

# Spark session placeholder
spark = None

def create_spark_session():
    """Create or retrieve Spark session for HDFS data."""
    global spark
    if spark is None:
        spark = SparkSession.builder \
            .appName("TarimTahminAPI") \
            .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
            .getOrCreate()
    return spark


def load_soil_data():
    """Load soil data from HDFS, fallback to local CSV."""
    try:
        sdf = create_spark_session().read.csv(
            HDFS_DATA_PATH, header=True, inferSchema=True
        )
        df = sdf.toPandas()
        app.logger.info(f"Loaded soil data from HDFS ({len(df)} rows)")
    except Exception as e:
        app.logger.warning(f"HDFS load failed: {e}, trying local CSV")
        if os.path.exists(LOCAL_DATA_PATH):
            df = pd.read_csv(LOCAL_DATA_PATH)
            app.logger.info(f"Loaded soil data from local CSV ({len(df)} rows)")
        else:
            app.logger.error("Soil data not found on local path")
            df = pd.DataFrame()
    return df

# --- Naive Bayes model ---
from sklearn.naive_bayes import GaussianNB
nb_model = None

def train_and_persist_model():
    """Train and save GaussianNB on CSV_DATA_PATH."""
    global nb_model
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
        pickle.dump(nb_model, f)
    app.logger.info("Trained and persisted Naive Bayes model.")


def load_model():
    """Load persisted model or train if missing."""
    global nb_model
    if nb_model is not None:
        return
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            loaded = pickle.load(f)
        nb_model = loaded
        app.logger.info("Loaded Naive Bayes model from disk.")
    else:
        train_and_persist_model()

# Bootstrap model once
with app.app_context():
    load_model()

# --- API Endpoints ---
@app.route('/api/provinces', methods=['GET'])
def get_provinces():
    """Return list of unique provinces."""
    df = load_soil_data()
    if df.empty:
        return jsonify({'error': 'Soil data unavailable'}), 500
    recs = df[['province_id', 'province_name']].drop_duplicates().to_dict('records')
    return jsonify(recs)

@app.route('/api/province/<int:province_id>', methods=['GET'])
def get_province_data(province_id):
    """Return soil, weather and recommended_crop for a province."""
    df = load_soil_data()
    row = df[df['province_id'] == province_id]
    if row.empty:
        return jsonify({'error': 'Province not found'}), 404

    # Soil pH and name
    soil_ph = float(row.iloc[0]['soil_ph'])
    province_name = row.iloc[0]['province_name']

    # Live weather
    try:
        resp = requests.get(
            WEATHER_API_URL,
            params={'access_key': WEATHERSTACK_KEY, 'query': province_name}
        )
        weather = resp.json().get('current', {})
        temperature = weather.get('temperature', 0.0)
        rainfall = weather.get('precip', 0.0)
    except Exception as e:
        app.logger.error(f"Weather API failed: {e}")
        temperature = None
        rainfall = None

    # Predict recommended crop
    load_model()
    features = [[
        soil_ph,
        float(rainfall) if rainfall is not None else 0.0,
        float(temperature) if temperature is not None else 0.0
    ]]
    try:
        pred = nb_model.predict(features)[0]
        # If pred is numeric, map to label strings here:
        # label_map = {0: 'Buğday', 1: 'Mısır', 2: 'Arpa', ...}
        # pred = label_map.get(pred, str(pred))
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
    """Predict crop from three features via local model."""
    load_model()
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({'error': 'Invalid JSON payload'}), 400

    missing = [c for c in FEATURE_COLS if c not in data]
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

from sklearn.metrics import accuracy_score
@app.route('/api/accuracy', methods=['GET'])
def get_accuracy():
    # CSV'i test setine ayırın ya da tüm veriyle score alın:
    df = pd.read_csv(CSV_DATA_PATH)
    X = df[FEATURE_COLS]
    y = df[LABEL_COL]
    # Eğer test setiniz varsa, onunla:
    # X_train, X_test, y_train, y_test = train_test_split(...)
    # score = nb_model.score(X_test, y_test)
    score = nb_model.score(X, y)
    return jsonify({'accuracy': round(score * 100, 2)})  # yüzde cinsinden, 2 ondalık


@app.route('/api/hadoop/status', methods=['GET'])
def hadoop_status():
    try:
        spark = create_spark_session()
        count = spark.read.csv(
            HDFS_DATA_PATH, header=True, inferSchema=True
        ).count()
        return jsonify({'status': 'connected', 'message': f'HDFS accessible: {count} rows'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
