import type { SystemRecommendation, ConsumptionProfile, SimulationResult, FullRecommendation } from '../../types';

interface ResultsDashboardProps {
  recommendation: SystemRecommendation;
  consumption: ConsumptionProfile;
  simulation: SimulationResult | null;
  fullRec?: FullRecommendation | null;
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

export default function ResultsDashboard({ recommendation, consumption, simulation, fullRec }: ResultsDashboardProps) {
  const r = recommendation;
  const d = fullRec?.dispatch;
  const coverage = d ? (d.selfSufficiencyRatio * 100).toFixed(0) : (r.coverageRatio * 100).toFixed(0);

  return (
    <div>
      {/* Primary metrics */}
      <div className="grid grid-cols-2 gap-x-4 border-b border-zinc-800/60 pb-3 mb-3">
        <Stat label="System" value={fullRec?.systemSizeKwp.toFixed(1) ?? r.systemSizeKwp.toFixed(1)} unit={`kWp (${fullRec?.panelsNeeded ?? r.panelsNeeded}p)`} />
        <Stat
          label="Production"
          value={r.annualProductionKwh >= 10000 ? (r.annualProductionKwh / 1000).toFixed(1) : r.annualProductionKwh.toFixed(0)}
          unit={r.annualProductionKwh >= 10000 ? 'MWh/yr' : 'kWh/yr'}
        />
        <Stat label="Savings" value={fullRec?.annualSavingsEur.toFixed(0) ?? r.annualSavingsEur.toFixed(0)} unit="EUR/yr" />
        <Stat label="Payback" value={fullRec?.paybackYears.toFixed(1) ?? r.paybackYears.toFixed(1)} unit="years" />
      </div>

      {/* Coverage bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-zinc-500">Self-sufficiency</span>
          <span className="text-[12px] text-zinc-300 font-mono">{coverage}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-zinc-300 transition-all duration-500" style={{ width: `${Math.min(parseFloat(coverage), 100)}%` }} />
        </div>
      </div>

      {/* Energy flow (from dispatch) */}
      {d && (
        <div className="grid grid-cols-2 gap-x-4 border-b border-zinc-800/60 pb-3 mb-3">
          <Stat label="Self-consumed" value={(d.selfConsumed).toFixed(0)} unit="kWh/yr" />
          <Stat label="Grid import" value={d.gridImported.toFixed(0)} unit="kWh/yr" />
          {d.gridExported > 0 && <Stat label="Grid export" value={d.gridExported.toFixed(0)} unit="kWh/yr" />}
          {d.generatorProduced > 0 && <Stat label="Generator" value={d.generatorProduced.toFixed(0)} unit="kWh/yr" />}
          {d.batteryCycles > 0 && <Stat label="Battery cycles" value={d.batteryCycles.toFixed(0)} unit="/yr" />}
          {d.unmetLoadTotal > 0 && <Stat label="Unmet load" value={d.unmetLoadTotal.toFixed(0)} unit="kWh/yr" />}
        </div>
      )}

      {/* Secondary */}
      <div className="grid grid-cols-3 gap-x-3 border-b border-zinc-800/60 pb-3 mb-3">
        <Stat label="CO2 avoided" value={(r.co2SavedKgYear / 1000).toFixed(1)} unit="t/yr" />
        <Stat
          label="Consumption"
          value={consumption.annualKwh >= 10000 ? (consumption.annualKwh / 1000).toFixed(1) : consumption.annualKwh.toFixed(0)}
          unit={consumption.annualKwh >= 10000 ? 'MWh' : 'kWh'}
        />
        <Stat
          label="25-yr NPV"
          value={fullRec ? `${(fullRec.twentyFiveYearNpv / 1000).toFixed(0)}k` : '\u2014'}
          unit="EUR"
        />
      </div>

      {/* Generator + fuel costs */}
      {fullRec && (fullRec.annualFuelCostEur > 0 || fullRec.lcoeEurPerKwh > 0) && (
        <div className="grid grid-cols-3 gap-x-3 pb-2">
          {fullRec.annualFuelCostEur > 0 && <Stat label="Fuel cost" value={fullRec.annualFuelCostEur.toFixed(0)} unit="EUR/yr" />}
          <Stat label="LCOE" value={(fullRec.lcoeEurPerKwh * 100).toFixed(1)} unit="ct/kWh" />
          <Stat label="Investment" value={`${(fullRec.estimatedCostEur / 1000).toFixed(1)}k`} unit="EUR" />
        </div>
      )}

      {/* Battery lifetime */}
      {fullRec?.batteryLifetime && (
        <div className="text-[11px] text-zinc-600 mt-2">
          Battery: {fullRec.batteryLifetime.annualCycles.toFixed(0)} cycles/yr, replacement at year {fullRec.batteryLifetime.replacementYear}
        </div>
      )}

      {simulation && (
        <div className="text-[11px] text-zinc-600 mt-1">
          Specific yield: {simulation.specificYield.toFixed(0)} kWh/kWp | PR: {(simulation.performanceRatio * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
