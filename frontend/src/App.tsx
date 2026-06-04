import { useState, useCallback, useMemo } from 'react';
import { useHeliosEngine } from './hooks/useHeliosEngine';
import { usePVGIS } from './hooks/usePVGIS';
import { getDefaultAppliances } from './data/appliances';
import { calculateConsumptionProfile } from './lib/consumption';
import { calculateRecommendation, estimateSpecificYield, buildPanelConfig, DEFAULT_PRICING } from './lib/recommendation';
import { generateReport } from './lib/report';
import LocationPicker from './components/Map/LocationPicker';
import ConsumptionEstimator from './components/Consumption/ConsumptionEstimator';
import PanelControls from './components/Controls/PanelControls';
import PricingInput from './components/Controls/PricingInput';
import ResultsDashboard from './components/Results/ResultsDashboard';
import MonthlyChart from './components/Charts/MonthlyChart';
import SolarScene from './components/Scene3D/SolarScene';
import TimeControls from './components/Controls/TimeControls';
import type { Location, PanelConfig, SimulationResult, TMYData, Appliance, ElectricityPricing } from './types';

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
  const [pricing, setPricing] = useState<ElectricityPricing>(DEFAULT_PRICING);
  const [manualKwh, setManualKwh] = useState<number | null>(null);
  const [useManualInput, setUseManualInput] = useState(false);

  const consumption = useMemo(() => {
    if (useManualInput && manualKwh !== null && manualKwh > 0) {
      // Distribute manual input evenly across months (slight seasonal variation)
      const monthlyWeights = [1.1, 1.05, 1.0, 0.9, 0.85, 0.8, 0.8, 0.85, 0.9, 1.0, 1.05, 1.1];
      const weightSum = monthlyWeights.reduce((a, b) => a + b, 0);
      const monthlyKwh = monthlyWeights.map((w) => (manualKwh * w) / weightSum);
      return { appliances, annualKwh: manualKwh, monthlyKwh };
    }
    return calculateConsumptionProfile(appliances);
  }, [appliances, useManualInput, manualKwh]);

  const specificYield = useMemo(() => {
    if (result) return result.specificYield;
    return estimateSpecificYield(location.latitude);
  }, [result, location.latitude]);

  const recommendation = useMemo(() => {
    return calculateRecommendation({
      consumption,
      specificYield,
      panelWp: panel.ratedPower,
      pricing,
    });
  }, [consumption, specificYield, panel.ratedPower, pricing]);

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
                <div className="mb-3">
                  <h2 className="text-lg font-medium text-neutral-200 mb-1">Your energy usage</h2>
                  <p className="text-xs text-neutral-500">
                    Select your appliances, or enter your annual consumption directly from your electricity bill.
                  </p>
                </div>

                {/* Toggle: appliances vs manual */}
                <div className="flex gap-1 mb-4 p-0.5 bg-neutral-800 rounded-md">
                  <button
                    onClick={() => setUseManualInput(false)}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                      !useManualInput ? 'bg-neutral-700 text-neutral-100 font-medium' : 'text-neutral-400'
                    }`}
                  >
                    Select Appliances
                  </button>
                  <button
                    onClick={() => setUseManualInput(true)}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${
                      useManualInput ? 'bg-neutral-700 text-neutral-100 font-medium' : 'text-neutral-400'
                    }`}
                  >
                    Enter kWh Manually
                  </button>
                </div>

                {useManualInput ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Annual consumption (kWh)</label>
                      <input
                        type="number"
                        min="500"
                        max="100000"
                        step="100"
                        value={manualKwh ?? ''}
                        onChange={(e) => setManualKwh(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g. 4500"
                        className="w-full px-3 py-2.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      You can find this on your electricity bill or provider's app.
                      Average EU household: 3,500 - 5,000 kWh/year.
                    </p>
                    {manualKwh && manualKwh > 0 && (
                      <div className="text-sm text-neutral-300 bg-neutral-800/50 rounded p-3 border border-neutral-700/50">
                        <span className="font-mono text-lg text-neutral-100">{manualKwh.toLocaleString()}</span>
                        <span className="text-neutral-400 ml-1.5">kWh/year</span>
                        <span className="text-neutral-500 text-xs ml-3">
                          (~{Math.round(manualKwh / 12)} kWh/month)
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ConsumptionEstimator appliances={appliances} onChange={setAppliances} />
                  </div>
                )}
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
                <div className="pt-2 border-t border-neutral-800">
                  <PricingInput pricing={pricing} onChange={setPricing} />
                </div>
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
            {step === 'results' && result && (
              <button
                onClick={() => generateReport({ location, panel, consumption, recommendation, simulation: result })}
                className="px-5 py-2 text-sm font-medium rounded bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Export PDF
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
                <MonthlyChart result={result} consumption={consumption} />
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
