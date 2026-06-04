import { useState, useEffect, useRef } from 'react';

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
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onHourChange((hour + 1) % 24);
      }, 200);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, hour, onHourChange]);

  return (
    <div className="flex flex-col gap-3 min-w-72">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlaying(!playing)}
          className="w-8 h-8 flex items-center justify-center rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs transition-colors"
        >
          {playing ? '■' : '▶'}
        </button>
        <div className="flex-1">
          <label className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Time</span>
            <span className="text-neutral-300 font-mono">{String(hour).padStart(2, '0')}:00</span>
          </label>
          <input
            type="range"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => onHourChange(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center justify-between text-xs text-neutral-400 mb-1">
          <span>Date</span>
          <span className="text-neutral-300 font-mono">{dayToMonth(dayOfYear)}</span>
        </label>
        <input
          type="range"
          min={1}
          max={365}
          value={dayOfYear}
          onChange={(e) => onDayChange(Number(e.target.value))}
          className="w-full accent-amber-500 h-1.5"
        />
      </div>
    </div>
  );
}
