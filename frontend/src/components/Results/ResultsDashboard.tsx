import type { SystemRecommendation, ConsumptionProfile, SimulationResult } from '../../types';

interface ResultsDashboardProps {
  recommendation: SystemRecommendation;
  consumption: ConsumptionProfile;
  simulation: SimulationResult | null;
}

function MetricCard({ label, value, unit, accent, sub }: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <div className={`rounded-xl p-3.5 border transition-colors ${
      accent
        ? 'bg-amber-500/[0.05] border-amber-500/10'
        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.10]'
    }`}>
      <div className="text-[11px] text-white/30 mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-semibold font-mono tracking-tight ${accent ? 'text-amber-400' : 'text-white'}`}>
          {value}
        </span>
        <span className="text-[11px] text-white/30">{unit}</span>
      </div>
      {sub && <div className="text-[11px] text-white/20 mt-1">{sub}</div>}
    </div>
  );
}

function CoverageBar({ ratio }: { ratio: number }) {
  const pct = Math.min(ratio * 100, 150);
  const displayPct = (ratio * 100).toFixed(0);
  const barColor = ratio >= 0.85
    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
    : ratio >= 0.6
      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
      : 'bg-gradient-to-r from-red-500 to-red-400';

  return (
    <div className="rounded-xl p-3.5 bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] text-white/30">Energy coverage</span>
        <span className="text-[14px] font-mono font-semibold text-white">{displayPct}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="text-[11px] text-white/20 mt-2">
        {ratio >= 0.85 ? 'Excellent coverage for your consumption profile'
          : ratio >= 0.6 ? 'Good coverage with room to expand'
          : 'Partial coverage — consider adding panels'}
      </div>
    </div>
  );
}

export default function ResultsDashboard({ recommendation, consumption, simulation }: ResultsDashboardProps) {
  const r = recommendation;

  return (
    <div className="space-y-3">
      {/* Hero metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          label="System size"
          value={r.systemSizeKwp.toFixed(1)}
          unit="kWp"
          sub={`${r.panelsNeeded} panels`}
        />
        <MetricCard
          label="Annual production"
          value={r.annualProductionKwh >= 10000
            ? (r.annualProductionKwh / 1000).toFixed(1)
            : r.annualProductionKwh.toFixed(0)}
          unit={r.annualProductionKwh >= 10000 ? 'MWh' : 'kWh'}
          accent
          sub={simulation ? `${simulation.specificYield.toFixed(0)} kWh/kWp yield` : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <MetricCard
          label="Annual savings"
          value={r.annualSavingsEur.toFixed(0)}
          unit="EUR/yr"
          accent
          sub={`${r.selfConsumptionRatio > 0 ? (r.selfConsumptionRatio * 100).toFixed(0) : '\u2014'}% self-consumed`}
        />
        <MetricCard
          label="Payback"
          value={r.paybackYears.toFixed(1)}
          unit="years"
          sub={`${(r.estimatedCostEur / 1000).toFixed(1)}k EUR investment`}
        />
      </div>

      <CoverageBar ratio={r.coverageRatio} />

      {/* Secondary */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="CO2 avoided"
          value={(r.co2SavedKgYear / 1000).toFixed(1)}
          unit="t/yr"
        />
        <MetricCard
          label="Consumption"
          value={consumption.annualKwh >= 10000
            ? (consumption.annualKwh / 1000).toFixed(1)
            : consumption.annualKwh.toFixed(0)}
          unit={consumption.annualKwh >= 10000 ? 'MWh' : 'kWh'}
        />
        <MetricCard
          label="25-yr savings"
          value={((r.annualSavingsEur * 25) - r.estimatedCostEur > 0)
            ? `${(((r.annualSavingsEur * 25) - r.estimatedCostEur) / 1000).toFixed(0)}k`
            : '\u2014'}
          unit="EUR"
        />
      </div>

      <p className="text-[10px] text-white/15 leading-relaxed pt-1">
        Estimates based on {r.systemSizeKwp.toFixed(1)} kWp at 1.20 EUR/Wp installed.
        Actual results depend on local irradiance, shading, and consumption patterns.
      </p>
    </div>
  );
}
