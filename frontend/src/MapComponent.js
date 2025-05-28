import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import PropTypes from 'prop-types'; // Import PropTypes
import { useDataContext } from './DataContext'; // Import the hook

const MapComponent = ({ turkeyGeoJson }) => {
  const mapRef = useRef(null); // Use useRef to hold the map instance
  const { selectedProvince, setSelectedProvince } = useDataContext(); // Consume state and function from context

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
        setSelectedProvince(provinceId); // Use setSelectedProvince from context
      }
    });

    layer.bindTooltip(provinceName);
  };

  // Pan map to selected province when selectedProvince changes
  useEffect(() => {
    if (mapRef.current && selectedProvince !== null) {
      const selectedFeature = turkeyGeoJson.features.find(
        feature => feature.properties.id === selectedProvince
      );

      if (selectedFeature) {
        const layer = L.geoJSON(selectedFeature);
        mapRef.current.fitBounds(layer.getBounds());
      }
    }
  }, [selectedProvince, turkeyGeoJson]); // Depend on selectedProvince and turkeyGeoJson

  return (
    <MapContainer
      center={[39.0, 35.0]}
      zoom={6}
      style={{ height: '500px', width: '100%' }}
      whenCreated={mapInstance => { mapRef.current = mapInstance; }} // Get map instance
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
  );
};

MapComponent.propTypes = {
  selectedProvince: PropTypes.number, // selectedProvince is now consumed from context
  setSelectedProvince: PropTypes.func, // setSelectedProvince is now consumed from context
  turkeyGeoJson: PropTypes.object.isRequired, // turkeyGeoJson is still passed as a prop
};
export default MapComponent;