export interface SunPosition {
  elevation: number;
  azimuth: number;
  zenith: number;
  declination: number;
  hourAngle: number;
  equationOfTime: number;
}

export interface HourlyResult {
  acPower: number;
  poaIrradiance: number;
  cellTemp: number;
  shading: number;
}

export interface MonthlyResult {
  energyKwh: number;
  irradiation: number;
  avgTemp: number;
  hoursSun: number;
}

export interface SimulationResult {
  annualEnergyKwh: number;
  specificYield: number;
  performanceRatio: number;
  capacityFactor: number;
  peakPowerKw: number;
  getHourly(): HourlyResult[];
  getMonthly(month: number): MonthlyResult;
}

export interface OptimalOrientation {
  tilt: number;
  azimuth: number;
  annualKwh: number;
}

export interface HeliosModule {
  runSimulation(
    lat: number, lon: number, elevation: number,
    tilt: number, azimuth: number,
    ratedPower: number, efficiency: number, area: number,
    tempCoeff: number, noct: number, quantity: number,
    groundAlbedo: number,
    ghi: Float64Array, dni: Float64Array, dhi: Float64Array, temp: Float64Array
  ): SimulationResult;

  optimizeOrientation(
    lat: number, lon: number, elevation: number,
    ratedPower: number, efficiency: number, area: number,
    tempCoeff: number, noct: number, quantity: number,
    ghi: Float64Array, dni: Float64Array, dhi: Float64Array, temp: Float64Array
  ): OptimalOrientation;

  getSunPosition(
    lat: number, lon: number, elevation: number,
    year: number, month: number, day: number,
    hour: number, minute: number, timezone: number
  ): SunPosition;
}

// ─── Panel ────────────────────────────────────────────────────────

export interface PanelConfig {
  tilt: number;
  azimuth: number;
  ratedPower: number;
  efficiency: number;
  area: number;
  tempCoeff: number;
  noct: number;
  quantity: number;
}

// ─── Battery ──────────────────────────────────────────────────────

export interface BatteryConfig {
  capacityKwh: number;           // total nameplate capacity
  usablePercent: number;         // depth of discharge (0.8 = 80%)
  roundTripEfficiency: number;   // 0.90 - 0.95 typical
  maxChargeKw: number;           // max charge rate
  maxDischargeKw: number;        // max discharge rate
  cycleLife: number;             // cycles at rated DoD before 70% capacity
  degradationPerCycle: number;   // fractional capacity loss per cycle (e.g. 0.0002)
  costPerKwh: number;            // EUR/kWh installed
}

// ─── Inverter ─────────────────────────────────────────────────────

export type InverterType = 'string' | 'micro' | 'hybrid';

export interface InverterConfig {
  type: InverterType;
  ratedPowerKw: number;
  efficiency: number;            // 0.96 - 0.98
  mpptInputs: number;
  costEur: number;
}

// ─── Diesel Generator ─────────────────────────────────────────────

export interface GeneratorConfig {
  enabled: boolean;
  ratedPowerKw: number;
  fuelConsumptionLPerKwh: number; // liters per kWh at rated load
  partialLoadPenalty: number;     // multiplier at 50% load (e.g. 1.3)
  fuelCostPerLiter: number;       // EUR/L
  maintenanceCostPerHour: number; // EUR/h of operation
  autoStartSoc: number;           // start when battery SOC drops below this (0-1)
  autoStopSoc: number;            // stop when battery reaches this SOC (0-1)
}

// ─── System Preferences ───────────────────────────────────────────

export type GridMode = 'on-grid' | 'off-grid' | 'hybrid';
export type OptimizationPriority = 'cost' | 'independence' | 'balanced';
export type BatteryPreference = 'yes' | 'no' | 'auto';

export interface SystemPreferences {
  gridMode: GridMode;
  battery: BatteryPreference;
  autonomyDays: number;           // off-grid: days of independence (1-7)
  budgetCapEur: number | null;    // null = no limit
  priority: OptimizationPriority;
}

// ─── Full System Spec ─────────────────────────────────────────────

export interface FullSystemSpec {
  panels: PanelConfig;
  inverter: InverterConfig;
  battery: BatteryConfig | null;
  generator: GeneratorConfig | null;
  gridMode: GridMode;
}

// ─── Energy Dispatch (hourly simulation output) ───────────────────

export interface HourlyDispatch {
  pvProduction: number;       // kWh produced by panels
  directConsumption: number;  // kWh consumed directly from PV
  batteryCharge: number;      // kWh into battery
  batteryDischarge: number;   // kWh out of battery
  gridImport: number;         // kWh imported from grid
  gridExport: number;         // kWh exported to grid
  generatorOutput: number;    // kWh from diesel generator
  unmetLoad: number;          // kWh of demand not met (off-grid failure)
  soc: number;                // battery state of charge (0-1)
}

export interface DispatchSummary {
  totalProduction: number;
  totalConsumption: number;
  selfConsumed: number;
  batteryThroughput: number;  // total kWh cycled through battery
  gridImported: number;
  gridExported: number;
  generatorProduced: number;
  generatorRuntimeHours: number;
  generatorFuelLiters: number;
  unmetLoadTotal: number;
  selfSufficiencyRatio: number; // (selfConsumed + batteryDischarge) / totalConsumption
  selfConsumptionRatio: number; // directConsumption / totalProduction
  batteryCycles: number;        // full equivalent cycles per year
  peakUnmetKw: number;          // worst-case hourly deficit
}

// ─── Battery Degradation ──────────────────────────────────────────

export interface BatteryLifetimeProjection {
  yearlyCapacity: number[];     // capacity at end of each year (kWh)
  replacementYear: number;      // year when capacity < 70% nameplate
  annualCycles: number;
  totalReplacementCost: number; // cost of replacement(s) over 25 years
}

// ─── Extended Recommendation ──────────────────────────────────────

export interface SystemRecommendation {
  panelsNeeded: number;
  systemSizeKwp: number;
  annualProductionKwh: number;
  selfConsumptionRatio: number;
  coverageRatio: number;
  estimatedCostEur: number;
  paybackYears: number;
  co2SavedKgYear: number;
  annualSavingsEur: number;
}

export interface FullRecommendation extends SystemRecommendation {
  system: FullSystemSpec;
  dispatch: DispatchSummary;
  batteryLifetime: BatteryLifetimeProjection | null;
  annualFuelCostEur: number;
  annualMaintenanceCostEur: number;
  lcoeEurPerKwh: number;           // levelized cost of energy
  twentyFiveYearNpv: number;       // net present value over 25 years
}

// ─── Location, TMY, Consumption ───────────────────────────────────

export interface Location {
  latitude: number;
  longitude: number;
  elevation: number;
  name?: string;
}

export interface TMYData {
  ghi: Float64Array;
  dni: Float64Array;
  dhi: Float64Array;
  temperature: Float64Array;
}

export interface Appliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  powerW: number;
  hoursPerDay: number;
  daysPerYear: number;
  enabled: boolean;
  quantity: number;
}

export type ApplianceCategory = 'essential' | 'comfort' | 'mobility' | 'heating' | 'other';

export interface ConsumptionProfile {
  appliances: Appliance[];
  annualKwh: number;
  monthlyKwh: number[];
}

// ─── Pricing ──────────────────────────────────────────────────────

export interface ElectricityPricing {
  pricePerKwh: number;
  feedInTariff: number;
  annualIncrease: number;
}
