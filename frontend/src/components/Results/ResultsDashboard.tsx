import type { SystemRecommendation, ConsumptionProfile, SimulationResult } from '../../types';

interface ResultsDashboardProps {
  recommendation: SystemRecommendation;
  consumption: ConsumptionProfile;
  simulation: SimulationResult | null;
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="py-2">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-[15px] text-zinc-100 font-mono tabular-nums mt-0.5">
        {value} <span className="text-[11px] text-zinc-500 font-sans">{unit}</span>
      </div>
    </div>
  );
}

export default function ResultsDashboard({ recommendation, consumption, simulation }: ResultsDashboardProps) {
  const r = recommendation;
  const coverage = (r.coverageRatio * 100).toFixed(0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 border-b border-zinc-800/60 pb-3 mb-3">
        <Stat label="System" value={r.systemSizeKwp.toFixed(1)} unit={`kWp (${r.panelsNeeded}p)`} />
        <Stat
          label="Production"
          value={r.annualProductionKwh >= 10000
            ? (r.annualProductionKwh / 1000).toFixed(1)
            : r.annualProductionKwh.toFixed(0)}
          unit={r.annualProductionKwh >= 10000 ? 'MWh/yr' : 'kWh/yr'}
        />
        <Stat label="Savings" value={r.annualSavingsEur.toFixed(0)} unit="EUR/yr" />
        <Stat label="Payback" value={r.paybackYears.toFixed(1)} unit="years" />
      </div>

      {/* Coverage */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-zinc-500">Coverage</span>
          <span className="text-[12px] text-zinc-300 font-mono">{coverage}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-300 transition-all duration-500"
            style={{ width: `${Math.min(parseFloat(coverage), 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-3 border-t border-zinc-800/60 pt-3">
        <Stat label="CO2 avoided" value={(r.co2SavedKgYear / 1000).toFixed(1)} unit="t/yr" />
        <Stat
          label="Consumption"
          value={consumption.annualKwh >= 10000
            ? (consumption.annualKwh / 1000).toFixed(1)
            : consumption.annualKwh.toFixed(0)}
          unit={consumption.annualKwh >= 10000 ? 'MWh' : 'kWh'}
        />
        <Stat
          label="25-yr net"
          value={((r.annualSavingsEur * 25) - r.estimatedCostEur > 0)
            ? `${(((r.annualSavingsEur * 25) - r.estimatedCostEur) / 1000).toFixed(0)}k`
            : '\u2014'}
          unit="EUR"
        />
      </div>

      {simulation && (
        <div className="text-[11px] text-zinc-600 mt-3">
          Specific yield: {simulation.specificYield.toFixed(0)} kWh/kWp | Investment: {(r.estimatedCostEur / 1000).toFixed(1)}k EUR
        </div>
      )}
    </div>
  );
}
