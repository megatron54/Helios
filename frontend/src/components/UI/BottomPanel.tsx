import type { SimulationResult } from '../../types';
import TimeControls from '../Controls/TimeControls';

interface BottomPanelProps {
  result: SimulationResult | null;
  hour: number;
  dayOfYear: number;
  onHourChange: (h: number) => void;
  onDayChange: (d: number) => void;
}

export default function BottomPanel({ result, hour, dayOfYear, onHourChange, onDayChange }: BottomPanelProps) {
  return (
    <div className="h-48 border-t border-neutral-800 flex items-center px-6 gap-8 shrink-0 bg-neutral-950">
      <TimeControls
        hour={hour}
        dayOfYear={dayOfYear}
        onHourChange={onHourChange}
        onDayChange={onDayChange}
      />

      {result && (
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-neutral-500 text-xs block">Annual</span>
            <span className="text-neutral-100 font-medium">{result.annualEnergyKwh.toFixed(0)} kWh</span>
          </div>
          <div>
            <span className="text-neutral-500 text-xs block">Yield</span>
            <span className="text-neutral-100 font-medium">{result.specificYield.toFixed(0)} kWh/kWp</span>
          </div>
          <div>
            <span className="text-neutral-500 text-xs block">PR</span>
            <span className="text-neutral-100 font-medium">{(result.performanceRatio * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
