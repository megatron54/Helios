import type { ConsumptionProfile, SystemRecommendation, ElectricityPricing, PanelConfig } from '../types';

/**
 * Default electricity pricing for system economics.
 * Based on EU average residential prices (2024).
 */
export const DEFAULT_PRICING: ElectricityPricing = {
  pricePerKwh: 0.25,
  feedInTariff: 0.08,
  annualIncrease: 0.03,
};

/**
 * System cost assumptions (EUR per Wp installed, residential rooftop).
 * Includes panels, inverter, mounting, installation, permits.
 */
const COST_PER_WP = 1.2;   // EUR/Wp fully installed (2024 EU avg)
const DEGRADATION = 0.005;  // 0.5% annual degradation
const SYSTEM_LIFETIME = 25; // years

/**
 * CO2 emission factor for displaced grid electricity (EU mix).
 * Source: EEA, 2023 avg.
 */
const CO2_FACTOR_KG_PER_KWH = 0.256;

/**
 * Estimates self-consumption ratio based on system coverage.
 * Without battery, typical residential self-consumption is 25-40%.
 * With oversizing, self-consumption drops.
 */
function estimateSelfConsumption(coverageRatio: number): number {
  // Empirical curve: high coverage = lower self-consumption
  if (coverageRatio <= 0.3) return 0.85;
  if (coverageRatio <= 0.6) return 0.65;
  if (coverageRatio <= 0.8) return 0.50;
  if (coverageRatio <= 1.0) return 0.38;
  if (coverageRatio <= 1.3) return 0.30;
  return 0.25;
}

interface RecommendationInput {
  consumption: ConsumptionProfile;
  specificYield: number;  // kWh/kWp from simulation or estimate
  panelWp: number;        // rated power of chosen panel
  pricing?: ElectricityPricing;
}

/**
 * Calculates the recommended system size and economic metrics.
 */
export function calculateRecommendation({
  consumption,
  specificYield,
  panelWp,
  pricing = DEFAULT_PRICING,
}: RecommendationInput): SystemRecommendation {
  const annualConsumption = consumption.annualKwh;

  // Target: cover 80-100% of consumption (optimum economic sweet spot)
  const targetCoverage = 0.9;
  const targetProductionKwh = annualConsumption * targetCoverage;

  // Required system size
  const requiredKwp = specificYield > 0 ? targetProductionKwh / specificYield : 0;
  const panelsNeeded = Math.ceil((requiredKwp * 1000) / panelWp);
  const systemSizeKwp = (panelsNeeded * panelWp) / 1000;
  const annualProductionKwh = systemSizeKwp * specificYield;

  // Economic analysis
  const coverageRatio = annualConsumption > 0 ? annualProductionKwh / annualConsumption : 0;
  const selfConsumptionRatio = estimateSelfConsumption(coverageRatio);
  const selfConsumedKwh = annualProductionKwh * selfConsumptionRatio;
  const exportedKwh = annualProductionKwh - selfConsumedKwh;

  // Annual savings = avoided grid purchases + feed-in revenue
  const annualSavingsEur = selfConsumedKwh * pricing.pricePerKwh + exportedKwh * pricing.feedInTariff;

  // Total system cost
  const estimatedCostEur = systemSizeKwp * 1000 * COST_PER_WP;

  // Simple payback with escalating electricity prices
  let cumulativeSavings = 0;
  let paybackYears = SYSTEM_LIFETIME;
  for (let year = 1; year <= SYSTEM_LIFETIME; year++) {
    const degradedProduction = annualProductionKwh * Math.pow(1 - DEGRADATION, year - 1);
    const escalatedPrice = pricing.pricePerKwh * Math.pow(1 + pricing.annualIncrease, year - 1);
    const selfKwh = degradedProduction * selfConsumptionRatio;
    const expKwh = degradedProduction - selfKwh;
    cumulativeSavings += selfKwh * escalatedPrice + expKwh * pricing.feedInTariff;
    if (cumulativeSavings >= estimatedCostEur && paybackYears === SYSTEM_LIFETIME) {
      paybackYears = year;
    }
  }

  const co2SavedKgYear = annualProductionKwh * CO2_FACTOR_KG_PER_KWH;

  return {
    panelsNeeded,
    systemSizeKwp,
    annualProductionKwh,
    selfConsumptionRatio,
    coverageRatio,
    estimatedCostEur,
    paybackYears,
    co2SavedKgYear,
    annualSavingsEur,
  };
}

/**
 * Estimate specific yield when no simulation has been run.
 * Based on latitude (simple approximation for initial sizing).
 */
export function estimateSpecificYield(latitude: number): number {
  const absLat = Math.abs(latitude);
  // Tropical/subtropical: ~1600-1800, temperate: ~1000-1400, high lat: ~700-900
  if (absLat < 25) return 1700;
  if (absLat < 35) return 1500;
  if (absLat < 45) return 1300;
  if (absLat < 55) return 1050;
  return 850;
}

/**
 * Builds a recommended panel config from the recommendation.
 */
export function buildPanelConfig(
  recommendation: SystemRecommendation,
  baseConfig: PanelConfig,
  latitude: number,
): PanelConfig {
  return {
    ...baseConfig,
    quantity: recommendation.panelsNeeded,
    tilt: Math.round(Math.abs(latitude) * 0.9), // rule of thumb
    azimuth: latitude >= 0 ? 180 : 0,           // south in NH, north in SH
  };
}
