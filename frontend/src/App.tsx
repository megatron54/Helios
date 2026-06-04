import { useState, useCallback, useMemo } from 'react';
import { useHeliosEngine } from './hooks/useHeliosEngine';
import { usePVGIS } from './hooks/usePVGIS';
import { getDefaultAppliances } from './data/appliances';
import { calculateConsumptionProfile } from './lib/consumption';
import { calculateRecommendation, estimateSpecificYield, buildPanelConfig } from './lib/recommendation';
import LocationPicker from './components/Map/LocationPicker';
import ConsumptionEstimator from './components/Consumption/ConsumptionEstimator';
import PanelControls from './components/Controls/PanelControls';
import ResultsDashboard from './components/Results/ResultsDashboard';
import MonthlyChart from './components/Charts/MonthlyChart';
import SolarScene from './components/Scene3D/SolarScene';
import TimeControls from './components/Controls/TimeControls';
import type { Location, PanelConfig, SimulationResult, TMYData, Appliance } from './types';

type Step = 'location' | 'consumption' | 'system' | 'results';

const STEPS: { key: Step; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'consumption', label: 'Consumption' },
  { key: 'system', label: 'System' },
  { key: 'results', label: 'Results' },
];

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
  const { fetchTMY, loading: tmyLoading, error: tmyError } = usePVGIS();

  const [step, setStep] = useState<Step>('location');
  const [location, setLocation] = useState<Location>({
    latitude: 40.4168,
    longitude: -3.7038,
    elevation: 650,
    name: 'Madrid, Spain',
  });
  const [tmy, setTmy] = useState<TMYData | null>(null);
  const [appliances, setAppliances] = useState<Appliance[]>(getDefaultAppliances);
  const [panel, setPanel] = useState<PanelConfig>(DEFAULT_PANEL);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [hour, setHour] = useState(12);
  const [dayOfYear, setDayOfYear] = useState(172);

  const consumption = useMemo(() => calculateConsumptionProfile(appliances), [appliances]);

  const specificYield = useMemo(() => {
    if (result) return result.specificYield;
    return estimateSpecificYield(location.latitude);
  }, [result, location.latitude]);

  const recommendation = useMemo(() => {
    return calculateRecommendation({
      consumption,
      specificYield,
      panelWp: panel.ratedPower,
    });
  }, [consumption, specificYield, panel.ratedPower]);

  const handleLocationConfirm = async () => {
    const data = await fetchTMY(location);
    if (data) {
      setTmy(data);
      setStep('consumption');
    }
  };

  const handleConsumptionConfirm = () => {
    // Auto-configure panels based on recommendation
    const suggested = buildPanelConfig(recommendation, panel, location.latitude);
    setPanel(suggested);
    setStep('system');
  };

  const runSimulation = useCallback(() => {
    if (!engine || !tmy) return;
    setSimulating(true);
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
        setStep('results');
      } catch (err) {
        console.error('Simulation failed:', err);
      } finally {
        setSimulating(false);
      }
    }, 16);
  }, [engine, tmy, location, panel]);

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);



  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Header */}
      <header className="h-12 flex items-center px-5 border-b border-neutral-800 shrink-0">
        <h1 className="text-sm font-semibold tracking-wide text-neutral-200">HELIOS</h1>
        <span className="ml-3 text-xs text-neutral-500">Solar Energy Planner</span>
        {engineLoading && (
          <span className="ml-auto text-xs text-neutral-600 animate-pulse">Loading engine...</span>
        )}

        {/* Step indicator */}
        <nav className="ml-auto flex items-center gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => {
                if (i <= currentStepIdx) setStep(s.key);
              }}
              disabled={i > currentStepIdx}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                s.key === step
                  ? 'bg-amber-600/20 text-amber-400 font-medium'
                  : i < currentStepIdx
                    ? 'text-neutral-400 hover:text-neutral-200'
                    : 'text-neutral-600 cursor-default'
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-96 border-r border-neutral-800 flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-4">
            {step === 'location' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-neutral-200 mb-1">Where is your home?</h2>
                  <p className="text-xs text-neutral-500 mb-4">
                    Click the map or enter coordinates. We'll fetch real solar irradiance data for your location.
                  </p>
                </div>
                <LocationPicker
                  location={location}
                  onChange={setLocation}
                  onTmyLoaded={setTmy}
                />
                {tmy && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Solar data loaded — 8,760 hourly records
                  </div>
                )}
              </div>
            )}

            {step === 'consumption' && (
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-neutral-200 mb-1">Your energy usage</h2>
                  <p className="text-xs text-neutral-500">
                    Select the appliances in your home. We'll calculate how much solar you need.
                  </p>
                </div>
                <div className="flex-1 min-h-0">
                  <ConsumptionEstimator appliances={appliances} onChange={setAppliances} />
                </div>
              </div>
            )}

            {step === 'system' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-neutral-200 mb-1">System configuration</h2>
                  <p className="text-xs text-neutral-500 mb-4">
                    We've sized your system based on your consumption. Adjust if needed.
                  </p>
                </div>
                <div className="text-xs text-neutral-400 bg-neutral-800/50 rounded p-2.5 border border-neutral-700/50">
                  Recommended: <span className="text-amber-400 font-medium">{recommendation.panelsNeeded} panels</span>
                  {' '}({recommendation.systemSizeKwp.toFixed(1)} kWp) to cover{' '}
                  {(recommendation.coverageRatio * 100).toFixed(0)}% of your consumption.
                </div>
                <PanelControls panel={panel} onChange={setPanel} />
              </div>
            )}

            {step === 'results' && result && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-neutral-200 mb-1">Your solar system</h2>
                  <p className="text-xs text-neutral-500 mb-4">
                    Based on real TMY data and WASM-powered simulation.
                  </p>
                </div>
                <ResultsDashboard
                  recommendation={recommendation}
                  consumption={consumption}
                  simulation={result}
                />
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="p-4 border-t border-neutral-800 flex gap-2 shrink-0">
            {currentStepIdx > 0 && (
              <button
                onClick={() => setStep(STEPS[currentStepIdx - 1].key)}
                className="px-4 py-2 text-sm rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Back
              </button>
            )}
            <div className="flex-1" />
            {step === 'location' && (
              <button
                onClick={handleLocationConfirm}
                disabled={tmyLoading}
                className="px-5 py-2 text-sm font-medium rounded bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 transition-colors"
              >
                {tmyLoading ? 'Loading solar data...' : tmy ? 'Continue' : 'Fetch Solar Data'}
              </button>
            )}
            {step === 'consumption' && (
              <button
                onClick={handleConsumptionConfirm}
                disabled={consumption.annualKwh === 0}
                className="px-5 py-2 text-sm font-medium rounded bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 transition-colors"
              >
                Size My System
              </button>
            )}
            {step === 'system' && (
              <button
                onClick={runSimulation}
                disabled={simulating || !tmy || !engine}
                className="px-5 py-2 text-sm font-medium rounded bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 transition-colors"
              >
                {simulating ? 'Simulating...' : 'Run Simulation'}
              </button>
            )}
            {step === 'results' && (
              <button
                onClick={() => setStep('system')}
                className="px-5 py-2 text-sm font-medium rounded border border-amber-600 text-amber-400 hover:bg-amber-600/10 transition-colors"
              >
                Adjust System
              </button>
            )}
          </div>

          {tmyError && (
            <div className="px-4 pb-3">
              <p className="text-xs text-red-400">{tmyError}</p>
            </div>
          )}
        </aside>

        {/* Main viewport */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative bg-neutral-900">
            <SolarScene
              panel={panel}
              location={location}
              hour={hour}
              dayOfYear={dayOfYear}
            />
          </div>

          {/* Bottom bar */}
          <div className="h-48 border-t border-neutral-800 flex items-center px-6 gap-8 shrink-0 bg-neutral-950">
            <TimeControls
              hour={hour}
              dayOfYear={dayOfYear}
              onHourChange={setHour}
              onDayChange={setDayOfYear}
            />
            {result ? (
              <div className="flex-1 h-40">
                <MonthlyChart result={result} />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-600">
                Complete the steps to see monthly production data
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
