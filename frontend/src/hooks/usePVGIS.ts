import { useRef, useState, useCallback } from 'react';
import type { Location, TMYData } from '../types';

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_3/seriescalc';

interface PVGISHourly {
  ghi: number;
  dni: number;
  dhi: number;
  temperature: number;
}

export function usePVGIS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchTMY = useCallback(async (location: Location): Promise<TMYData | null> => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      lat: location.latitude.toFixed(4),
      lon: location.longitude.toFixed(4),
      outputformat: 'json',
      startyear: '2005',
      endyear: '2020',
      pvcalculation: '0',
      components: '1',
    });

    try {
      const response = await fetch(`${PVGIS_BASE}?${params}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`PVGIS returned ${response.status}`);
      }

      const data = await response.json();
      const hourly: PVGISHourly[] = data.outputs.hourly;

      if (!hourly || hourly.length < 8760) {
        throw new Error('Incomplete TMY data received');
      }

      // Take first 8760 hours (one typical year)
      const records = hourly.slice(0, 8760);
      const ghi = new Float64Array(8760);
      const dni = new Float64Array(8760);
      const dhi = new Float64Array(8760);
      const temperature = new Float64Array(8760);

      for (let i = 0; i < 8760; i++) {
        const r = records[i];
        ghi[i] = r.ghi ?? 0;
        dni[i] = r.dni ?? 0;
        dhi[i] = r.dhi ?? 0;
        temperature[i] = r.temperature ?? 15;
      }

      setLoading(false);
      return { ghi, dni, dhi, temperature };
    } catch (err) {
      if ((err as Error).name === 'AbortError') return null;
      const message = (err as Error).message || 'Failed to fetch solar data';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  }, []);

  return { fetchTMY, loading, error, cancel };
}
