import type { SystemPreferences, GridMode, OptimizationPriority, BatteryPreference } from '../../types';

interface PreferencesStepProps {
  preferences: SystemPreferences;
  onChange: (prefs: SystemPreferences) => void;
}

export default function PreferencesStep({ preferences, onChange }: PreferencesStepProps) {
  const update = <K extends keyof SystemPreferences>(key: K, value: SystemPreferences[K]) => {
    onChange({ ...preferences, [key]: value });
  };

  return (
    <div className="space-y-5">
      <p className="text-[13px] text-zinc-400 leading-relaxed">
        Define your system requirements. The optimizer will recommend components accordingly.
      </p>

      {/* Grid mode */}
      <div>
        <label className="text-[11px] text-zinc-500 block mb-2">Grid connection</label>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            ['on-grid', 'On-grid', 'Connected to utility grid'],
            ['off-grid', 'Off-grid', 'Fully independent'],
            ['hybrid', 'Hybrid', 'Grid + independence'],
          ] as [GridMode, string, string][]).map(([mode, label, desc]) => (
            <button
              key={mode}
              onClick={() => update('gridMode', mode)}
              className={`text-left p-2.5 rounded-md border transition-colors ${
                preferences.gridMode === mode
                  ? 'border-zinc-500 bg-zinc-800'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="text-[12px] text-zinc-200">{label}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Battery */}
      <div>
        <label className="text-[11px] text-zinc-500 block mb-2">Battery storage</label>
        <div className="flex gap-1.5">
          {([
            ['auto', 'Auto'],
            ['yes', 'Yes'],
            ['no', 'No'],
          ] as [BatteryPreference, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => update('battery', val)}
              className={`flex-1 py-2 text-[12px] rounded-md border transition-colors ${
                preferences.battery === val
                  ? 'border-zinc-500 bg-zinc-800 text-zinc-200'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Autonomy days (visible for off-grid) */}
      {preferences.gridMode === 'off-grid' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-zinc-500">Autonomy days</label>
            <span className="text-[12px] text-zinc-300 font-mono">{preferences.autonomyDays}d</span>
          </div>
          <input
            type="range"
            min={1} max={7} step={1}
            value={preferences.autonomyDays}
            onChange={(e) => update('autonomyDays', Number(e.target.value))}
            className="w-full"
          />
          <div className="text-[10px] text-zinc-600 mt-1">
            Battery sized to cover {preferences.autonomyDays} day{preferences.autonomyDays > 1 ? 's' : ''} without sun
          </div>
        </div>
      )}

      {/* Priority */}
      <div>
        <label className="text-[11px] text-zinc-500 block mb-2">Optimization priority</label>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            ['cost', 'Min. cost', 'Fastest payback'],
            ['balanced', 'Balanced', 'Best value'],
            ['independence', 'Max. indep.', 'Energy freedom'],
          ] as [OptimizationPriority, string, string][]).map(([val, label, desc]) => (
            <button
              key={val}
              onClick={() => update('priority', val)}
              className={`text-left p-2.5 rounded-md border transition-colors ${
                preferences.priority === val
                  ? 'border-zinc-500 bg-zinc-800'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="text-[12px] text-zinc-200">{label}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Budget cap */}
      <div>
        <label className="text-[11px] text-zinc-500 block mb-1.5">Budget limit (optional)</label>
        <input
          type="number"
          min={1000} max={200000} step={500}
          value={preferences.budgetCapEur ?? ''}
          onChange={(e) => update('budgetCapEur', e.target.value ? parseInt(e.target.value) : null)}
          placeholder="No limit"
          className="field-input"
        />
      </div>
    </div>
  );
}
