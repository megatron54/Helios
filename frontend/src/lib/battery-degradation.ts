import type { BatteryConfig, BatteryLifetimeProjection } from '../types';

/**
 * Projects battery capacity degradation over 25 years based on annual cycles.
 *
 * Model: capacity[year] = nameplate * (1 - degradationPerCycle * cumulativeCycles)
 * Battery is replaced when capacity drops below 70% of nameplate.
 */
export function projectBatteryLifetime(
  battery: BatteryConfig,
  annualCycles: number,
): BatteryLifetimeProjection {
  const years = 25;
  const yearlyCapacity: number[] = [];
  const replacementThreshold = 0.70; // 70% of nameplate = end of life
  let replacementYear = years + 1; // no replacement if never hits threshold
  let totalReplacementCost = 0;
  let cumulativeCycles = 0;
  let currentCapacity = battery.capacityKwh;
  let replaced = false;

  for (let y = 1; y <= years; y++) {
    cumulativeCycles += annualCycles;

    // Capacity fade: linear model based on total cycles
    const fadeTotal = battery.degradationPerCycle * cumulativeCycles;
    currentCapacity = battery.capacityKwh * (1 - fadeTotal);

    // If dropped below threshold, trigger replacement
    if (currentCapacity < battery.capacityKwh * replacementThreshold && !replaced) {
      replacementYear = y;
      replaced = true;
      // After replacement, reset capacity (assume same battery model)
      currentCapacity = battery.capacityKwh;
      cumulativeCycles = 0;
      // Second battery cost (inflation-adjusted roughly)
      totalReplacementCost += battery.capacityKwh * battery.costPerKwh * 0.6; // batteries get cheaper
    }

    yearlyCapacity.push(currentCapacity);
  }

  return {
    yearlyCapacity,
    replacementYear,
    annualCycles,
    totalReplacementCost,
  };
}

/**
 * Estimates the effective usable capacity at a given year considering degradation.
 */
export function effectiveCapacityAtYear(
  battery: BatteryConfig,
  annualCycles: number,
  year: number,
): number {
  const fade = battery.degradationPerCycle * annualCycles * year;
  const remaining = battery.capacityKwh * (1 - fade);
  return Math.max(0, remaining * battery.usablePercent);
}
