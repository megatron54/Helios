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
    <div>
      <div className="text-[11px] text-zinc-500 mb-2">Pricing assumptions</div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-zinc-600 block mb-0.5">Price (EUR/kWh)</label>
          <input
            type="number" step="0.01" min="0.05" max="0.80"
            value={pricing.pricePerKwh}
            onChange={(e) => update('pricePerKwh', parseFloat(e.target.value) || 0.25)}
            className="field-input !text-[11px] !py-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-600 block mb-0.5">Feed-in (EUR)</label>
          <input
            type="number" step="0.01" min="0" max="0.30"
            value={pricing.feedInTariff}
            onChange={(e) => update('feedInTariff', parseFloat(e.target.value) || 0)}
            className="field-input !text-[11px] !py-1"
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-600 block mb-0.5">Increase (%/yr)</label>
          <input
            type="number" step="0.5" min="0" max="10"
            value={(pricing.annualIncrease * 100).toFixed(1)}
            onChange={(e) => update('annualIncrease', (parseFloat(e.target.value) || 0) / 100)}
            className="field-input !text-[11px] !py-1"
          />
        </div>
      </div>
    </div>
  );
}
