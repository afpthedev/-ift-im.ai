import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
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

  // İlleri API'den yükle ve Sistem durumunu kontrol et
  useEffect(() => {
    /**
     * Fetches the list of provinces and checks the system status (API and Hadoop).
     * @async
     * @function fetchData
     * @returns {Promise<void>}
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        const provincesResponse = await axios.get('http://localhost:5000/api/provinces');
        setProvinces(provincesResponse.data);

        const healthResponse = await axios.get('http://localhost:5000/api/health');
        const hadoopResponse = await axios.get('http://localhost:5000/api/hadoop/status');

        setSystemStatus({
          api: healthResponse.data,
          hadoop: hadoopResponse.data
        });
        setLoading(false);
      } catch (err) {
        let errorMessage = 'Veriler yüklenirken bir hata oluştu';
        if (err.response) {
          errorMessage = `API hatası: ${err.response.status} - ${err.response.statusText}`;
        } else if (err.request) {
          errorMessage = 'Ağ hatası: Sunucuya ulaşılamıyor.';
        } else {
          errorMessage = `Beklenmeyen hata: ${err.message}`;
        }
        setError(errorMessage);
        setLoading(false);
        console.error('Initial data fetch error:', err);
        setSystemStatus({ error: errorMessage });
      }
    };

    fetchData();
  }, []);

  // Fetch province data when selected province changes
  useEffect(() => {
    /**
     * Fetches detailed agricultural and weather data for a selected province.
     * @async
     * @function fetchProvinceData
     * @returns {Promise<void>}
     * @property {number} selectedProvince - The ID of the selected province.
     */
    const fetchProvinceData = async () => {
      if (!selectedProvince) {
        setProvinceData(null); // Clear province data when no province is selected
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/province/${selectedProvince}`);
        setProvinceData(response.data);
        setLoading(false);
      } catch (err) {
        let errorMessage = 'İl verileri yüklenirken bir hata oluştu';
        if (err.response) {
          errorMessage = `API hatası: ${err.response.status} - ${err.response.statusText}`;
        } else if (err.request) {
          errorMessage = 'Ağ hatası: İl verileri sunucusuna ulaşılamıyor.';
        } else {
          errorMessage = `Beklenmeyen hata: ${err.message}`;
        }
        setError(errorMessage);
        setLoading(false);
        console.error('İl verileri yüklenirken hata:', err);
      }
    };

    fetchProvinceData();
  }, [selectedProvince]);

  // Predict form input handler
  const handlePredictInputChange = (e) => {
    const { name, value } = e.target;
    setPredictForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Predict form submit handler
  /**
   * Submits the predict form data to the backend API for crop prediction.
   * @async
   * @function handlePredictSubmit
   * @param {Object} e - The form submission event object.
   * @returns {Promise<void>}
   * @property {Object} predictForm - The current state of the predict form (soil_ph, rainfall_mm, temperature_celsius).
   */
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
      let errorMessage = 'Tahmin yapılırken bir hata oluştu';
      if (err.response) {
        errorMessage = `Tahmin API hatası: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = 'Ağ hatası: Tahmin servisine ulaşılamıyor.';
      } else {
        errorMessage = `Beklenmeyen tahmin hatası: ${err.message}`;
      }
      setPredictError(errorMessage);
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


  return (
    <DataContext.Provider
      value={{
        provinces,
        selectedProvince,
        setSelectedProvince,
        provinceData,
        loading,
        error,
        systemStatus,
        predictForm,
        handlePredictInputChange,
        handlePredictSubmit,
        resetPredictForm,
        predictResult,
        predictLoading,
        predictError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => useContext(DataContext);