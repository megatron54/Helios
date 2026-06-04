import { useState } from 'react';
import type { Location, TMYData } from '../../types';
import { usePVGIS } from '../../hooks/usePVGIS';

interface LocationPickerProps {
  location: Location;
  onChange: (loc: Location) => void;
  onTmyLoaded: (tmy: TMYData | null) => void;
}

export default function LocationPicker({ location, onChange, onTmyLoaded }: LocationPickerProps) {
  const { fetchTMY, loading, error } = usePVGIS();
  const [lat, setLat] = useState(location.latitude.toString());
  const [lon, setLon] = useState(location.longitude.toString());

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
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-neutral-500 block mb-0.5">Latitude</label>
          <input
            type="number"
            step="0.01"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-0.5">Longitude</label>
          <input
            type="number"
            step="0.01"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            className="w-full px-2 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="w-full py-1.5 px-3 text-xs font-medium rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Loading solar data...' : 'Fetch TMY Data'}
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {location.name && <p className="text-xs text-neutral-500">{location.name}</p>}
    </div>
  );
}
