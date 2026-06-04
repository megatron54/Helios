interface TimeControlsProps {
  hour: number;
  dayOfYear: number;
  onHourChange: (h: number) => void;
  onDayChange: (d: number) => void;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayToMonth(doy: number): string {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let acc = 0;
  for (let i = 0; i < 12; i++) {
    if (acc + daysInMonth[i] >= doy) {
      return `${MONTH_LABELS[i]} ${doy - acc}`;
    }
    acc += daysInMonth[i];
  }
  return `Day ${doy}`;
}

export default function TimeControls({ hour, dayOfYear, onHourChange, onDayChange }: TimeControlsProps) {
  return (
    <div className="flex flex-col gap-4 min-w-64">
      <div>
        <label className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span>Time of day</span>
          <span className="text-neutral-300 font-mono">{String(hour).padStart(2, '0')}:00</span>
        </label>
        <input
          type="range"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => onHourChange(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
      </div>

      <div>
        <label className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span>Day of year</span>
          <span className="text-neutral-300 font-mono">{dayToMonth(dayOfYear)}</span>
        </label>
        <input
          type="range"
          min={1}
          max={365}
          value={dayOfYear}
          onChange={(e) => onDayChange(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
      </div>
    </div>
  );
}
