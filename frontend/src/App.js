import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import turkeyGeoJson from './turkey-provinces.json';

function App() {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [provinceData, setProvinceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemStatus, setSystemStatus] = useState({});

  // Predict form state
  const [predictForm, setPredictForm] = useState({
    soil_ph: '',
    rainfall_mm: '',
    temperature_celsius: ''
  });
  const [predictResult, setPredictResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  // İlleri API'den yükle
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/provinces');
        setProvinces(response.data);
        setLoading(false);
      } catch (err) {
        setError('İller yüklenirken bir hata oluştu');
        setLoading(false);
        console.error('İller yüklenirken hata:', err);
      }
    };

    fetchProvinces();

    // Sistem durumunu kontrol et
    const checkSystemStatus = async () => {
      try {
        const healthResponse = await axios.get('http://localhost:5000/api/health');
        const hadoopResponse = await axios.get('http://localhost:5000/api/hadoop/status');

        setSystemStatus({
          api: healthResponse.data,
          hadoop: hadoopResponse.data
        });
      } catch (err) {
        console.error('Sistem durumu kontrol edilirken hata:', err);
        setSystemStatus({
          error: 'Sistem durumu kontrol edilirken hata oluştu'
        });
      }
    };

    checkSystemStatus();
  }, []);

  // Seçilen il değiştiğinde il verilerini yükle
  useEffect(() => {
    const fetchProvinceData = async () => {
      if (!selectedProvince) return;

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/province/${selectedProvince}`);
        setProvinceData(response.data);
        setLoading(false);
      } catch (err) {
        setError('İl verileri yüklenirken bir hata oluştu');
        setLoading(false);
        console.error('İl verileri yüklenirken hata:', err);
      }
    };

    fetchProvinceData();
  }, [selectedProvince]);

  // İl seçimi işleyicisi
  const handleProvinceSelect = (e) => {
    setSelectedProvince(parseInt(e.target.value));
  };

  // Predict form input handler
  const handlePredictInputChange = (e) => {
    const { name, value } = e.target;
    setPredictForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Predict form submit handler
  const handlePredictSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    if (!predictForm.soil_ph || !predictForm.rainfall_mm || !predictForm.temperature_celsius) {
      setPredictError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setPredictLoading(true);
      setPredictError(null);

      const response = await axios.post('http://localhost:5000/api/predict', {
        soil_ph: parseFloat(predictForm.soil_ph),
        rainfall_mm: parseFloat(predictForm.rainfall_mm),
        temperature_celsius: parseFloat(predictForm.temperature_celsius)
      });

      setPredictResult(response.data);
      setPredictLoading(false);
    } catch (err) {
      setPredictError('Tahmin yapılırken bir hata oluştu');
      setPredictLoading(false);
      console.error('Predict error:', err);
    }
  };

  // Reset predict form
  const resetPredictForm = () => {
    setPredictForm({
      soil_ph: '',
      rainfall_mm: '',
      temperature_celsius: ''
    });
    setPredictResult(null);
    setPredictError(null);
  };

  // GeoJSON stil fonksiyonu
  const provinceStyle = (feature) => {
    const provinceId = feature.properties.id;
    return {
      fillColor: selectedProvince === provinceId ? '#4CAF50' : '#3388ff',
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // GeoJSON tıklama işleyicisi
  const onEachFeature = (feature, layer) => {
    const provinceId = feature.properties.id;
    const provinceName = feature.properties.name;

    layer.on({
      click: () => {
        setSelectedProvince(provinceId);
      }
    });

    layer.bindTooltip(provinceName);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Tarım Tahmin Uygulaması</h1>
        <p>Türkiye haritasından bir il seçerek tarımsal verileri ve ürün tahminlerini görüntüleyin</p>
      </header>

      <div className="system-status">
        <h3>Sistem Durumu</h3>
        {systemStatus.error ? (
          <p className="error">{systemStatus.error}</p>
        ) : (
          <div className="status-container">
            <div className="status-item">
              <span>API:</span>
              <span className={systemStatus.api?.status === "healthy" ? "status-ok" : "status-error"}>
                {systemStatus.api?.status === "healthy" ? "Çalışıyor" : "Hata"}
              </span>
            </div>
            <div className="status-item">
              <span>Hadoop:</span>
              <span className={systemStatus.hadoop?.status === "connected" ? "status-ok" : "status-error"}>
                {systemStatus.hadoop?.status === "connected" ? "Bağlı" : "Bağlantı Hatası"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="container">
        <div className="map-container">
          <MapContainer
            center={[39.0, 35.0]}
            zoom={6}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <GeoJSON
              data={turkeyGeoJson}
              style={provinceStyle}
              onEachFeature={onEachFeature}
            />
          </MapContainer>
        </div>

        <div className="data-container">
          <div className="province-selector">
            <h2>İl Seçimi</h2>
            <select onChange={handleProvinceSelect} value={selectedProvince || ''}>
              <option value="">İl seçiniz</option>
              {provinces.map(province => (
                <option key={province.province_id} value={province.province_id}>
                  {province.province_name}
                </option>
              ))}
            </select>
          </div>

          {loading && <p>Yükleniyor...</p>}
          {error && <p className="error">{error}</p>}

          {provinceData && !loading && (
            <div className="province-data">
              <h2>{provinceData.province_name} İli Tarım Verileri</h2>
              <div className="data-card">
                <div className="data-item">
                  <h3>Toprak pH</h3>
                  <p className="data-value">{provinceData.soil_ph}</p>
                </div>
                <div className="data-item">
                  <h3>Yağış (mm)</h3>
                  <p className="data-value">{provinceData.rainfall_mm}</p>
                </div>
                <div className="data-item">
                  <h3>Sıcaklık (°C)</h3>
                  <p className="data-value">{provinceData.temperature_celsius}</p>
                </div>
              </div>

              <div className="prediction-card">
                <h3>Önerilen Ürün</h3>
                <p className="prediction">{provinceData.predicted_crop}</p>
              </div>
            </div>
          )}

          {/* Predict Form Section */}
          <div className="predict-section">
            <h2>Manuel Tahmin Yap</h2>
            <p>Toprak pH, yağış ve sıcaklık değerlerini girerek hangi ile uygun olduğunu öğrenin</p>

            <form onSubmit={handlePredictSubmit} className="predict-form">
              <div className="form-group">
                <label htmlFor="soil_ph">Toprak pH:</label>
                <input
                  type="number"
                  id="soil_ph"
                  name="soil_ph"
                  value={predictForm.soil_ph}
                  onChange={handlePredictInputChange}
                  step="0.1"
                  min="0"
                  max="14"
                  placeholder="Örnek: 6.5"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rainfall_mm">Yağış (mm):</label>
                <input
                  type="number"
                  id="rainfall_mm"
                  name="rainfall_mm"
                  value={predictForm.rainfall_mm}
                  onChange={handlePredictInputChange}
                  step="0.1"
                  min="0"
                  placeholder="Örnek: 500"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="temperature_celsius">Sıcaklık (°C):</label>
                <input
                  type="number"
                  id="temperature_celsius"
                  name="temperature_celsius"
                  value={predictForm.temperature_celsius}
                  onChange={handlePredictInputChange}
                  step="0.1"
                  placeholder="Örnek: 25"
                  required
                />
              </div>

              <div className="form-buttons">
                <button type="submit" disabled={predictLoading} className="predict-button">
                  {predictLoading ? 'Tahmin Yapılıyor...' : 'Tahmin Yap'}
                </button>
                <button type="button" onClick={resetPredictForm} className="reset-button">
                  Temizle
                </button>
              </div>
            </form>

            {predictError && <p className="error">{predictError}</p>}

            {predictResult && (
              <div className="predict-result">
                <h3>Tahmin Sonucu</h3>
                <div className="result-card">
                  <div className="result-item">
                    <h4>Önerilen İl:</h4>
                    <p className="result-value">{predictResult.predicted_province_name}</p>
                  </div>
                  <div className="result-item">
                    <h4>İl ID:</h4>
                    <p className="result-value">{predictResult.predicted_province_id}</p>
                  </div>
                  <div className="input-summary">
                    <h4>Girilen Değerler:</h4>
                    <p>pH: {predictResult.input_data.soil_ph}</p>
                    <p>Yağış: {predictResult.input_data.rainfall_mm} mm</p>
                    <p>Sıcaklık: {predictResult.input_data.temperature_celsius} °C</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="App-footer">
        <p>Hadoop, Spark, Flask ve React ile geliştirilmiş Tarım Tahmin Uygulaması &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;