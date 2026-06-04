import type { ElectricityPricing } from '../../types';

interface PricingInputProps {
  pricing: ElectricityPricing;
  onChange: (pricing: ElectricityPricing) => void;
}

export default function PricingInput({ pricing, onChange }: PricingInputProps) {
  const update = (key: keyof ElectricityPricing, value: number) => {
    onChange({ ...pricing, [key]: value });
  };

  return (
    <div className="space-y-2.5">
      <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Electricity Prices</h4>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-neutral-500 block mb-0.5">Price</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="0.80"
              value={pricing.pricePerKwh}
              onChange={(e) => update('pricePerKwh', parseFloat(e.target.value) || 0.25)}
              className="w-full px-2 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none pr-12"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">EUR/kWh</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-0.5">Feed-in</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.30"
              value={pricing.feedInTariff}
              onChange={(e) => update('feedInTariff', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none pr-12"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">EUR/kWh</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-0.5">Increase/yr</label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={(pricing.annualIncrease * 100).toFixed(1)}
              onChange={(e) => update('annualIncrease', (parseFloat(e.target.value) || 0) / 100)}
              className="w-full px-2 py-1.5 text-sm bg-neutral-800 border border-neutral-700 rounded text-neutral-200 focus:border-amber-500 focus:outline-none pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
