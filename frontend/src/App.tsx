import { useState, useCallback, useMemo } from 'react';
import { useHeliosEngine } from './hooks/useHeliosEngine';
import { getDefaultAppliances } from './data/appliances';
import { calculateConsumptionProfile } from './lib/consumption';
import { calculateRecommendation, estimateSpecificYield, buildPanelConfig, DEFAULT_PRICING } from './lib/recommendation';
import { generateReport } from './lib/report';
import { generateSyntheticTMY } from './lib/synthetic-tmy';
import { maxPanelsForRoof } from './lib/roof-layout';
import { DEFAULT_PREFERENCES } from './lib/defaults';
import { optimizeSystem } from './lib/optimizer';
import ConsumptionEstimator from './components/Consumption/ConsumptionEstimator';
import PreferencesStep from './components/Preferences/PreferencesStep';
import PanelControls from './components/Controls/PanelControls';
import SystemExtras from './components/Controls/SystemExtras';
import PricingInput from './components/Controls/PricingInput';
import ResultsDashboard from './components/Results/ResultsDashboard';
import MonthlyChart from './components/Charts/MonthlyChart';
import SolarScene from './components/Scene3D/SolarScene';
import type {
  Location, PanelConfig, SimulationResult, TMYData, Appliance,
  ElectricityPricing, SystemPreferences, BatteryConfig, InverterConfig,
  GeneratorConfig, FullRecommendation,
} from './types';

type Step = 'location' | 'consumption' | 'preferences' | 'system' | 'results';

const STEPS: { key: Step; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'consumption', label: 'Consumption' },
  { key: 'preferences', label: 'Preferences' },
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

  const [step, setStep] = useState<Step>('location');
  const [maxVisited, setMaxVisited] = useState(0);
  const [location, setLocation] = useState<Location>({
    latitude: 40.4168, longitude: -3.7038, elevation: 650, name: 'Madrid, Spain',
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
  const [preferences, setPreferences] = useState<SystemPreferences>(DEFAULT_PREFERENCES);
  const [battery, setBattery] = useState<BatteryConfig | null>(null);
  const [inverter, setInverter] = useState<InverterConfig | null>(null);
  const [generator, setGenerator] = useState<GeneratorConfig | null>(null);
  const [fullRec, setFullRec] = useState<FullRecommendation | null>(null);

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
    goToStep('preferences');
  };

  const handlePreferencesNext = () => {
    // Run optimizer to get recommended system
    if (!tmy) return;

    // Generate hourly PV profile per kWp from TMY
    const hourlyPvPerKwp = generateHourlyPvPerKwp(tmy, location, panel);

    const rec = optimizeSystem({
      consumption,
      preferences,
      pricing,
      maxPanels,
      panelWp: panel.ratedPower,
      specificYield,
      pvHourlyKw: hourlyPvPerKwp,
    });

    setFullRec(rec);

    // Apply recommendation to panel config
    const suggested = buildPanelConfig(recommendation, panel, location.latitude);
    suggested.quantity = Math.min(rec.panelsNeeded, maxPanels);
    setPanel(suggested);

    // Set component configs from optimizer
    setBattery(rec.system.battery);
    setInverter(rec.system.inverter);
    setGenerator(rec.system.generator);

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

        // Re-run optimizer with actual simulation data for accurate dispatch
        const hourlyPvKw: number[] = [];
        const hourlyData = res.getHourly();
        for (let i = 0; i < hourlyData.length; i++) {
          hourlyPvKw.push(hourlyData[i].acPower / 1000); // W to kW
        }

        const rec = optimizeSystem({
          consumption,
          preferences,
          pricing,
          maxPanels,
          panelWp: panel.ratedPower,
          specificYield: res.specificYield,
          pvHourlyKw: hourlyPvKw.map((kw) => kw / ((panel.quantity * panel.ratedPower) / 1000)), // normalize to per kWp
        });
        setFullRec(rec);

        goToStep('results');
      } catch (err) {
        console.error('Simulation failed:', err);
      } finally {
        setSimulating(false);
      }
    }, 16);
  }, [engine, tmy, location, panel, consumption, preferences, pricing, maxPanels]);

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-[system-ui]">
      <header className="h-11 flex items-center px-4 border-b border-zinc-800/80 shrink-0 gap-6">
        <span className="text-sm font-bold tracking-wide">Helios</span>
        <div className="flex items-center h-full">
          {STEPS.map((s, i) => {
            const accessible = i <= maxVisited;
            const active = s.key === step;
            return (
              <button
                key={s.key}
                onClick={() => accessible && goToStep(s.key)}
                disabled={!accessible}
                className={`relative h-full px-3 text-[13px] transition-colors ${
                  active ? 'text-zinc-100' : accessible ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-700 cursor-not-allowed'
                }`}
              >
                {s.label}
                {active && <span className="absolute bottom-0 inset-x-3 h-[2px] bg-zinc-100 rounded-full" />}
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        {engineLoading && <span className="text-[11px] text-zinc-600">Loading engine...</span>}
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-[360px] border-r border-zinc-800/80 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto px-5 py-5">

            {step === 'location' && (
              <div className="space-y-5">
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  Set your coordinates and roof dimensions to model solar irradiance.
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Latitude">
                      <input type="number" step="0.0001" value={latInput} onChange={(e) => setLatInput(e.target.value)} className="field-input" />
                    </Field>
                    <Field label="Longitude">
                      <input type="number" step="0.0001" value={lonInput} onChange={(e) => setLonInput(e.target.value)} className="field-input" />
                    </Field>
                  </div>
                  <div className="h-px bg-zinc-800/60" />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Roof width" suffix="m">
                      <input type="number" min="3" max="30" step="0.5" value={roofWidth} onChange={(e) => setRoofWidth(parseFloat(e.target.value) || 10)} className="field-input" />
                    </Field>
                    <Field label="Roof length" suffix="m">
                      <input type="number" min="3" max="30" step="0.5" value={roofLength} onChange={(e) => setRoofLength(parseFloat(e.target.value) || 8)} className="field-input" />
                    </Field>
                  </div>
                  <div className="text-[12px] text-zinc-600 tabular-nums">{(roofWidth * roofLength).toFixed(0)} m2 available</div>
                </div>
              </div>
            )}

            {step === 'consumption' && (
              <div className="flex flex-col h-full">
                <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">
                  Estimate your annual energy use from appliances or enter a known figure.
                </p>
                <div className="flex gap-1 mb-4 p-0.5 bg-zinc-900 rounded-md border border-zinc-800">
                  <button onClick={() => setUseManualInput(false)} className={`flex-1 py-1.5 text-[12px] rounded transition-colors ${!useManualInput ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>Appliances</button>
                  <button onClick={() => setUseManualInput(true)} className={`flex-1 py-1.5 text-[12px] rounded transition-colors ${useManualInput ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>Manual entry</button>
                </div>
                {useManualInput ? (
                  <div>
                    <Field label="Annual consumption (kWh)">
                      <input type="number" min="500" max="100000" step="100" value={manualKwh ?? ''} onChange={(e) => setManualKwh(e.target.value ? parseInt(e.target.value) : null)} placeholder="4500" className="field-input" />
                    </Field>
                    <p className="text-[11px] text-zinc-600 mt-2">EU average: 3,500 - 5,000 kWh/year</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0">
                    <ConsumptionEstimator appliances={appliances} onChange={setAppliances} />
                  </div>
                )}
              </div>
            )}

            {step === 'preferences' && (
              <PreferencesStep preferences={preferences} onChange={setPreferences} />
            )}

            {step === 'system' && (
              <div className="space-y-4">
                <p className="text-[13px] text-zinc-400 leading-relaxed">
                  System auto-sized to cover your consumption. Fine-tune below.
                </p>
                {fullRec && (
                  <div className="text-[12px] text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2">
                    Recommended: <span className="text-zinc-200 font-medium">{fullRec.panelsNeeded} panels</span>
                    {' '}<span className="text-zinc-600">({fullRec.systemSizeKwp.toFixed(1)} kWp, {(fullRec.coverageRatio * 100).toFixed(0)}% self-sufficiency)</span>
                  </div>
                )}
                <PanelControls panel={panel} onChange={setPanel} maxPanels={maxPanels} />
                {inverter && (
                  <SystemExtras
                    inverter={inverter}
                    battery={battery}
                    generator={generator}
                    onBatteryChange={setBattery}
                    onGeneratorChange={setGenerator}
                  />
                )}
              </div>
            )}

            {step === 'results' && result && (
              <div className="space-y-4">
                <ResultsDashboard
                  recommendation={recommendation}
                  consumption={consumption}
                  simulation={result}
                  fullRec={fullRec}
                />
                <div className="h-px bg-zinc-800/60" />
                <PricingInput pricing={pricing} onChange={setPricing} />
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="px-5 py-3 border-t border-zinc-800/80 flex items-center gap-2 shrink-0">
            {currentIdx > 0 && (
              <button onClick={() => goToStep(STEPS[currentIdx - 1].key)} className="px-3 py-1.5 text-[12px] text-zinc-500 hover:text-zinc-200 transition-colors">Back</button>
            )}
            <div className="flex-1" />
            {step === 'location' && <button onClick={handleLocationContinue} className="btn-primary">Continue</button>}
            {step === 'consumption' && <button onClick={handleConsumptionNext} disabled={consumption.annualKwh === 0} className="btn-primary">Continue</button>}
            {step === 'preferences' && <button onClick={handlePreferencesNext} className="btn-primary">Configure system</button>}
            {step === 'system' && (
              <button onClick={runSimulation} disabled={simulating || (!tmy && !engine)} className="btn-primary">
                {simulating ? 'Running...' : 'Simulate'}
              </button>
            )}
            {step === 'results' && result && (
              <button onClick={() => generateReport({ location, panel, consumption, recommendation, simulation: result })} className="px-3.5 py-1.5 text-[12px] text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
                Export PDF
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <SolarScene
              panel={panel}
              location={location}
              hour={hour}
              dayOfYear={dayOfYear}
              roofWidth={roofWidth}
              roofLength={roofLength}
              battery={battery}
              inverter={inverter}
              generator={generator}
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-4 bg-zinc-950/80 backdrop-blur border border-zinc-800/60 rounded-lg px-3 py-2">
              <TimeSlider label="Time" value={hour} min={5} max={21} step={0.5} display={`${Math.floor(hour)}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}`} onChange={setHour} />
              <div className="w-px h-3 bg-zinc-800" />
              <TimeSlider label="Date" value={dayOfYear} min={1} max={365} step={1} display={dayToLabel(dayOfYear)} onChange={setDayOfYear} />
            </div>
          </div>
          {result && (
            <div className="h-44 border-t border-zinc-800/80 bg-zinc-950 px-5 py-3">
              <MonthlyChart result={result} consumption={consumption} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function Field({ label, suffix, children }: { label: string; suffix?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-zinc-500 block mb-1">{label}</label>
      <div className="relative">
        {children}
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-zinc-600">{suffix}</span>}
      </div>
    </div>
  );
}

function TimeSlider({ label, value, min, max, step, display, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-zinc-600 w-7">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-24" />
      <span className="text-[11px] text-zinc-400 font-mono w-10">{display}</span>
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

/**
 * Generate a simple hourly PV production estimate per kWp from TMY data.
 * This is used before running the full WASM simulation for optimizer pre-sizing.
 */
function generateHourlyPvPerKwp(tmy: TMYData, _loc: Location, _panel: PanelConfig): number[] {
  const hourly: number[] = new Array(8760);
  for (let h = 0; h < 8760; h++) {
    // Simple model: PV output proportional to GHI * efficiency * performance ratio
    const ghi = tmy.ghi[h];
    const pr = 0.80; // typical performance ratio
    // kW per kWp = GHI (W/m2) / 1000 (STC irradiance) * PR
    hourly[h] = Math.max(0, (ghi / 1000) * pr);
  }
  return hourly;
}
