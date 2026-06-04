import { useState, useCallback, useMemo } from 'react';
import { useHeliosEngine } from './hooks/useHeliosEngine';
import { getDefaultAppliances } from './data/appliances';
import { calculateConsumptionProfile } from './lib/consumption';
import { calculateRecommendation, estimateSpecificYield, buildPanelConfig, DEFAULT_PRICING } from './lib/recommendation';
import { generateReport } from './lib/report';
import { generateSyntheticTMY } from './lib/synthetic-tmy';
import { maxPanelsForRoof } from './lib/roof-layout';
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

  const maxPanels = useMemo(() => maxPanelsForRoof(roofWidth, roofLength, panel.tilt), [roofWidth, roofLength, panel.tilt]);

  const recommendation = useMemo(() => {
    return calculateRecommendation({ consumption, specificYield, panelWp: panel.ratedPower, pricing });
  }, [consumption, specificYield, panel.ratedPower, pricing]);

  const goToStep = (s: Step) => {
    const idx = STEPS.findIndex((x) => x.key === s);
    setStep(s);
    setMaxVisited((prev) => Math.max(prev, idx));
  };

  const handleLocationContinue = () => {
    const lat = parseFloat(latInput) || 40.4168;
    const lon = parseFloat(lonInput) || -3.7038;
    const loc: Location = { latitude: lat, longitude: lon, elevation: 0 };
    setLocation(loc);
    const syntheticData = generateSyntheticTMY(lat, lon, 0);
    setTmy(syntheticData);
    goToStep('consumption');
  };

  const handleConsumptionNext = () => {
    const suggested = buildPanelConfig(recommendation, panel, location.latitude);
    suggested.quantity = Math.min(suggested.quantity, maxPanels);
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

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-neutral-100 overflow-hidden">
      {/* Top accent line */}
      <div className="h-[2px] shrink-0 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500" />

      {/* Header */}
      <header className="h-12 flex items-center px-5 border-b border-white/[0.06] bg-[#09090b] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold tracking-[0.12em] text-white/90">HELIOS</span>
        </div>

        {/* Step nav */}
        <nav className="ml-10 flex items-center gap-0">
          {STEPS.map((s, i) => {
            const accessible = i <= maxVisited;
            const active = s.key === step;
            const completed = i < currentIdx;
            return (
              <div key={s.key} className="flex items-center">
                {i > 0 && (
                  <div className={`w-8 h-px mx-1 ${i <= maxVisited ? 'bg-white/10' : 'bg-white/[0.04]'}`} />
                )}
                <button
                  onClick={() => accessible && goToStep(s.key)}
                  disabled={!accessible}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all ${
                    active
                      ? 'bg-white/[0.08] text-white font-medium'
                      : completed
                        ? 'text-white/50 hover:text-white/70 hover:bg-white/[0.04]'
                        : accessible
                          ? 'text-white/40 hover:text-white/60 hover:bg-white/[0.04]'
                          : 'text-white/15 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center border ${
                    active
                      ? 'border-amber-500/60 bg-amber-500/15 text-amber-400'
                      : completed
                        ? 'border-white/15 bg-white/[0.06] text-white/50'
                        : accessible
                          ? 'border-white/10 text-white/30'
                          : 'border-white/[0.06] text-white/15'
                  }`}>
                    {completed ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    ) : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        {engineLoading && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[11px] text-white/30">Loading engine</span>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-[400px] border-r border-white/[0.06] flex flex-col shrink-0 bg-[#0c0c0e]">
          <div className="flex-1 overflow-y-auto p-6">

            {/* Step: Location */}
            {step === 'location' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-[15px] font-medium text-white mb-1">Installation location</h2>
                  <p className="text-[13px] text-white/35 leading-relaxed">
                    Enter coordinates and roof dimensions. Solar irradiance is modeled from your latitude.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider block mb-2.5">Coordinates</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-white/30 block mb-1.5">Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={latInput}
                        onChange={(e) => setLatInput(e.target.value)}
                        className="w-full px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:border-amber-500/40 focus:bg-white/[0.06] focus:outline-none transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/30 block mb-1.5">Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={lonInput}
                        onChange={(e) => setLonInput(e.target.value)}
                        className="w-full px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:border-amber-500/40 focus:bg-white/[0.06] focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Roof dimensions */}
                <div>
                  <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider block mb-2.5">Roof surface</label>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-white/30 block mb-1.5">Width (m)</label>
                        <input
                          type="number"
                          min="3"
                          max="30"
                          step="0.5"
                          value={roofWidth}
                          onChange={(e) => setRoofWidth(parseFloat(e.target.value) || 10)}
                          className="w-full px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:border-amber-500/40 focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-white/30 block mb-1.5">Length (m)</label>
                        <input
                          type="number"
                          min="3"
                          max="30"
                          step="0.5"
                          value={roofLength}
                          onChange={(e) => setRoofLength(parseFloat(e.target.value) || 8)}
                          className="w-full px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:border-amber-500/40 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-[11px] text-white/25">Usable area</span>
                      <span className="text-[13px] text-white/60 font-mono">{(roofWidth * roofLength).toFixed(0)} m&sup2;</span>
                    </div>
                  </div>
                </div>

                {tmy && (
                  <div className="flex items-center gap-2.5 text-[12px] text-emerald-400/80 bg-emerald-500/[0.06] px-3.5 py-2.5 rounded-lg border border-emerald-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Solar data loaded — 8,760 hourly records
                  </div>
                )}
              </div>
            )}

            {/* Step: Consumption */}
            {step === 'consumption' && (
              <div className="flex flex-col h-full">
                <div className="mb-5">
                  <h2 className="text-[15px] font-medium text-white mb-1">Energy consumption</h2>
                  <p className="text-[13px] text-white/35 leading-relaxed">
                    Select your appliances or enter annual kWh from your electricity bill.
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-0.5 mb-5 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <button
                    onClick={() => setUseManualInput(false)}
                    className={`flex-1 py-2 text-[12px] rounded-md transition-all ${
                      !useManualInput
                        ? 'bg-white/[0.08] text-white font-medium shadow-sm'
                        : 'text-white/35 hover:text-white/55'
                    }`}
                  >
                    Appliances
                  </button>
                  <button
                    onClick={() => setUseManualInput(true)}
                    className={`flex-1 py-2 text-[12px] rounded-md transition-all ${
                      useManualInput
                        ? 'bg-white/[0.08] text-white font-medium shadow-sm'
                        : 'text-white/35 hover:text-white/55'
                    }`}
                  >
                    Manual kWh
                  </button>
                </div>

                {useManualInput ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] text-white/30 block mb-1.5">Annual consumption (kWh)</label>
                      <input
                        type="number"
                        min="500"
                        max="100000"
                        step="100"
                        value={manualKwh ?? ''}
                        onChange={(e) => setManualKwh(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g. 4500"
                        className="w-full px-3 py-2.5 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/15 focus:border-amber-500/40 focus:outline-none font-mono"
                      />
                    </div>
                    <p className="text-[12px] text-white/25 leading-relaxed">
                      EU average household: 3,500 - 5,000 kWh per year. Check your electricity bill for an exact figure.
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
              <div className="space-y-5">
                <div>
                  <h2 className="text-[15px] font-medium text-white mb-1">System configuration</h2>
                  <p className="text-[13px] text-white/35 leading-relaxed">
                    Auto-sized for your consumption profile. Adjust orientation and panel count.
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/10">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
                  </div>
                  <div className="text-[12px] text-white/70 leading-relaxed">
                    <span className="text-amber-400 font-semibold">{recommendation.panelsNeeded} panels</span>
                    <span className="text-white/30 mx-1.5">/</span>
                    <span>{recommendation.systemSizeKwp.toFixed(1)} kWp</span>
                    <span className="text-white/30 mx-1.5">/</span>
                    <span>{(recommendation.coverageRatio * 100).toFixed(0)}% coverage</span>
                  </div>
                </div>

                <PanelControls panel={panel} onChange={setPanel} maxPanels={maxPanels} />
              </div>
            )}

            {/* Step: Results */}
            {step === 'results' && result && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-[15px] font-medium text-white mb-1">Simulation results</h2>
                  <p className="text-[13px] text-white/35 leading-relaxed">
                    Hourly simulation across 8,760 TMY data points.
                  </p>
                </div>
                <ResultsDashboard
                  recommendation={recommendation}
                  consumption={consumption}
                  simulation={result}
                />
                <div className="pt-4 border-t border-white/[0.06]">
                  <PricingInput pricing={pricing} onChange={setPricing} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="p-4 border-t border-white/[0.06] flex items-center gap-2.5 shrink-0 bg-[#09090b]">
            {currentIdx > 0 && (
              <button
                onClick={() => goToStep(STEPS[currentIdx - 1].key)}
                className="px-3.5 py-2 text-[12px] rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] hover:bg-white/[0.03] transition-all"
              >
                Back
              </button>
            )}
            <div className="flex-1" />

            {step === 'location' && (
              <button
                onClick={handleLocationContinue}
                className="px-5 py-2.5 text-[13px] font-medium rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-sm shadow-amber-500/20 transition-all"
              >
                Continue
              </button>
            )}
            {step === 'consumption' && (
              <button
                onClick={handleConsumptionNext}
                disabled={consumption.annualKwh === 0}
                className="px-5 py-2.5 text-[13px] font-medium rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-white/[0.06] disabled:to-white/[0.04] disabled:text-white/20 disabled:shadow-none text-white shadow-sm shadow-amber-500/20 transition-all"
              >
                Continue
              </button>
            )}
            {step === 'system' && (
              <button
                onClick={runSimulation}
                disabled={simulating || (!tmy && !engine)}
                className="px-5 py-2.5 text-[13px] font-medium rounded-lg bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-white/[0.06] disabled:to-white/[0.04] disabled:text-white/20 disabled:shadow-none text-white shadow-sm shadow-amber-500/20 transition-all"
              >
                {simulating ? 'Running...' : 'Run simulation'}
              </button>
            )}
            {step === 'results' && result && (
              <button
                onClick={() => generateReport({ location, panel, consumption, recommendation, simulation: result })}
                className="px-4 py-2.5 text-[13px] font-medium rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.12] transition-all"
              >
                Export PDF
              </button>
            )}
          </div>
        </aside>

        {/* Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
          <div className="flex-1 relative">
            <SolarScene
              panel={panel}
              location={location}
              hour={hour}
              dayOfYear={dayOfYear}
              roofWidth={roofWidth}
              roofLength={roofLength}
            />

            {/* Time overlay */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-white/30 w-7">Time</span>
                <input
                  type="range"
                  min={5} max={21} step={0.5}
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-28 accent-amber-500"
                />
                <span className="text-[12px] text-white/60 font-mono w-10">
                  {Math.floor(hour)}:{String(Math.round((hour % 1) * 60)).padStart(2, '0')}
                </span>
              </div>
              <div className="w-px h-4 bg-white/[0.08]" />
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-white/30 w-7">Date</span>
                <input
                  type="range"
                  min={1} max={365} step={1}
                  value={dayOfYear}
                  onChange={(e) => setDayOfYear(Number(e.target.value))}
                  className="w-28 accent-amber-500"
                />
                <span className="text-[12px] text-white/60 font-mono w-12">
                  {dayToLabel(dayOfYear)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom chart */}
          {result && (
            <div className="h-48 border-t border-white/[0.06] bg-[#0c0c0e] px-6 py-3">
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
