import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { Routes, Route, NavLink } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import turkeyGeoJson from './turkey-provinces.json';
import About from './About'; // Eğer About.js'iniz yoksa bu satırı kaldırın

// English -> Turkish map
const cropMap = {
  rice: 'Pirinç',
  maize: 'Mısır',
  chickpea: 'Nohut',
  kidneybeans: 'Barbunya',
  pigeonpeas: 'Bezelye',
  mungbean: 'Mung Fasulyesi',
  blackgram: 'Kara Fasulye',
  lentil: 'Mercimek',
  pomegranate: 'Nar',
  banana: 'Muz',
  mango: 'Mango',
  grapes: 'Üzüm',
  watermelon: 'Karpuz',
  coconut: 'Hindistan Cevizi',
  cotton: 'Pamuk',
  muskmelon: 'Kavun',
  apple: 'Elma',
  mothbeans : 'Güve Fasulyesi'
};

// LabelEncoder.classes_ (alphabetical) -> index mapping
const cropClasses = [
  'apple', 'banana', 'blackgram', 'chickpea', 'grapes',
  'kidneybeans', 'lentil', 'maize', 'mango', 'muskmelon', 'coconut', 'cotton',
  'pomegranate', 'rice', 'watermelon'
];

function App() {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [provinceData, setProvinceData] = useState(null);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [errorProvince, setErrorProvince] = useState(null);
  const [systemStatus, setSystemStatus] = useState({});
  const [accuracy, setAccuracy] = useState(null);

  const [predictForm, setPredictForm] = useState({
    soil_ph: '',
    rainfall_mm: '',
    temperature_celsius: ''
  });
  const [predictResult, setPredictResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  // Fetch provinces and system status
  useEffect(() => {
    axios.get('http://localhost:5000/api/provinces')
      .then(res => setProvinces(res.data))
      .catch(err => console.error('İller yüklenirken hata:', err));

    Promise.all([
      axios.get('http://localhost:5000/api/health'),
      axios.get('http://localhost:5000/api/hadoop/status'),
      axios.get('http://localhost:5000/api/accuracy')
    ])
      .then(([healthRes, hadoopRes, accRes]) => {
        setSystemStatus({ api: healthRes.data, hadoop: hadoopRes.data });
        setAccuracy(accRes.data.accuracy);
      })
      .catch(err => {
        console.error('Sistem durumu yüklenirken hata:', err);
        setSystemStatus({ error: 'Sistem durumu alınamadı' });
      });
  }, []);

  // Fetch selected province data
  useEffect(() => {
    if (!selectedProvince) return;
    setLoadingProvince(true);
    axios.get(`http://localhost:5000/api/province/${selectedProvince}`)
      .then(res => {
        setProvinceData(res.data);
        setErrorProvince(null);
      })
      .catch(err => {
        console.error('İl verisi yüklenirken hata:', err);
        setErrorProvince('İl verisi yüklenirken hata oluştu');
      })
      .finally(() => setLoadingProvince(false));
  }, [selectedProvince]);

  const handleProvinceSelect = e => {
    setSelectedProvince(e.target.value);
    setProvinceData(null);
  };

  const handlePredictInputChange = e => {
    const { name, value } = e.target;
    setPredictForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePredictSubmit = e => {
    e.preventDefault();
    const { soil_ph, rainfall_mm, temperature_celsius } = predictForm;

    if (!soil_ph || !rainfall_mm || !temperature_celsius) {
      setPredictError('Lütfen tüm alanları doldurun');
      return;
    }

    setPredictLoading(true);
    setPredictError(null);

    console.log('Sending prediction request:', {
      soil_ph: parseFloat(soil_ph),
      rainfall_mm: parseFloat(rainfall_mm),
      temperature_celsius: parseFloat(temperature_celsius)
    });

    axios.post('http://localhost:5000/api/predict', {
      soil_ph: parseFloat(soil_ph),
      rainfall_mm: parseFloat(rainfall_mm),
      temperature_celsius: parseFloat(temperature_celsius)
    })
      .then(res => {
        console.log('Prediction response:', res.data);
        setPredictResult(res.data);
        setPredictError(null);
      })
      .catch(err => {
        console.error('Predict error:', err);
        const errorMessage = err.response?.data?.error || 'Tahmin başarısız';
        setPredictError(errorMessage);
        setPredictResult(null);
      })
      .finally(() => setPredictLoading(false));
  };

  const resetPredictForm = () => {
    setPredictForm({ soil_ph: '', rainfall_mm: '', temperature_celsius: '' });
    setPredictResult(null);
    setPredictError(null);
  };

  const getCropNameInTurkish = (cropName) => {
    return cropMap[cropName] || cropName;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Tarım Tahmin Uygulaması</h1>
        <p>Türkiye haritasından bir il seçerek verileri görüntüleyin</p>
        {accuracy && (
          <div className="accuracy-badge" style={{
            background: '#4CAF50',
            color: 'white',
            padding: '5px 15px',
            borderRadius: '20px',
            fontSize: '14px',
            marginTop: '10px'
          }}>
            Model Doğruluğu: %{accuracy}
          </div>
        )}
      </header>

      <nav className="main-nav">
        <ul>
          <li>
            <NavLink to="/" end>Ana Sayfa</NavLink>
          </li>
          <li>
            <NavLink to="/about">Bu Proje Ne İşe Yarar?</NavLink>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <>
              {/* Harita */}
              <div
                className="map-container"
                style={{
                  width: '100%',
                  height: '500px',
                  margin: '20px 0',
                  border: '3px solid #0ff',
                  borderRadius: '4px',
                }}
              >
                <MapContainer
                  center={[39, 35]}
                  zoom={6}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <GeoJSON
                    data={turkeyGeoJson}
                    style={feature => ({
                      fillColor:
                        selectedProvince == feature.properties.id
                          ? '#4CAF50'
                          : '#3388ff',
                      weight: 2,
                      opacity: 1,
                      color: 'white',
                      dashArray: '3',
                      fillOpacity: 0.7,
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.on({ click: () => setSelectedProvince(feature.properties.id) });
                      layer.bindTooltip(feature.properties.name);
                    }}
                  />
                </MapContainer>
              </div>

              {/* Form bölümleri */}
              <div className="forms-wrapper">
                <div className="province-selector">
                  <h2>İl Seçimi</h2>
                  <select onChange={handleProvinceSelect} value={selectedProvince || ''}>
                    <option value="">-- Seçiniz --</option>
                    {provinces.map(p => (
                      <option key={p.province_id} value={p.province_id}>
                        {p.province_name}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingProvince && <p>Yükleniyor...</p>}
                {errorProvince && <p className="error">{errorProvince}</p>}

                {provinceData && (
                  <div className="province-data">
                    <h2>{provinceData.province_name} İli Verileri</h2>
                    <div className="data-card">
                      <div><strong>Toprak pH:</strong> {provinceData.soil_ph}</div>
                      <div><strong>Yağış (mm):</strong> {provinceData.rainfall_mm}</div>
                      <div><strong>Sıcaklık (°C):</strong> {provinceData.temperature_celsius}</div>
                    </div>
                    <div className="prediction-card">
                      <h3>Önerilen Ürün</h3>
                      {(() => {
                        // Check if recommended_crop is a string (direct crop name) or a number (index)
                        const crop = provinceData.recommended_crop;
                        if (crop === null || crop === undefined) {
                          return <p className="prediction">Veri bulunamadı</p>;
                        }
                        
                        let cropName;
                        if (typeof crop === 'number' || !isNaN(parseInt(crop))) {
                          // If it's a number, use it as an index to cropClasses
                          const idx = parseInt(crop);
                          cropName = cropClasses[idx];
                        } else {
                          // If it's a string, use it directly
                          cropName = crop;
                        }
                        
                        return <p className="prediction">{getCropNameInTurkish(cropName)}</p>;
                      })()}
                    </div>
                  </div>
                )}

                <div className="predict-section">
                  <h2>Manuel Tahmin Yap</h2>
                  <p>Aşağıdaki form alanlarını doldurarak, girdiğiniz verilere göre en uygun tarım ürününü tahmin edebilirsiniz.</p>

                  <form onSubmit={handlePredictSubmit} className="predict-form">
                    <div className="form-group">
                      <label htmlFor="soil_ph">Toprak pH (0-14):</label>
                      <input
                        type="number"
                        id="soil_ph"
                        name="soil_ph"
                        value={predictForm.soil_ph}
                        onChange={handlePredictInputChange}
                        step="0.1"
                        min="0"
                        max="14"
                        placeholder="Örn: 6.5"
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
                        placeholder="Örn: 200"
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
                        placeholder="Örn: 25"
                      />
                    </div>
                    <div className="form-buttons">
                      <button type="submit" disabled={predictLoading}>
                        {predictLoading ? 'Tahmin Yapılıyor...' : 'Tahmin Yap'}
                      </button>
                      <button type="button" onClick={resetPredictForm}>
                        Temizle
                      </button>
                    </div>
                  </form>

                  {predictError && (
                    <div className="error" style={{
                      background: '#ffebee',
                      color: '#c62828',
                      padding: '10px',
                      borderRadius: '4px',
                      marginTop: '10px'
                    }}>
                      Hata: {predictError}
                    </div>
                  )}

                  {predictResult && predictResult.success && (
                    <div className="predict-result">
                      <h3>🌱 Tahmin Sonucu</h3>
                      <div className="result-card">
                        <div className="result-item" style={{
                          background: '#4CAF50',
                          color: 'white',
                          padding: '15px',
                          borderRadius: '6px',
                          marginBottom: '15px'
                        }}>
                          <h4>Önerilen Ürün:</h4>
                          <p className="result-value" style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            margin: '5px 0'
                          }}>
                            {getCropNameInTurkish(predictResult.predicted_crop_name)}
                          </p>
                        </div>

                        <div className="accuracy-info">
                          <h4>Model Performansı:</h4>
                          <p>Doğruluk Oranı: <strong>%{predictResult.model_accuracy}</strong></p>
                          <p>Güven Seviyesi: <strong>{predictResult.confidence}</strong></p>
                        </div>

                        <div className="input-summary">
                          <h4>Girilen Değerler:</h4>
                          <p><strong>pH:</strong> {predictResult.input.soil_ph}</p>
                          <p><strong>Yağış:</strong> {predictResult.input.rainfall_mm} mm</p>
                          <p><strong>Sıcaklık:</strong> {predictResult.input.temperature_celsius} °C</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          }
        />
        <Route path="/about" element={<About />} />
      </Routes>

      <footer className="App-footer">
        <p>Hadoop, Spark, Flask &amp; React ile Tarım Tahmin © 2025</p>
      </footer>
    </div>
  );
}

export default App;