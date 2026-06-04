import { useState, useEffect, useCallback } from 'react';
import type { HeliosModule } from '../types';

declare function createHeliosModule(): Promise<HeliosModule>;

let modulePromise: Promise<HeliosModule> | null = null;

function getModule(): Promise<HeliosModule> {
  if (!modulePromise) {
    modulePromise = createHeliosModule();
  }
  return modulePromise;
}

export function useHeliosEngine() {
  const [engine, setEngine] = useState<HeliosModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getModule()
      .then((mod) => {
        if (!cancelled) {
          setEngine(mod);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load simulation engine');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const reset = useCallback(() => {
    modulePromise = null;
    setLoading(true);
    setError(null);
    getModule()
      .then(setEngine)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { engine, loading, error, reset };
}
