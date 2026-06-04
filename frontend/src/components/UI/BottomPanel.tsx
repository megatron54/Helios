import type { SimulationResult } from '../../types';
import TimeControls from '../Controls/TimeControls';
import MonthlyChart from '../Charts/MonthlyChart';

interface BottomPanelProps {
  result: SimulationResult | null;
  hour: number;
  dayOfYear: number;
  onHourChange: (h: number) => void;
  onDayChange: (d: number) => void;
}

export default function BottomPanel({ result, hour, dayOfYear, onHourChange, onDayChange }: BottomPanelProps) {
  return (
    <div className="h-52 border-t border-neutral-800 flex items-center px-6 gap-8 shrink-0 bg-neutral-950">
      <TimeControls
        hour={hour}
        dayOfYear={dayOfYear}
        onHourChange={onHourChange}
        onDayChange={onDayChange}
      />

      {result && (
        <div className="flex-1 h-40">
          <MonthlyChart result={result} />
        </div>
      )}

      {!result && (
        <div className="flex-1 flex items-center justify-center text-xs text-neutral-600">
          Run a simulation to see production data
        </div>
      )}
    </div>
  );
}
