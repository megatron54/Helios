import type { GeneratorConfig } from '../types';

/**
 * Full generator operating cost model for a year.
 */
export interface GeneratorAnnualCost {
  fuelLiters: number;
  fuelCostEur: number;
  maintenanceCostEur: number;
  totalCostEur: number;
  runtimeHours: number;
  scheduledServices: number; // number of 250h services
}

/**
 * Calculates annual operating costs for the diesel generator.
 */
export function calculateGeneratorCosts(
  gen: GeneratorConfig,
  runtimeHours: number,
  fuelLiters: number,
): GeneratorAnnualCost {
  const fuelCostEur = fuelLiters * gen.fuelCostPerLiter;
  const maintenanceCostEur = runtimeHours * gen.maintenanceCostPerHour;
  const scheduledServices = Math.floor(runtimeHours / 250);

  return {
    fuelLiters,
    fuelCostEur,
    maintenanceCostEur,
    totalCostEur: fuelCostEur + maintenanceCostEur,
    runtimeHours,
    scheduledServices,
  };
}

/**
 * Sizes a generator for off-grid use.
 * Rule: rated power should cover peak deficit + 20% headroom.
 */
export function sizeGenerator(peakDeficitKw: number): GeneratorConfig {
  // Standard diesel genset sizes: 3, 5, 7.5, 10, 15, 20 kW
  const standardSizes = [3, 5, 7.5, 10, 15, 20];
  const required = peakDeficitKw * 1.2; // 20% headroom
  const selected = standardSizes.find((s) => s >= required) ?? standardSizes[standardSizes.length - 1];

  return {
    enabled: true,
    ratedPowerKw: selected,
    fuelConsumptionLPerKwh: 0.33 + (selected > 10 ? -0.02 : 0.02), // larger units more efficient
    partialLoadPenalty: 1.3,
    fuelCostPerLiter: 1.55,
    maintenanceCostPerHour: 1.5 + selected * 0.1,
    autoStartSoc: 0.15,
    autoStopSoc: 0.80,
  };
}

/**
 * Fuel consumption at a given load factor.
 */
export function fuelAtLoadFactor(
  gen: GeneratorConfig,
  outputKw: number,
  durationHours: number,
): number {
  const loadFactor = outputKw / gen.ratedPowerKw;
  const penalty = loadFactor < 0.6 ? gen.partialLoadPenalty : 1.0;
  return outputKw * durationHours * gen.fuelConsumptionLPerKwh * penalty;
}
