import type { BatteryConfig, InverterConfig, GeneratorConfig, SystemPreferences } from '../types';

// ─── Default Battery ──────────────────────────────────────────────

export const DEFAULT_BATTERY: BatteryConfig = {
  capacityKwh: 10,
  usablePercent: 0.90,
  roundTripEfficiency: 0.92,
  maxChargeKw: 5,
  maxDischargeKw: 5,
  cycleLife: 6000,              // LFP typical
  degradationPerCycle: 0.00015, // ~0.015% per cycle
  costPerKwh: 450,              // EUR/kWh installed (2024 pricing)
};

// ─── Default Inverter ─────────────────────────────────────────────

export function defaultInverter(pvKwp: number, hasBattery: boolean): InverterConfig {
  const type = hasBattery ? 'hybrid' : (pvKwp > 6 ? 'string' : 'micro');
  const ratedPowerKw = Math.ceil(pvKwp * 1.1 * 10) / 10; // 10% oversize, round up
  const costPerKw = type === 'micro' ? 350 : type === 'hybrid' ? 280 : 200;

  return {
    type,
    ratedPowerKw,
    efficiency: type === 'micro' ? 0.965 : 0.975,
    mpptInputs: type === 'micro' ? 1 : Math.ceil(pvKwp / 5),
    costEur: Math.round(ratedPowerKw * costPerKw),
  };
}

// ─── Default Generator ────────────────────────────────────────────

export const DEFAULT_GENERATOR: GeneratorConfig = {
  enabled: true,
  ratedPowerKw: 5,
  fuelConsumptionLPerKwh: 0.35,   // diesel, ~3L/h at full load for 8.5kW
  partialLoadPenalty: 1.3,         // 30% more fuel at 50% load
  fuelCostPerLiter: 1.55,          // EUR/L diesel average EU
  maintenanceCostPerHour: 2.5,     // EUR/h (oil, filters, etc. amortized)
  autoStartSoc: 0.15,              // start generator when battery at 15%
  autoStopSoc: 0.80,               // stop when battery reaches 80%
};

// ─── Default Preferences ──────────────────────────────────────────

export const DEFAULT_PREFERENCES: SystemPreferences = {
  gridMode: 'on-grid',
  battery: 'auto',
  autonomyDays: 2,
  budgetCapEur: null,
  priority: 'balanced',
};
