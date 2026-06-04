import { useMemo } from 'react';
import type { Appliance, ApplianceCategory } from '../../types';
import { getCategoryLabel, getCategoryOrder } from '../../data/appliances';
import { applianceAnnualKwh } from '../../lib/consumption';

interface ConsumptionEstimatorProps {
  appliances: Appliance[];
  onChange: (appliances: Appliance[]) => void;
}

function ApplianceRow({
  appliance,
  onToggle,
  onQuantityChange,
}: {
  appliance: Appliance;
  onToggle: () => void;
  onQuantityChange: (qty: number) => void;
}) {
  const annual = applianceAnnualKwh(appliance);

  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm transition-colors ${
      appliance.enabled ? 'bg-neutral-800/60' : 'opacity-50'
    }`}>
      <input
        type="checkbox"
        checked={appliance.enabled}
        onChange={onToggle}
        className="accent-amber-500 w-3.5 h-3.5 shrink-0"
      />
      <span className="flex-1 text-neutral-200 truncate">{appliance.name}</span>
      {appliance.enabled && (
        <>
          <select
            value={appliance.quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="w-12 text-xs bg-neutral-700 border border-neutral-600 rounded px-1 py-0.5 text-neutral-200"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}x</option>
            ))}
          </select>
          <span className="text-xs text-neutral-400 font-mono w-16 text-right">
            {annual >= 1000 ? `${(annual / 1000).toFixed(1)}M` : `${annual.toFixed(0)}`}
          </span>
        </>
      )}
    </div>
  );
}

function CategorySection({
  category,
  appliances,
  onToggle,
  onQuantityChange,
}: {
  category: ApplianceCategory;
  appliances: Appliance[];
  onToggle: (id: string) => void;
  onQuantityChange: (id: string, qty: number) => void;
}) {
  const categoryAppliances = appliances.filter((a) => a.category === category);
  const categoryTotal = categoryAppliances.reduce((sum, a) => sum + applianceAnnualKwh(a), 0);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
          {getCategoryLabel(category)}
        </h4>
        <span className="text-xs text-neutral-500 font-mono">
          {categoryTotal.toFixed(0)} kWh/yr
        </span>
      </div>
      <div className="space-y-0.5">
        {categoryAppliances.map((a) => (
          <ApplianceRow
            key={a.id}
            appliance={a}
            onToggle={() => onToggle(a.id)}
            onQuantityChange={(qty) => onQuantityChange(a.id, qty)}
          />
        ))}
      </div>
    </div>
  );
}

export default function ConsumptionEstimator({ appliances, onChange }: ConsumptionEstimatorProps) {
  const totalAnnual = useMemo(
    () => appliances.reduce((sum, a) => sum + applianceAnnualKwh(a), 0),
    [appliances],
  );

  const handleToggle = (id: string) => {
    onChange(appliances.map((a) => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleQuantityChange = (id: string, qty: number) => {
    onChange(appliances.map((a) => a.id === id ? { ...a, quantity: qty } : a));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Summary header */}
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-neutral-800">
        <div>
          <span className="text-2xl font-semibold text-neutral-100 font-mono">
            {totalAnnual >= 10000 
              ? `${(totalAnnual / 1000).toFixed(1)}` 
              : totalAnnual.toFixed(0)
            }
          </span>
          <span className="text-sm text-neutral-400 ml-1.5">
            {totalAnnual >= 10000 ? 'MWh/year' : 'kWh/year'}
          </span>
        </div>
        <span className="text-xs text-neutral-500">
          ~{(totalAnnual / 12).toFixed(0)} kWh/month
        </span>
      </div>

      {/* Appliance list by category */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {getCategoryOrder().map((cat) => (
          <CategorySection
            key={cat}
            category={cat}
            appliances={appliances}
            onToggle={handleToggle}
            onQuantityChange={handleQuantityChange}
          />
        ))}
      </div>
    </div>
  );
}
