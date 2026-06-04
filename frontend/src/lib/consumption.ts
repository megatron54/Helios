import type { Appliance, ConsumptionProfile } from '../types';

/**
 * Monthly consumption weight factors accounting for seasonal variation.
 * Indexed 0-11 (Jan-Dec). Derived from EU residential load profiles.
 */
const MONTHLY_WEIGHTS: Record<string, number[]> = {
  essential: [1.05, 1.0, 0.95, 0.9, 0.88, 0.85, 0.85, 0.88, 0.9, 0.95, 1.0, 1.05],
  comfort: [1.6, 1.4, 1.1, 0.6, 0.3, 0.8, 1.5, 1.5, 0.8, 0.4, 1.0, 1.5],
  heating: [1.3, 1.2, 1.1, 0.9, 0.8, 0.7, 0.7, 0.7, 0.8, 0.9, 1.1, 1.3],
  mobility: [0.9, 0.9, 1.0, 1.0, 1.1, 1.1, 1.1, 1.1, 1.0, 1.0, 0.9, 0.9],
  other: [0.3, 0.3, 0.5, 0.8, 1.2, 1.5, 1.6, 1.5, 1.2, 0.7, 0.4, 0.3],
};

/**
 * Calculates the annual energy consumption of a single appliance in kWh.
 */
export function applianceAnnualKwh(appliance: Appliance): number {
  if (!appliance.enabled) return 0;
  return (appliance.powerW * appliance.hoursPerDay * appliance.daysPerYear * appliance.quantity) / 1000;
}

/**
 * Builds a full consumption profile from the list of appliances.
 */
export function calculateConsumptionProfile(appliances: Appliance[]): ConsumptionProfile {
  const annualKwh = appliances.reduce((sum, a) => sum + applianceAnnualKwh(a), 0);

  // Distribute annual consumption across months with seasonal weighting
  const monthlyKwh = new Array(12).fill(0);
  for (const app of appliances) {
    if (!app.enabled) continue;
    const appAnnual = applianceAnnualKwh(app);
    const weights = MONTHLY_WEIGHTS[app.category] ?? MONTHLY_WEIGHTS.essential;
    const weightSum = weights.reduce((a, b) => a + b, 0);

    for (let m = 0; m < 12; m++) {
      monthlyKwh[m] += appAnnual * (weights[m] / weightSum);
    }
  }

  return { appliances, annualKwh, monthlyKwh };
}

/**
 * Quick calculation of total daily peak power (for grid connection sizing).
 */
export function peakDemandKw(appliances: Appliance[]): number {
  // Diversity factor: not all appliances run simultaneously
  const totalPeak = appliances
    .filter((a) => a.enabled)
    .reduce((sum, a) => sum + a.powerW * a.quantity, 0);
  
  // Apply 0.6 diversity factor (typical residential)
  return (totalPeak * 0.6) / 1000;
}
