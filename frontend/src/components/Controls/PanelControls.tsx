import type { PanelConfig } from '../../types';

interface PanelControlsProps {
  panel: PanelConfig;
  onChange: (cfg: PanelConfig) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <label className="flex items-center justify-between text-xs text-neutral-400 mb-1">
        <span>{label}</span>
        <span className="text-neutral-300 font-mono">{value}{unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500"
      />
    </div>
  );
}

export default function PanelControls({ panel, onChange }: PanelControlsProps) {
  const update = (key: keyof PanelConfig, value: number) => {
    onChange({ ...panel, [key]: value });
  };

  return (
    <div>
      <Slider label="Tilt" value={panel.tilt} min={0} max={90} step={1} unit="°" onChange={(v) => update('tilt', v)} />
      <Slider label="Azimuth" value={panel.azimuth} min={0} max={359} step={1} unit="°" onChange={(v) => update('azimuth', v)} />
      <Slider label="Quantity" value={panel.quantity} min={1} max={50} step={1} unit="" onChange={(v) => update('quantity', v)} />
      <Slider label="Power" value={panel.ratedPower} min={200} max={600} step={10} unit="Wp" onChange={(v) => update('ratedPower', v)} />
    </div>
  );
}
