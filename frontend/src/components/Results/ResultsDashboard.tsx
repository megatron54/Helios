import type { SystemRecommendation, ConsumptionProfile, SimulationResult } from '../../types';

interface ResultsDashboardProps {
  recommendation: SystemRecommendation;
  consumption: ConsumptionProfile;
  simulation: SimulationResult | null;
}

function MetricCard({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
  return (
    <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3">
      <div className="text-xs text-neutral-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold text-neutral-100 font-mono">{value}</span>
        <span className="text-xs text-neutral-400">{unit}</span>
      </div>
      {sub && <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function CoverageBar({ ratio }: { ratio: number }) {
  const pct = Math.min(ratio * 100, 150);
  const displayPct = (ratio * 100).toFixed(0);
  const barColor = ratio >= 0.85 ? 'bg-emerald-500' : ratio >= 0.6 ? 'bg-amber-500' : 'bg-red-400';

  return (
    <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-400">Energy Coverage</span>
        <span className="text-sm font-mono text-neutral-200">{displayPct}%</span>
      </div>
      <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-xs text-neutral-500 mt-1.5">
        {ratio >= 0.85 ? 'Excellent — covers most of your consumption'
          : ratio >= 0.6 ? 'Good — significant savings, room to expand'
          : 'Partial coverage — consider adding more panels'}
      </div>
    </div>
  );
}

export default function ResultsDashboard({ recommendation, consumption, simulation }: ResultsDashboardProps) {
  const r = recommendation;

  return (
    <div className="space-y-4">
      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard
          label="System Size"
          value={r.systemSizeKwp.toFixed(1)}
          unit="kWp"
          sub={`${r.panelsNeeded} panels`}
        />
        <MetricCard
          label="Annual Production"
          value={r.annualProductionKwh >= 10000
            ? (r.annualProductionKwh / 1000).toFixed(1)
            : r.annualProductionKwh.toFixed(0)}
          unit={r.annualProductionKwh >= 10000 ? 'MWh' : 'kWh'}
          sub={simulation ? `${simulation.specificYield.toFixed(0)} kWh/kWp` : undefined}
        />
        <MetricCard
          label="Annual Savings"
          value={r.annualSavingsEur.toFixed(0)}
          unit="EUR/yr"
          sub={`${r.selfConsumptionRatio > 0 ? (r.selfConsumptionRatio * 100).toFixed(0) : '—'}% self-consumed`}
        />
        <MetricCard
          label="Payback Period"
          value={r.paybackYears.toFixed(1)}
          unit="years"
          sub={`Investment: ${(r.estimatedCostEur / 1000).toFixed(1)}k EUR`}
        />
      </div>

      {/* Coverage bar */}
      <CoverageBar ratio={r.coverageRatio} />

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="CO2 Avoided"
          value={(r.co2SavedKgYear / 1000).toFixed(1)}
          unit="t/year"
        />
        <MetricCard
          label="Consumption"
          value={consumption.annualKwh >= 10000
            ? (consumption.annualKwh / 1000).toFixed(1)
            : consumption.annualKwh.toFixed(0)}
          unit={consumption.annualKwh >= 10000 ? 'MWh/yr' : 'kWh/yr'}
        />
        <MetricCard
          label="25-yr Net Savings"
          value={((r.annualSavingsEur * 25) - r.estimatedCostEur > 0)
            ? `${(((r.annualSavingsEur * 25) - r.estimatedCostEur) / 1000).toFixed(0)}k`
            : '—'}
          unit="EUR"
        />
      </div>

      {/* Fine print */}
      <p className="text-xs text-neutral-600 leading-relaxed">
        Estimates based on {r.systemSizeKwp.toFixed(1)} kWp system at EUR 1.20/Wp installed,
        electricity at EUR 0.25/kWh (+3%/yr), feed-in at EUR 0.08/kWh.
        Actual results depend on local conditions, shading, and consumption patterns.
      </p>
    </div>
  );
}
