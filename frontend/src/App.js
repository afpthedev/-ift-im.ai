import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import turkeyGeoJson from './turkey-provinces.json';
import About from './About'; // Eğer About.js’iniz yoksa bu satırı kaldırın


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
  apple: 'Elma'
};

const cropClasses = [
  'apple','banana','blackgram','chickpea','grapes',
  'kidneybeans','lentil','maize','mango','muskmelon',
  'coconut','cotton','pomegranate','rice','watermelon'
];

function App() {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [provinceData, setProvinceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [systemStatus, setSystemStatus] = useState({});
  const [accuracy, setAccuracy] = useState(null);

  const [predictForm, setPredictForm] = useState({
    soil_ph: '', rainfall_mm: '', temperature_celsius: ''
  });
  const [predictResult, setPredictResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  useEffect(() => {
    axios.get('/api/provinces')
      .then(res => setProvinces(res.data))
      .catch(err => console.error(err));

    Promise.all([
      axios.get('/api/health'),
      axios.get('/api/hadoop/status'),
      axios.get('/api/accuracy')
    ]).then(([h, h2, acc]) => {
      setSystemStatus({ api: h.data, hadoop: h2.data });
      setAccuracy(acc.data.accuracy);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedProvince) return;
    setLoading(true);
    axios.get(`/api/province/${selectedProvince}`)
      .then(res => {
        setProvinceData(res.data);
        setError(null);
      })
      .catch(() => setError('İl verisi yüklenirken hata oluştu'))
      .finally(() => setLoading(false));
  }, [selectedProvince]);

  const handleProvinceSelect = e => {
    setSelectedProvince(e.target.value);
    setProvinceData(null);
  };

  const handlePredictChange = e => {
    const { name, value } = e.target;
    setPredictForm(f => ({ ...f, [name]: value }));
  };

  const handlePredictSubmit = e => {
    e.preventDefault();
    const { soil_ph, rainfall_mm, temperature_celsius } = predictForm;
    if (!soil_ph || !rainfall_mm || !temperature_celsius) {
      setPredictError('Lütfen tüm alanları doldurun');
      return;
    }
    setPredictLoading(true);
    axios.post('/api/predict', {
      soil_ph: +soil_ph,
      rainfall_mm: +rainfall_mm,
      temperature_celsius: +temperature_celsius
    })
      .then(res => {
        setPredictResult(res.data);
        setPredictError(null);
      })
      .catch(() => setPredictError('Tahmin başarısız'))
      .finally(() => setPredictLoading(false));
  };

  const resetPredict = () => {
    setPredictForm({ soil_ph: '', rainfall_mm: '', temperature_celsius: '' });
    setPredictResult(null);
    setPredictError(null);
  };

  const provinceStyle = f => ({
    fillColor: selectedProvince === f.properties.id ? '#4CAF50' : '#3388ff',
    weight: 2, opacity: 1, color: 'white', dashArray: '3', fillOpacity: 0.7
  });

  const onEachFeature = (feature, layer) => {
    layer.on({ click: () => setSelectedProvince(feature.properties.id) });
    layer.bindTooltip(feature.properties.name);
  };

  return (
    <div className="App">
      <header>
        <h1>Tarım Tahmin Uygulaması</h1>
        <nav>
          <NavLink to="/" end>Ana Sayfa</NavLink>
          <NavLink to="/about">Proje Nedir?</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={
          <main>
            <section className="map">
              <MapContainer center={[39,35]} zoom={6} style={{height:400}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON 
                  data={turkeyGeoJson} 
                  style={provinceStyle} 
                  onEachFeature={onEachFeature} 
                />
              </MapContainer>
            </section>

            <section className="data">
              <h2>İl Seçimi</h2>
              <select onChange={handleProvinceSelect} value={selectedProvince||''}>
                <option value="">-- Seçiniz --</option>
                {provinces.map(p =>
                  <option key={p.province_id} value={p.province_id}>
                    {p.province_name}
                  </option>
                )}
              </select>

              {loading && <p>Yükleniyor...</p>}
              {error && <p className="error">{error}</p>}

              {provinceData && (
                <div>
                  <h3>{provinceData.province_name}</h3>
                  <p>pH: {provinceData.soil_ph}</p>
                  <p>Yağış: {provinceData.rainfall_mm} mm</p>
                  <p>Sıcaklık: {provinceData.temperature_celsius} °C</p>
                  <p><strong>Ürün:</strong> {
                    cropMap[cropClasses[provinceData.recommended_crop]] 
                    || cropClasses[provinceData.recommended_crop]
                  }</p>
                </div>
              )}
            </section>

            <section className="predict">
              <h2>Manuel Tahmin</h2>
              <form onSubmit={handlePredictSubmit}>
                {['soil_ph','rainfall_mm','temperature_celsius'].map(name => (
                  <div key={name}>
                    <label htmlFor={name}>{name.replace('_',' ')}</label>
                    <input
                      id={name}
                      name={name}
                      type="number"
                      step="0.1"
                      value={predictForm[name]}
                      onChange={handlePredictChange}
                      required
                    />
                  </div>
                ))}
                <button type="submit" disabled={predictLoading}>
                  {predictLoading ? 'Tahmin...' : 'Tahmin Yap'}
                </button>
                <button type="button" onClick={resetPredict}>Temizle</button>
              </form>
              {predictError && <p className="error">{predictError}</p>}
              {predictResult && (
                <div>
                  <h3>Sonuç: {
                    cropMap[cropClasses[predictResult.predicted_crop]] 
                    || cropClasses[predictResult.predicted_crop]
                  }</h3>
                  <p>pH: {predictResult.input.soil_ph}</p>
                  <p>Yağış: {predictResult.input.rainfall_mm}</p>
                  <p>Sıcaklık: {predictResult.input.temperature_celsius}</p>
                </div>
              )}
            </section>
          </main>
        }/>

        <Route path="/about" element={<About />} />
      </Routes>

      <footer>
        <p>Hadoop, Spark, Flask & React © 2025</p>
      </footer>
    </div>
  );
}

export default App;