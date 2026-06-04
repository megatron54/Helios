import { useState } from 'react';
import type { PanelConfig } from '../../types';

interface PanelControlsProps {
  panel: PanelConfig;
  onChange: (cfg: PanelConfig) => void;
}

const PANEL_PRESETS: Record<string, Partial<PanelConfig>> = {
  'Standard 400W': { ratedPower: 400, efficiency: 0.205, area: 1.95, tempCoeff: -0.34, noct: 45 },
  'High-eff 450W': { ratedPower: 450, efficiency: 0.225, area: 2.0, tempCoeff: -0.29, noct: 43 },
  'Budget 350W': { ratedPower: 350, efficiency: 0.185, area: 1.89, tempCoeff: -0.38, noct: 47 },
  'Bifacial 500W': { ratedPower: 500, efficiency: 0.22, area: 2.27, tempCoeff: -0.32, noct: 44 },
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  tooltip,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  tooltip?: string;
}) {
  return (
    <div className="mb-2.5">
      <label className="flex items-center justify-between text-xs text-neutral-400 mb-0.5" title={tooltip}>
        <span>{label}</span>
        <span className="text-neutral-300 font-mono text-xs">{value}{unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500 h-1"
      />
    </div>
  );
}

export default function PanelControls({ panel, onChange }: PanelControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (key: keyof PanelConfig, value: number) => {
    onChange({ ...panel, [key]: value });
  };

  const applyPreset = (name: string) => {
    const preset = PANEL_PRESETS[name];
    if (preset) onChange({ ...panel, ...preset });
  };

  return (
    <div>
      {/* Preset selector */}
      <div className="mb-3">
        <label className="text-xs text-neutral-500 block mb-1">Module</label>
        <select
          onChange={(e) => applyPreset(e.target.value)}
          className="w-full px-2 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none"
        >
          {Object.keys(PANEL_PRESETS).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <Slider
        label="Tilt"
        value={panel.tilt}
        min={0} max={90} step={1} unit="°"
        onChange={(v) => update('tilt', v)}
        tooltip="Angle from horizontal. Optimal is roughly equal to latitude."
      />
      <Slider
        label="Azimuth"
        value={panel.azimuth}
        min={0} max={359} step={1} unit="°"
        onChange={(v) => update('azimuth', v)}
        tooltip="0°=North, 90°=East, 180°=South, 270°=West"
      />
      <Slider
        label="Panels"
        value={panel.quantity}
        min={1} max={60} step={1} unit=""
        onChange={(v) => update('quantity', v)}
      />

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-neutral-500 hover:text-neutral-300 mt-2 mb-1 transition-colors"
      >
        {showAdvanced ? '− Hide advanced' : '+ Show advanced'}
      </button>

      {showAdvanced && (
        <div className="mt-2 pt-2 border-t border-neutral-800">
          <Slider
            label="Power"
            value={panel.ratedPower}
            min={200} max={700} step={10} unit="Wp"
            onChange={(v) => update('ratedPower', v)}
            tooltip="Rated power at Standard Test Conditions"
          />
          <Slider
            label="Efficiency"
            value={Math.round(panel.efficiency * 100)}
            min={15} max={25} step={0.5} unit="%"
            onChange={(v) => update('efficiency', v / 100)}
          />
          <Slider
            label="Temp coeff"
            value={panel.tempCoeff}
            min={-0.5} max={-0.2} step={0.01} unit="%/°C"
            onChange={(v) => update('tempCoeff', v)}
            tooltip="Power temperature coefficient (Pmax)"
          />
          <Slider
            label="NOCT"
            value={panel.noct}
            min={40} max={50} step={1} unit="°C"
            onChange={(v) => update('noct', v)}
            tooltip="Nominal Operating Cell Temperature"
          />
        </div>
      )}
    </div>
  );
}
