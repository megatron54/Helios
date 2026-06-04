import { useState } from 'react';
import type { PanelConfig } from '../../types';

interface PanelControlsProps {
  panel: PanelConfig;
  onChange: (cfg: PanelConfig) => void;
  maxPanels: number;
}

const PANEL_PRESETS: Record<string, Partial<PanelConfig>> = {
  'Standard 400W': { ratedPower: 400, efficiency: 0.205, area: 1.95, tempCoeff: -0.34, noct: 45 },
  'High-eff 450W': { ratedPower: 450, efficiency: 0.225, area: 2.0, tempCoeff: -0.29, noct: 43 },
  'Budget 350W': { ratedPower: 350, efficiency: 0.185, area: 1.89, tempCoeff: -0.38, noct: 47 },
  'Bifacial 500W': { ratedPower: 500, efficiency: 0.22, area: 2.27, tempCoeff: -0.32, noct: 44 },
};

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-zinc-500">{label}</span>
        <span className="text-[12px] text-zinc-300 font-mono tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export default function PanelControls({ panel, onChange, maxPanels }: PanelControlsProps) {
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
      <div className="mb-3">
        <label className="text-[11px] text-zinc-500 block mb-1">Module type</label>
        <select
          onChange={(e) => applyPreset(e.target.value)}
          className="field-input appearance-none cursor-pointer"
        >
          {Object.keys(PANEL_PRESETS).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <Slider label="Tilt" value={panel.tilt} min={0} max={90} step={1} unit="°" onChange={(v) => update('tilt', v)} />
      <Slider label="Azimuth" value={panel.azimuth} min={0} max={359} step={1} unit="°" onChange={(v) => update('azimuth', v)} />
      <Slider
        label="Panels"
        value={Math.min(panel.quantity, maxPanels)}
        min={1} max={maxPanels} step={1}
        unit={`/${maxPanels}`}
        onChange={(v) => update('quantity', v)}
      />

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-[11px] text-zinc-600 hover:text-zinc-400 mt-1 transition-colors"
      >
        {showAdvanced ? 'Hide advanced' : 'Advanced'}
      </button>

      {showAdvanced && (
        <div className="mt-2.5 pt-2.5 border-t border-zinc-800/60">
          <Slider label="Power" value={panel.ratedPower} min={200} max={700} step={10} unit=" Wp" onChange={(v) => update('ratedPower', v)} />
          <Slider label="Efficiency" value={Math.round(panel.efficiency * 100)} min={15} max={25} step={0.5} unit="%" onChange={(v) => update('efficiency', v / 100)} />
          <Slider label="Temp coeff" value={panel.tempCoeff} min={-0.5} max={-0.2} step={0.01} unit="%/°C" onChange={(v) => update('tempCoeff', v)} />
          <Slider label="NOCT" value={panel.noct} min={40} max={50} step={1} unit="°C" onChange={(v) => update('noct', v)} />
        </div>
      )}
    </div>
  );
}
