import React from 'react';
import PropTypes from 'prop-types';
import { useDataContext } from './DataContext';

function PredictForm() {
  const { predictForm, handlePredictInputChange, handlePredictSubmit, resetPredictForm, predictLoading, predictError, predictResult } = useDataContext();

  return (
    <div className="predict-section">

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

      {predictError && <p className="error-message">{predictError}</p>}

      {predictResult && (
        <div className="predict-result">
          <h3>Tahmin Sonucu</h3>
          <div className="result-card">
            <div className="result-item">
              <h4>Önerilen Ürün:</h4>
              <p className="result-value">{predictResult.predicted_crop}</p>
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
  );
}

PredictForm.propTypes = {
  predictForm: PropTypes.shape({
    soil_ph: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rainfall_mm: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    temperature_celsius: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  handlePredictInputChange: PropTypes.func.isRequired,
  handlePredictSubmit: PropTypes.func.isRequired,
  resetPredictForm: PropTypes.func.isRequired,
  predictLoading: PropTypes.bool.isRequired,
  predictError: PropTypes.string,
  predictResult: PropTypes.shape({
    predicted_crop: PropTypes.string,
    input_data: PropTypes.shape({
      soil_ph: PropTypes.number,
      rainfall_mm: PropTypes.number,
      temperature_celsius: PropTypes.number,
    }),
  }),
};


export default PredictForm;