import type { SimulationResult } from '../../types';

interface ResultsSummaryProps {
  result: SimulationResult;
}

export default function ResultsSummary({ result }: ResultsSummaryProps) {
  const metrics = [
    { label: 'Annual Energy', value: `${result.annualEnergyKwh.toFixed(0)} kWh` },
    { label: 'Specific Yield', value: `${result.specificYield.toFixed(0)} kWh/kWp` },
    { label: 'Performance Ratio', value: `${(result.performanceRatio * 100).toFixed(1)}%` },
    { label: 'Capacity Factor', value: `${(result.capacityFactor * 100).toFixed(1)}%` },
    { label: 'Installed Capacity', value: `${result.peakPowerKw.toFixed(1)} kWp` },
  ];

  return (
    <div className="space-y-2">
      {metrics.map(({ label, value }) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-neutral-400">{label}</span>
          <span className="text-neutral-100 font-mono">{value}</span>
        </div>
      ))}
    </div>
  );
}
