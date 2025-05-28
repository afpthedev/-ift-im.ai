import React from 'react';
import { useDataContext } from './DataContext'; // Import the custom hook
import PropTypes from 'prop-types';

function ProvinceData() {
  const { provinceData, loading, error } = useDataContext(); // Consume context

  // Function to render weather icons (moved from App.js)
  const renderWeatherIcons = (icons) => {
    if (!icons || icons.length === 0) {
      return null;
    }
    return icons.map((icon, index) => (
      <img key={index} src={icon} alt="Weather icon" className="weather-icon" />
    ));
  };

  if (loading) {
 return (
 <div className="loading-container">
 <div className="loading-spinner"></div>
 </div>
 );
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!provinceData) {
    return null; // Or a default message if no province is selected
  }

  return (
    <div className="province-data">
      <h2>{provinceData.province_name} İli Tarım Verileri</h2>
      <div className="data-grid">
        <div className="data-card data-card-large">
          <h3>Temel Tarım Verileri</h3>
          <div className="basic-agriculture-data">
            <div className="data-item">
              <h4>Toprak pH</h4>
              <p className="data-value">{provinceData.soil_ph !== null ? provinceData.soil_ph : 'Veri mevcut değil'}</p>
            </div>
            <div className="data-item">
              <h4>Yağış (mm)</h4>
              <p className="data-value">{provinceData.rainfall_mm !== null ? `${provinceData.rainfall_mm} mm` : 'Veri mevcut değil'}</p>
            </div>
            <div className="data-item">
              <h4>Sıcaklık (°C)</h4>
              <p className="data-value">{provinceData.temperature_celsius !== null ? `${provinceData.temperature_celsius} °C` : 'Veri mevcut değil'}</p>
            </div>
            <div className="data-item">
              <h4>Önerilen Ürün</h4>
              <p className="data-value">{provinceData.predicted_crop !== null ? provinceData.predicted_crop : 'Veri mevcut değil'}</p>
            </div>
          </div>
        </div>

        <div className="data-card data-card-weather">
          <h3>Hava Durumu</h3>
          {provinceData.weather && Object.keys(provinceData.weather).length > 0 ? (
            <div className="weather-data">
              <div className="weather-icons">
                {renderWeatherIcons(provinceData.weather.weather_icons)}
              </div>
              <div className="data-item">
                <h4>Durum</h4>
                <p className="data-value">
                  {provinceData.weather.weather_descriptions && provinceData.weather.weather_descriptions.length > 0
                    ? provinceData.weather.weather_descriptions.join(', ')
                    : 'Veri Yok'}
                </p>
              </div>
              <div className="data-item">
                <h4>Sıcaklık (°C)</h4>
                <p className="data-value">{provinceData.weather.temperature !== null ? `${provinceData.weather.temperature} °C` : 'Veri Yok'}</p>
              </div>
              <div className="data-item">
                <h4>Hissedilen (°C)</h4>
                <p className="data-value">{provinceData.weather.feelslike !== null ? `${provinceData.weather.feelslike} °C` : 'Veri Yok'}</p>
              </div>
              <div className="data-item">
                <h4>Nem (%)</h4>
                <p className="data-value">{provinceData.weather.humidity !== null ? `${provinceData.weather.humidity} %` : 'Veri Yok'}</p>
              </div>
              {/* Add more weather metrics here if available */}
            </div>
          ) : (
            <p className="data-value">Hava durumu verisi mevcut değil.</p>
          )}
        </div>

        <div className="data-card data-card-airquality">
          <h3>Hava Kalitesi</h3>
          {provinceData.air_quality && Object.keys(provinceData.air_quality).length > 0 ? (
            <div className="air-quality-data">
              <div className="data-item">
                <h4>AQI</h4>
                <p className="data-value">{provinceData.air_quality.aqi !== null ? provinceData.air_quality.aqi : 'Veri Yok'}</p>
              </div>
              {/* Add more air quality metrics here if available */}
            </div>
          ) : (<p className="data-value">Hava kalitesi verisi mevcut değil.</p>)}
        </div>
      </div>
    </div>
  );
}

ProvinceData.propTypes = {
  provinceData: PropTypes.shape({
    province_id: PropTypes.number,
    province_name: PropTypes.string,
    soil_ph: PropTypes.number,
    rainfall_mm: PropTypes.number,
    temperature_celsius: PropTypes.number,
    predicted_crop: PropTypes.string,
    weather: PropTypes.shape({
      weather_icons: PropTypes.arrayOf(PropTypes.string),
      weather_descriptions: PropTypes.arrayOf(PropTypes.string),
      temperature: PropTypes.number,
      feelslike: PropTypes.number,
      humidity: PropTypes.number,
    }),
    air_quality: PropTypes.object, // Define more specific shape if needed
  }),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};
export default ProvinceData;