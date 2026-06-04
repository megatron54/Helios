import { useMemo } from 'react';
import type { Appliance, ApplianceCategory } from '../../types';
import { getCategoryLabel, getCategoryOrder } from '../../data/appliances';
import { applianceAnnualKwh } from '../../lib/consumption';

interface ConsumptionEstimatorProps {
  appliances: Appliance[];
  onChange: (appliances: Appliance[]) => void;
}

function ApplianceRow({ appliance, onToggle, onQuantityChange }: {
  appliance: Appliance; onToggle: () => void; onQuantityChange: (qty: number) => void;
}) {
  const annual = applianceAnnualKwh(appliance);

  return (
    <div className={`flex items-center gap-2 py-1 px-1.5 rounded text-[12px] ${
      appliance.enabled ? '' : 'opacity-35'
    }`}>
      <input
        type="checkbox"
        checked={appliance.enabled}
        onChange={onToggle}
        className="accent-zinc-400 w-3 h-3 shrink-0"
      />
      <span className="flex-1 text-zinc-300 truncate">{appliance.name}</span>
      {appliance.enabled && (
        <>
          <select
            value={appliance.quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="w-11 text-[10px] bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-400"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}x</option>
            ))}
          </select>
          <span className="text-[10px] text-zinc-600 font-mono w-12 text-right tabular-nums">
            {annual.toFixed(0)}
          </span>
        </>
      )}
    </div>
  );
}

function CategorySection({ category, appliances, onToggle, onQuantityChange }: {
  category: ApplianceCategory; appliances: Appliance[];
  onToggle: (id: string) => void; onQuantityChange: (id: string, qty: number) => void;
}) {
  const items = appliances.filter((a) => a.category === category);
  const total = items.reduce((sum, a) => sum + applianceAnnualKwh(a), 0);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-0.5 px-1.5">
        <span className="text-[10px] text-zinc-600">{getCategoryLabel(category)}</span>
        <span className="text-[10px] text-zinc-700 font-mono tabular-nums">{total.toFixed(0)} kWh</span>
      </div>
      {items.map((a) => (
        <ApplianceRow
          key={a.id}
          appliance={a}
          onToggle={() => onToggle(a.id)}
          onQuantityChange={(qty) => onQuantityChange(a.id, qty)}
        />
      ))}
    </div>
  );
}

export default function ConsumptionEstimator({ appliances, onChange }: ConsumptionEstimatorProps) {
  const total = useMemo(
    () => appliances.reduce((sum, a) => sum + applianceAnnualKwh(a), 0),
    [appliances],
  );

  const handleToggle = (id: string) => {
    onChange(appliances.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };
  const handleQty = (id: string, qty: number) => {
    onChange(appliances.map((a) => a.id === id ? { ...a, quantity: qty } : a));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-zinc-800/60">
        <div>
          <span className="text-xl font-semibold text-zinc-100 font-mono tabular-nums">
            {total >= 10000 ? (total / 1000).toFixed(1) : total.toFixed(0)}
          </span>
          <span className="text-[12px] text-zinc-500 ml-1">
            {total >= 10000 ? 'MWh/year' : 'kWh/year'}
          </span>
        </div>
        <span className="text-[11px] text-zinc-600 font-mono">~{(total / 12).toFixed(0)}/mo</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {getCategoryOrder().map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            appliances={appliances}
            onToggle={handleToggle}
            onQuantityChange={handleQty}
          />
        ))}
      </div>
    </div>
  );
}
