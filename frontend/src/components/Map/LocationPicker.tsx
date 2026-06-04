import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { Location, TMYData } from '../../types';
import { usePVGIS } from '../../hooks/usePVGIS';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  location: Location;
  onChange: (loc: Location) => void;
  onTmyLoaded: (tmy: TMYData | null) => void;
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ location, onChange, onTmyLoaded }: LocationPickerProps) {
  const { fetchTMY, loading, error } = usePVGIS();
  const [lat, setLat] = useState(location.latitude.toString());
  const [lon, setLon] = useState(location.longitude.toString());

  const handleMapClick = useCallback((clickLat: number, clickLng: number) => {
    const newLat = clickLat.toFixed(4);
    const newLon = clickLng.toFixed(4);
    setLat(newLat);
    setLon(newLon);
    onChange({
      latitude: parseFloat(newLat),
      longitude: parseFloat(newLon),
      elevation: 0,
    });
  }, [onChange]);

  const handleCoordChange = (newLat: string, newLon: string) => {
    setLat(newLat);
    setLon(newLon);
    const parsedLat = parseFloat(newLat);
    const parsedLon = parseFloat(newLon);
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      onChange({ latitude: parsedLat, longitude: parsedLon, elevation: 0 });
    }
  };

  const handleFetch = async () => {
    const newLoc: Location = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      elevation: 0,
    };
    onChange(newLoc);
    const data = await fetchTMY(newLoc);
    if (data) {
      onTmyLoaded(data);
    }
  };

  return (
    <div className="space-y-3">
      <div className="w-full h-44 rounded-lg overflow-hidden border border-neutral-700">
        <MapContainer
          center={[parseFloat(lat) || 40.4, parseFloat(lon) || -3.7]}
          zoom={4}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker position={[parseFloat(lat) || 40.4, parseFloat(lon) || -3.7]} />
          <MapClickHandler onSelect={handleMapClick} />
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-neutral-500 block mb-0.5">Latitude</label>
          <input
            type="number"
            step="0.01"
            value={lat}
            onChange={(e) => handleCoordChange(e.target.value, lon)}
            className="w-full px-2.5 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-0.5">Longitude</label>
          <input
            type="number"
            step="0.01"
            value={lon}
            onChange={(e) => handleCoordChange(lat, e.target.value)}
            className="w-full px-2.5 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="w-full py-2.5 px-3 text-sm font-medium rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Fetching irradiance data...' : 'Load Solar Data for This Location'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
