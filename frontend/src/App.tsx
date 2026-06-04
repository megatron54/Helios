import { useState, useCallback } from 'react';
import Sidebar from './components/UI/Sidebar';
import Viewport from './components/UI/Viewport';
import BottomPanel from './components/UI/BottomPanel';
import { useHeliosEngine } from './hooks/useHeliosEngine';
import type { Location, PanelConfig, SimulationResult, TMYData } from './types';

const DEFAULT_LOCATION: Location = {
  latitude: 40.4168,
  longitude: -3.7038,
  elevation: 650,
  name: 'Madrid, Spain',
};

const DEFAULT_PANEL: PanelConfig = {
  tilt: 35,
  azimuth: 180,
  ratedPower: 400,
  efficiency: 0.21,
  area: 1.9,
  tempCoeff: -0.35,
  noct: 45,
  quantity: 10,
};

export default function App() {
  const { engine, loading: engineLoading } = useHeliosEngine();
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION);
  const [panel, setPanel] = useState<PanelConfig>(DEFAULT_PANEL);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [tmy, setTmy] = useState<TMYData | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [hour, setHour] = useState(12);
  const [dayOfYear, setDayOfYear] = useState(172);

  const runSimulation = useCallback(() => {
    if (!engine || !tmy) return;
    setSimulating(true);

    // Run in a microtask to allow UI update
    setTimeout(() => {
      try {
        const res = engine.runSimulation(
          location.latitude, location.longitude, location.elevation,
          panel.tilt, panel.azimuth,
          panel.ratedPower, panel.efficiency, panel.area,
          panel.tempCoeff, panel.noct, panel.quantity,
          0.2,
          tmy.ghi, tmy.dni, tmy.dhi, tmy.temperature,
        );
        setResult(res);
      } catch (err) {
        console.error('Simulation failed:', err);
      } finally {
        setSimulating(false);
      }
    }, 16);
  }, [engine, tmy, location, panel]);

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      <header className="h-12 flex items-center px-5 border-b border-neutral-800 shrink-0">
        <h1 className="text-sm font-medium tracking-wide text-neutral-300">HELIOS</h1>
        <span className="ml-3 text-xs text-neutral-500">Solar Production Simulator</span>
        {engineLoading && <span className="ml-auto text-xs text-neutral-600">Loading engine...</span>}
      </header>

      <div className="flex flex-1 min-h-0">
        <Sidebar
          location={location}
          panel={panel}
          onLocationChange={setLocation}
          onPanelChange={setPanel}
          onTmyLoaded={setTmy}
          tmy={tmy}
          result={result}
          onSimulate={runSimulation}
          simulating={simulating}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <Viewport
            panel={panel}
            location={location}
            hour={hour}
            dayOfYear={dayOfYear}
          />

          <BottomPanel
            result={result}
            hour={hour}
            dayOfYear={dayOfYear}
            onHourChange={setHour}
            onDayChange={setDayOfYear}
          />
        </main>
      </div>
    </div>
  );
}
