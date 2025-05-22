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
        </div>
      </div>

      <footer className="App-footer">
        <p>Hadoop, Spark, Flask ve React ile geliştirilmiş Tarım Tahmin Uygulaması &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;
