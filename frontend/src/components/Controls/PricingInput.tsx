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
    <div className="space-y-3">
      <h4 className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Electricity pricing</h4>
      <div className="grid grid-cols-3 gap-2.5">
        <div>
          <label className="text-[10px] text-white/25 block mb-1">Price</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="0.80"
              value={pricing.pricePerKwh}
              onChange={(e) => update('pricePerKwh', parseFloat(e.target.value) || 0.25)}
              className="w-full px-2.5 py-1.5 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:border-amber-500/40 focus:outline-none font-mono pr-10"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20">EUR</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-white/25 block mb-1">Feed-in</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.30"
              value={pricing.feedInTariff}
              onChange={(e) => update('feedInTariff', parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:border-amber-500/40 focus:outline-none font-mono pr-10"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20">EUR</span>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-white/25 block mb-1">Increase</label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={(pricing.annualIncrease * 100).toFixed(1)}
              onChange={(e) => update('annualIncrease', (parseFloat(e.target.value) || 0) / 100)}
              className="w-full px-2.5 py-1.5 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:border-amber-500/40 focus:outline-none font-mono pr-7"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
