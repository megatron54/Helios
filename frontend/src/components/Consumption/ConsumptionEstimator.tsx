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
    <div className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-[13px] transition-all ${
      appliance.enabled ? 'bg-white/[0.04]' : 'opacity-40'
    }`}>
      <input
        type="checkbox"
        checked={appliance.enabled}
        onChange={onToggle}
        className="accent-amber-500 w-3.5 h-3.5 shrink-0 rounded"
      />
      <span className="flex-1 text-white/70 truncate">{appliance.name}</span>
      {appliance.enabled && (
        <>
          <select
            value={appliance.quantity}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
            className="w-12 text-[11px] bg-white/[0.06] border border-white/[0.08] rounded-md px-1 py-0.5 text-white/60 focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}x</option>
            ))}
          </select>
          <span className="text-[11px] text-white/25 font-mono w-14 text-right">
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
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <h4 className="text-[10px] font-medium text-white/25 uppercase tracking-wider">
          {getCategoryLabel(category)}
        </h4>
        <span className="text-[10px] text-white/20 font-mono">
          {categoryTotal.toFixed(0)} kWh
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
      {/* Summary */}
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-white/[0.06]">
        <div>
          <span className="text-2xl font-semibold text-white font-mono tracking-tight">
            {totalAnnual >= 10000 
              ? `${(totalAnnual / 1000).toFixed(1)}` 
              : totalAnnual.toFixed(0)
            }
          </span>
          <span className="text-[13px] text-white/30 ml-1.5">
            {totalAnnual >= 10000 ? 'MWh/year' : 'kWh/year'}
          </span>
        </div>
        <span className="text-[11px] text-white/20 font-mono">
          ~{(totalAnnual / 12).toFixed(0)} kWh/mo
        </span>
      </div>

      {/* Appliance list */}
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
