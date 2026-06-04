import { useState, useCallback, useMemo } from 'react';
import { useHeliosEngine } from './hooks/useHeliosEngine';
import { usePVGIS } from './hooks/usePVGIS';
import { getDefaultAppliances } from './data/appliances';
import { calculateConsumptionProfile } from './lib/consumption';
import { calculateRecommendation, estimateSpecificYield, buildPanelConfig, DEFAULT_PRICING } from './lib/recommendation';
import { generateReport } from './lib/report';
import ConsumptionEstimator from './components/Consumption/ConsumptionEstimator';
import PanelControls from './components/Controls/PanelControls';
import PricingInput from './components/Controls/PricingInput';
import ResultsDashboard from './components/Results/ResultsDashboard';
import MonthlyChart from './components/Charts/MonthlyChart';
import SolarScene from './components/Scene3D/SolarScene';
import type { Location, PanelConfig, SimulationResult, TMYData, Appliance, ElectricityPricing } from './types';

type Step = 'location' | 'consumption' | 'system' | 'results';

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'location', label: 'Location', num: 1 },
  { key: 'consumption', label: 'Consumption', num: 2 },
  { key: 'system', label: 'System', num: 3 },
  { key: 'results', label: 'Results', num: 4 },
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
  const [maxVisited, setMaxVisited] = useState(0);
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
  const [roofWidth, setRoofWidth] = useState(10);
  const [roofLength, setRoofLength] = useState(8);
  const [latInput, setLatInput] = useState('40.4168');
  const [lonInput, setLonInput] = useState('-3.7038');

  const consumption = useMemo(() => {
    if (useManualInput && manualKwh !== null && manualKwh > 0) {
      const weights = [1.1, 1.05, 1.0, 0.9, 0.85, 0.8, 0.8, 0.85, 0.9, 1.0, 1.05, 1.1];
      const sum = weights.reduce((a, b) => a + b, 0);
      const monthlyKwh = weights.map((w) => (manualKwh * w) / sum);
      return { appliances, annualKwh: manualKwh, monthlyKwh };
    }
    return calculateConsumptionProfile(appliances);
  }, [appliances, useManualInput, manualKwh]);

  const specificYield = useMemo(() => {
    if (result) return result.specificYield;
    return estimateSpecificYield(location.latitude);
  }, [result, location.latitude]);

  const recommendation = useMemo(() => {
    return calculateRecommendation({ consumption, specificYield, panelWp: panel.ratedPower, pricing });
  }, [consumption, specificYield, panel.ratedPower, pricing]);

  // Navigate to step and track furthest visited
  const goToStep = (s: Step) => {
    const idx = STEPS.findIndex((x) => x.key === s);
    setStep(s);
    setMaxVisited((prev) => Math.max(prev, idx));
  };

  // Auto-fetch TMY when location changes (debounced)
  const handleFetchSolarData = async () => {
    const loc: Location = {
      latitude: parseFloat(latInput) || 40.4168,
      longitude: parseFloat(lonInput) || -3.7038,
      elevation: 0,
    };
    setLocation(loc);
    const data = await fetchTMY(loc);
    if (data) {
      setTmy(data);
      goToStep('consumption');
    }
  };

  const handleConsumptionNext = () => {
    const suggested = buildPanelConfig(recommendation, panel, location.latitude);
    setPanel(suggested);
    goToStep('system');
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
        goToStep('results');
      } catch (err) {
        console.error('Simulation failed:', err);
      } finally {
        setSimulating(false);
      }
    }, 16);
  }, [engine, tmy, location, panel]);

  // Allow skipping to system step without TMY (use estimates)
  const handleSkipToSystem = () => {
    const loc: Location = {
      latitude: parseFloat(latInput) || 40.4168,
      longitude: parseFloat(lonInput) || -3.7038,
      elevation: 0,
    };
    setLocation(loc);
    goToStep('consumption');
  };

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0c0c0f] text-neutral-100 overflow-hidden">
      {/* Header */}
      <header className="h-11 flex items-center px-5 border-b border-neutral-800/60 bg-[#111115] shrink-0">
        <h1 className="text-sm font-semibold tracking-wider text-neutral-100">HELIOS</h1>

        {/* Step nav */}
        <nav className="ml-8 flex items-center gap-0.5">
          {STEPS.map((s, i) => {
            const accessible = i <= maxVisited;
            const active = s.key === step;
            return (
              <button
                key={s.key}
                onClick={() => accessible && goToStep(s.key)}
                disabled={!accessible}
                className={`relative px-3.5 py-1.5 text-xs rounded-md transition-all ${
                  active
                    ? 'bg-amber-500/15 text-amber-400 font-medium'
                    : accessible
                      ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                      : 'text-neutral-600 cursor-not-allowed'
                }`}
              >
                <span className="font-mono mr-1 opacity-60">{s.num}</span>
                {s.label}
                {active && <span className="absolute bottom-0 left-3 right-3 h-px bg-amber-500/50" />}
              </button>
            );
          })}
        </nav>

        {engineLoading && (
          <span className="ml-auto text-xs text-neutral-500 animate-pulse">Engine loading...</span>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[380px] border-r border-neutral-800/50 flex flex-col shrink-0 bg-[#101014]">
          <div className="flex-1 overflow-y-auto p-5">

            {/* Step: Location */}
            {step === 'location' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-medium text-neutral-100 mb-1.5">Your location</h2>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Enter your coordinates. Solar irradiance data will be fetched from the EU PVGIS database.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#1a1a20] border border-neutral-700/60 rounded-md text-neutral-100 focus:border-amber-500/70 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lonInput}
                      onChange={(e) => setLonInput(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#1a1a20] border border-neutral-700/60 rounded-md text-neutral-100 focus:border-amber-500/70 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Roof dimensions */}
                <div className="p-3.5 rounded-lg bg-[#15151a] border border-neutral-800/60">
                  <h3 className="text-xs text-neutral-400 font-medium mb-3 uppercase tracking-wide">Roof Area</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Width (m)</label>
                      <input
                        type="number"
                        min="3"
                        max="30"
                        step="0.5"
                        value={roofWidth}
                        onChange={(e) => setRoofWidth(parseFloat(e.target.value) || 10)}
                        className="w-full px-3 py-2 text-sm bg-[#1a1a20] border border-neutral-700/60 rounded-md text-neutral-100 focus:border-amber-500/70 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Length (m)</label>
                      <input
                        type="number"
                        min="3"
                        max="30"
                        step="0.5"
                        value={roofLength}
                        onChange={(e) => setRoofLength(parseFloat(e.target.value) || 8)}
                        className="w-full px-3 py-2 text-sm bg-[#1a1a20] border border-neutral-700/60 rounded-md text-neutral-100 focus:border-amber-500/70 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    Available: {(roofWidth * roofLength).toFixed(0)} m&sup2;
                  </p>
                </div>

                {tmy && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/8 px-3 py-2 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Solar data loaded (8,760 hourly records)
                  </div>
                )}

                {tmyError && (
                  <div className="text-xs text-red-400 bg-red-500/8 px-3 py-2 rounded-md border border-red-500/20">
                    {tmyError}
                    <button
                      onClick={handleSkipToSystem}
                      className="block mt-1.5 text-neutral-300 underline"
                    >
                      Continue with estimated data instead
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step: Consumption */}
            {step === 'consumption' && (
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <h2 className="text-base font-medium text-neutral-100 mb-1.5">Energy consumption</h2>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Select appliances or enter your annual kWh from your electricity bill.
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-0.5 mb-4 p-0.5 bg-[#1a1a20] rounded-lg border border-neutral-800/50">
                  <button
                    onClick={() => setUseManualInput(false)}
                    className={`flex-1 py-2 text-xs rounded-md transition-all ${
                      !useManualInput
                        ? 'bg-[#252530] text-neutral-100 font-medium shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Appliances
                  </button>
                  <button
                    onClick={() => setUseManualInput(true)}
                    className={`flex-1 py-2 text-xs rounded-md transition-all ${
                      useManualInput
                        ? 'bg-[#252530] text-neutral-100 font-medium shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Manual kWh
                  </button>
                </div>

                {useManualInput ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Annual consumption (kWh)</label>
                      <input
                        type="number"
                        min="500"
                        max="100000"
                        step="100"
                        value={manualKwh ?? ''}
                        onChange={(e) => setManualKwh(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g. 4500"
                        className="w-full px-3 py-2.5 text-sm bg-[#1a1a20] border border-neutral-700/60 rounded-md text-neutral-100 placeholder:text-neutral-600 focus:border-amber-500/70 focus:outline-none font-mono"
                      />
                    </div>
                    <p className="text-xs text-neutral-500">
                      EU average: 3,500 - 5,000 kWh/year. Check your electricity bill.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ConsumptionEstimator appliances={appliances} onChange={setAppliances} />
                  </div>
                )}
              </div>
            )}

            {/* Step: System */}
            {step === 'system' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-neutral-100 mb-1.5">System configuration</h2>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Sized for your consumption. Adjust panel type, orientation, and quantity.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/20 text-xs text-neutral-300">
                  Recommendation: <span className="text-amber-400 font-medium">{recommendation.panelsNeeded} panels</span>
                  {' '}/ {recommendation.systemSizeKwp.toFixed(1)} kWp /{' '}
                  {(recommendation.coverageRatio * 100).toFixed(0)}% coverage
                </div>

                <PanelControls panel={panel} onChange={setPanel} />
              </div>
            )}

            {/* Step: Results */}
            {step === 'results' && result && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-neutral-100 mb-1.5">Simulation results</h2>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Based on hourly TMY irradiance simulation.
                  </p>
                </div>
                <ResultsDashboard
                  recommendation={recommendation}
                  consumption={consumption}
                  simulation={result}
                />
                <div className="pt-3 border-t border-neutral-800/50">
                  <PricingInput pricing={pricing} onChange={setPricing} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="p-4 border-t border-neutral-800/50 flex items-center gap-2 shrink-0 bg-[#0e0e12]">
            {currentIdx > 0 && (
              <button
                onClick={() => goToStep(STEPS[currentIdx - 1].key)}
                className="px-3.5 py-2 text-xs rounded-md border border-neutral-700/50 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors"
              >
                Back
              </button>
            )}
            <div className="flex-1" />

            {step === 'location' && (
              <button
                onClick={handleFetchSolarData}
                disabled={tmyLoading}
                className="px-5 py-2.5 text-sm font-medium rounded-md bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white transition-colors"
              >
                {tmyLoading ? 'Loading...' : 'Continue'}
              </button>
            )}
            {step === 'consumption' && (
              <button
                onClick={handleConsumptionNext}
                disabled={consumption.annualKwh === 0}
                className="px-5 py-2.5 text-sm font-medium rounded-md bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white transition-colors"
              >
                Continue
              </button>
            )}
            {step === 'system' && (
              <button
                onClick={runSimulation}
                disabled={simulating || (!tmy && !engine)}
                className="px-5 py-2.5 text-sm font-medium rounded-md bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white transition-colors"
              >
                {simulating ? 'Running...' : 'Simulate'}
              </button>
            )}
            {step === 'results' && result && (
              <button
                onClick={() => generateReport({ location, panel, consumption, recommendation, simulation: result })}
                className="px-4 py-2.5 text-sm font-medium rounded-md bg-[#1a1a22] border border-neutral-700/50 text-neutral-300 hover:text-neutral-100 hover:border-neutral-600 transition-colors"
              >
                Export PDF
              </button>
            )}
          </div>
        </aside>

        {/* Viewport */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <SolarScene
              panel={panel}
              location={location}
              hour={hour}
              dayOfYear={dayOfYear}
              roofWidth={roofWidth}
              roofLength={roofLength}
            />

            {/* Time overlay - compact */}
            <div className="absolute bottom-4 left-4 bg-[#0c0c0f]/85 backdrop-blur-sm border border-neutral-800/50 rounded-lg px-4 py-3 flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 w-8">Time</span>
                <input
                  type="range"
                  min={5} max={21} step={0.5}
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-28 accent-amber-500"
                />
                <span className="text-xs text-neutral-300 font-mono w-10">
                  {Math.floor(hour)}:{String(Math.round((hour % 1) * 60)).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 w-8">Date</span>
                <input
                  type="range"
                  min={1} max={365} step={1}
                  value={dayOfYear}
                  onChange={(e) => setDayOfYear(Number(e.target.value))}
                  className="w-28 accent-amber-500"
                />
                <span className="text-xs text-neutral-300 font-mono w-10">
                  {dayToLabel(dayOfYear)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom chart */}
          {result && (
            <div className="h-44 border-t border-neutral-800/50 bg-[#0e0e12] px-6 py-3">
              <MonthlyChart result={result} consumption={consumption} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function dayToLabel(doy: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let acc = 0;
  for (let i = 0; i < 12; i++) {
    if (acc + days[i] >= doy) return `${months[i]} ${doy - acc}`;
    acc += days[i];
  }
  return `D${doy}`;
}
