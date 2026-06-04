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

// Consumption estimator types

export interface Appliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  powerW: number;         // typical power draw in watts
  hoursPerDay: number;    // average hours of use per day
  daysPerYear: number;    // days active per year (seasonality)
  enabled: boolean;
  quantity: number;
}

export type ApplianceCategory = 'essential' | 'comfort' | 'mobility' | 'heating' | 'other';

export interface ConsumptionProfile {
  appliances: Appliance[];
  annualKwh: number;
  monthlyKwh: number[];   // 12 values
}

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

export interface ElectricityPricing {
  pricePerKwh: number;    // EUR/kWh
  feedInTariff: number;   // EUR/kWh for surplus sold
  annualIncrease: number; // expected annual price increase %
}
