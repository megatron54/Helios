import type { BatteryConfig, InverterConfig, GeneratorConfig } from '../../types';

interface SystemExtrasProps {
  inverter: InverterConfig;
  battery: BatteryConfig | null;
  generator: GeneratorConfig | null;
  onBatteryChange: (b: BatteryConfig | null) => void;
  onGeneratorChange: (g: GeneratorConfig | null) => void;
}

export default function SystemExtras({
  inverter, battery, generator,
  onBatteryChange, onGeneratorChange,
}: SystemExtrasProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-zinc-800/60">
      {/* Inverter (read-only, auto-sized) */}
      <div>
        <div className="text-[11px] text-zinc-500 mb-1.5">Inverter</div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
            <div className="text-zinc-600">Type</div>
            <div className="text-zinc-300 capitalize">{inverter.type}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
            <div className="text-zinc-600">Power</div>
            <div className="text-zinc-300 font-mono">{inverter.ratedPowerKw} kW</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
            <div className="text-zinc-600">Efficiency</div>
            <div className="text-zinc-300 font-mono">{(inverter.efficiency * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Battery */}
      {battery && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500">Battery</span>
            <button
              onClick={() => onBatteryChange(null)}
              className="text-[10px] text-zinc-600 hover:text-zinc-400"
            >
              Remove
            </button>
          </div>
          <div className="space-y-2">
            <SliderField
              label="Capacity"
              value={battery.capacityKwh}
              min={3} max={60} step={1}
              unit="kWh"
              onChange={(v) => onBatteryChange({ ...battery, capacityKwh: v })}
            />
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
                <div className="text-zinc-600">DoD</div>
                <div className="text-zinc-300 font-mono">{(battery.usablePercent * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
                <div className="text-zinc-600">Efficiency</div>
                <div className="text-zinc-300 font-mono">{(battery.roundTripEfficiency * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
                <div className="text-zinc-600">Cycle life</div>
                <div className="text-zinc-300 font-mono">{battery.cycleLife}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generator */}
      {generator && generator.enabled && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500">Generator</span>
            <button
              onClick={() => onGeneratorChange({ ...generator, enabled: false })}
              className="text-[10px] text-zinc-600 hover:text-zinc-400"
            >
              Remove
            </button>
          </div>
          <div className="space-y-2">
            <SliderField
              label="Rated power"
              value={generator.ratedPowerKw}
              min={3} max={20} step={0.5}
              unit="kW"
              onChange={(v) => onGeneratorChange({ ...generator, ratedPowerKw: v })}
            />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
                <div className="text-zinc-600">Fuel cost</div>
                <div className="text-zinc-300 font-mono">{generator.fuelCostPerLiter.toFixed(2)} EUR/L</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5">
                <div className="text-zinc-600">Auto-start SOC</div>
                <div className="text-zinc-300 font-mono">{(generator.autoStartSoc * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SliderField({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-zinc-500">{label}</span>
        <span className="text-[12px] text-zinc-300 font-mono tabular-nums">{value} {unit}</span>
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
