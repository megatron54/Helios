import type { Location, PanelConfig, SimulationResult, TMYData } from '../../types';
import LocationPicker from '../Map/LocationPicker';
import PanelControls from '../Controls/PanelControls';
import ResultsSummary from '../Charts/ResultsSummary';

interface SidebarProps {
  location: Location;
  panel: PanelConfig;
  onLocationChange: (loc: Location) => void;
  onPanelChange: (cfg: PanelConfig) => void;
  onTmyLoaded: (tmy: TMYData | null) => void;
  tmy: TMYData | null;
  result: SimulationResult | null;
  onSimulate: () => void;
  simulating: boolean;
}

export default function Sidebar({
  location,
  panel,
  onLocationChange,
  onPanelChange,
  onTmyLoaded,
  tmy,
  result,
  onSimulate,
  simulating,
}: SidebarProps) {
  return (
    <aside className="w-80 border-r border-neutral-800 flex flex-col overflow-y-auto shrink-0">
      <section className="p-4 border-b border-neutral-800">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Location</h2>
        <LocationPicker
          location={location}
          onChange={onLocationChange}
          onTmyLoaded={onTmyLoaded}
        />
      </section>

      <section className="p-4 border-b border-neutral-800">
        <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Panel Configuration</h2>
        <PanelControls panel={panel} onChange={onPanelChange} />
      </section>

      <section className="p-4 border-b border-neutral-800">
        <button
          disabled={!tmy || simulating}
          onClick={onSimulate}
          className="w-full py-2 px-4 text-sm font-medium rounded bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 transition-colors"
        >
          {simulating ? 'Simulating...' : tmy ? 'Run Simulation' : 'Select location first'}
        </button>
      </section>

      {result && (
        <section className="p-4">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Results</h2>
          <ResultsSummary result={result} />
        </section>
      )}
    </aside>
  );
}
