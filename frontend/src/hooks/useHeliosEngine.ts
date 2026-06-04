import { useState, useEffect, useCallback, useRef } from 'react';
import type { HeliosModule } from '../types';

let modulePromise: Promise<HeliosModule> | null = null;
let cachedModule: HeliosModule | null = null;

function loadModule(): Promise<HeliosModule> {
  if (cachedModule) return Promise.resolve(cachedModule);
  if (modulePromise) return modulePromise;

  modulePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = import.meta.env.BASE_URL + 'helios.js';
    script.onload = () => {
      const factory = (window as unknown as Record<string, unknown>)['createHeliosModule'] as
        (opts?: Record<string, unknown>) => Promise<HeliosModule>;

      if (!factory) {
        reject(new Error('createHeliosModule not found'));
        return;
      }

      factory({
        locateFile: (path: string) => import.meta.env.BASE_URL + path,
      })
        .then((mod) => {
          cachedModule = mod;
          resolve(mod);
        })
        .catch(reject);
    };
    script.onerror = () => reject(new Error('Failed to load helios.js'));
    document.head.appendChild(script);
  });

  return modulePromise;
}

export function useHeliosEngine() {
  const [engine, setEngine] = useState<HeliosModule | null>(cachedModule);
  const [loading, setLoading] = useState(!cachedModule);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (cachedModule) {
      setEngine(cachedModule);
      setLoading(false);
      return;
    }

    loadModule()
      .then((mod) => {
        if (mounted.current) {
          setEngine(mod);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted.current) {
          setError(err.message || 'Failed to load engine');
          setLoading(false);
        }
      });

    return () => { mounted.current = false; };
  }, []);

  const reset = useCallback(() => {
    modulePromise = null;
    cachedModule = null;
    setLoading(true);
    setError(null);
    loadModule()
      .then((mod) => { setEngine(mod); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  return { engine, loading, error, reset };
}
