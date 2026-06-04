import type {
  SystemPreferences,
  ConsumptionProfile,
  BatteryConfig,
  InverterConfig,
  GeneratorConfig,
  FullSystemSpec,
  FullRecommendation,
  ElectricityPricing,
  DispatchSummary,
  GridMode,
} from '../types';
import { DEFAULT_BATTERY, defaultInverter } from './defaults';
import { runEnergyDispatch, monthlyToHourlyLoad } from './energy-dispatch';
import { projectBatteryLifetime } from './battery-degradation';
import { sizeGenerator, calculateGeneratorCosts } from './generator';

interface OptimizerInput {
  consumption: ConsumptionProfile;
  preferences: SystemPreferences;
  pricing: ElectricityPricing;
  maxPanels: number;
  panelWp: number;
  specificYield: number;  // estimated kWh/kWp/year
  pvHourlyKw: number[];   // 8760 hourly PV output per kWp installed
}

/**
 * Main optimizer: recommends a full system spec based on user preferences and constraints.
 */
export function optimizeSystem(input: OptimizerInput): FullRecommendation {
  const { consumption, preferences, pricing, maxPanels, panelWp, specificYield, pvHourlyKw } = input;
  const { gridMode, priority, autonomyDays } = preferences;

  // Step 1: Size PV array
  const panelCount = sizePvArray(consumption.annualKwh, specificYield, panelWp, maxPanels, priority);
  if (panelCount === 0) {
    // Edge case: no panels fit on roof — return minimal result
    return emptyRecommendation(gridMode);
  }
  const systemKwp = (panelCount * panelWp) / 1000;

  // (final PV scaling done after budget constraint below)

  // Step 2: Determine battery
  const wantsBattery = decideBattery(preferences, gridMode);
  let battery: BatteryConfig | null = null;
  if (wantsBattery) {
    battery = sizeBattery(consumption, gridMode, autonomyDays, priority);
  }

  // Step 3: Inverter
  const inverter = defaultInverter(systemKwp, wantsBattery);

  // Step 4: Generator (off-grid only, or hybrid with preference)
  let generator: GeneratorConfig | null = null;
  if (gridMode === 'off-grid') {
    // Estimate peak deficit for generator sizing
    const avgDailyKwh = consumption.annualKwh / 365;
    const peakDemandKw = avgDailyKwh / 6; // assume 6 peak hours
    generator = sizeGenerator(peakDemandKw);
  }

  // Step 5: Budget constraint — trim if over budget
  const totalCost = calculateSystemCost(panelCount, panelWp, inverter, battery, generator);
  let finalPanelCount = panelCount;
  let finalBattery = battery;
  let finalGenerator = generator;
  let finalInverter = inverter;

  if (preferences.budgetCapEur !== null && totalCost > preferences.budgetCapEur) {
    const result = applyBudgetConstraint(
      preferences.budgetCapEur, finalPanelCount, panelWp,
      finalInverter, finalBattery, finalGenerator, gridMode
    );
    finalPanelCount = result.panelCount;
    finalBattery = result.battery;
    finalGenerator = result.generator;
    finalInverter = result.inverter;
  }

  // Step 6: Run dispatch simulation
  const finalSystemKwp = (finalPanelCount * panelWp) / 1000;
  const finalPvHourly = pvHourlyKw.map((kw) => kw * finalSystemKwp);
  const hourlyLoad = monthlyToHourlyLoad(consumption.monthlyKwh);

  const dispatchResult = runEnergyDispatch({
    pvHourlyKw: finalPvHourly,
    loadHourlyKw: hourlyLoad,
    gridMode,
    inverter: finalInverter,
    battery: finalBattery,
    generator: finalGenerator,
  });

  // Step 7: Battery lifetime
  const batteryLifetime = finalBattery
    ? projectBatteryLifetime(finalBattery, dispatchResult.summary.batteryCycles)
    : null;

  // Step 8: Financial analysis
  const financials = calculateFinancials(
    finalPanelCount, panelWp, finalInverter, finalBattery, finalGenerator,
    dispatchResult.summary, batteryLifetime, pricing
  );

  const fullSpec: FullSystemSpec = {
    panels: {
      tilt: 0, azimuth: 180, // placeholder, user controls these
      ratedPower: panelWp, efficiency: 0.21, area: 1.95,
      tempCoeff: -0.34, noct: 45, quantity: finalPanelCount,
    },
    inverter: finalInverter,
    battery: finalBattery,
    generator: finalGenerator,
    gridMode,
  };

  return {
    panelsNeeded: finalPanelCount,
    systemSizeKwp: finalSystemKwp,
    annualProductionKwh: dispatchResult.summary.totalProduction,
    selfConsumptionRatio: dispatchResult.summary.selfConsumptionRatio,
    coverageRatio: dispatchResult.summary.selfSufficiencyRatio,
    estimatedCostEur: financials.totalInvestment,
    paybackYears: financials.paybackYears,
    co2SavedKgYear: dispatchResult.summary.selfConsumed * 0.4, // 400g CO2/kWh grid avg
    annualSavingsEur: financials.annualSavings,
    system: fullSpec,
    dispatch: dispatchResult.summary,
    batteryLifetime,
    annualFuelCostEur: financials.annualFuelCost,
    annualMaintenanceCostEur: financials.annualMaintenance,
    lcoeEurPerKwh: financials.lcoe,
    twentyFiveYearNpv: financials.npv25,
  };
}

// ─── Sub-functions ────────────────────────────────────────────────

function sizePvArray(
  annualKwh: number, specificYield: number, panelWp: number,
  maxPanels: number, priority: string,
): number {
  if (maxPanels <= 0) return 0;
  if (specificYield <= 0 || panelWp <= 0 || annualKwh <= 0) return 1;

  // Target coverage based on priority
  const targetCoverage = priority === 'independence' ? 1.1 : priority === 'cost' ? 0.75 : 0.9;
  const requiredKwp = (annualKwh * targetCoverage) / specificYield;
  const panelsNeeded = Math.ceil((requiredKwp * 1000) / panelWp);
  return Math.max(1, Math.min(panelsNeeded, maxPanels));
}

function decideBattery(prefs: SystemPreferences, gridMode: string): boolean {
  if (prefs.battery === 'yes') return true;
  if (prefs.battery === 'no') return false;
  // Auto: battery makes sense for off-grid, hybrid, or independence priority
  return gridMode === 'off-grid' || gridMode === 'hybrid' || prefs.priority === 'independence';
}

function sizeBattery(
  consumption: ConsumptionProfile,
  gridMode: string,
  autonomyDays: number,
  priority: string,
): BatteryConfig {
  const base = { ...DEFAULT_BATTERY };
  const avgDailyKwh = consumption.annualKwh / 365;

  if (gridMode === 'off-grid') {
    // Off-grid: size for N days of autonomy
    base.capacityKwh = Math.ceil(avgDailyKwh * autonomyDays / base.usablePercent);
  } else if (priority === 'independence') {
    // Hybrid/on-grid with independence priority: cover evening + night (~14h)
    base.capacityKwh = Math.ceil(avgDailyKwh * 0.6);
  } else {
    // Balanced: cover evening peak (~5h)
    base.capacityKwh = Math.ceil(avgDailyKwh * 0.3);
  }

  // Adjust charge/discharge rate to match capacity
  base.maxChargeKw = Math.ceil(base.capacityKwh / 2); // C/2 rate
  base.maxDischargeKw = base.maxChargeKw;

  return base;
}

function calculateSystemCost(
  panels: number, panelWp: number,
  inverter: InverterConfig,
  battery: BatteryConfig | null,
  generator: GeneratorConfig | null,
): number {
  const panelCost = panels * panelWp * 0.0012; // ~1.20 EUR/Wp installed
  const batteryCost = battery ? battery.capacityKwh * battery.costPerKwh : 0;
  const genCost = generator && generator.enabled ? generator.ratedPowerKw * 500 : 0; // ~500 EUR/kW
  return panelCost + inverter.costEur + batteryCost + genCost;
}

function applyBudgetConstraint(
  budget: number, panelCount: number, panelWp: number,
  inverter: InverterConfig, battery: BatteryConfig | null,
  generator: GeneratorConfig | null, gridMode: string,
): { panelCount: number; inverter: InverterConfig; battery: BatteryConfig | null; generator: GeneratorConfig | null } {
  let cost = calculateSystemCost(panelCount, panelWp, inverter, battery, generator);

  // Reduce panels first (keep at least 4)
  let pc = panelCount;
  while (cost > budget && pc > 4) {
    pc--;
    const inv = defaultInverter((pc * panelWp) / 1000, battery !== null);
    cost = calculateSystemCost(pc, panelWp, inv, battery, generator);
  }

  // If still over, reduce battery (keep minimum for off-grid)
  let bat = battery;
  if (cost > budget && bat) {
    const minCap = gridMode === 'off-grid' ? 5 : 0;
    while (cost > budget && bat && bat.capacityKwh > minCap) {
      bat = { ...bat, capacityKwh: bat.capacityKwh - 1 };
      cost = calculateSystemCost(pc, panelWp, inverter, bat, generator);
    }
    if (bat && bat.capacityKwh <= 0) bat = null;
  }

  const finalInverter = defaultInverter((pc * panelWp) / 1000, bat !== null);
  return { panelCount: pc, inverter: finalInverter, battery: bat, generator };
}

interface Financials {
  totalInvestment: number;
  annualSavings: number;
  paybackYears: number;
  annualFuelCost: number;
  annualMaintenance: number;
  lcoe: number;
  npv25: number;
}

function calculateFinancials(
  panels: number, panelWp: number,
  inverter: InverterConfig,
  battery: BatteryConfig | null,
  generator: GeneratorConfig | null,
  dispatch: DispatchSummary,
  batteryLifetime: { totalReplacementCost: number } | null,
  pricing: ElectricityPricing,
): Financials {
  const totalInvestment = calculateSystemCost(panels, panelWp, inverter, battery, generator);

  // Annual savings = avoided grid import + feed-in revenue
  const avoidedImport = dispatch.selfConsumed * pricing.pricePerKwh;
  const feedInRevenue = dispatch.gridExported * pricing.feedInTariff;

  // Generator costs
  const genCosts = generator && generator.enabled
    ? calculateGeneratorCosts(generator, dispatch.generatorRuntimeHours, dispatch.generatorFuelLiters)
    : null;

  const annualFuelCost = genCosts?.fuelCostEur ?? 0;
  const annualMaintenance = genCosts?.maintenanceCostEur ?? 0;

  const annualSavings = avoidedImport + feedInRevenue - annualFuelCost - annualMaintenance;

  // Payback
  const paybackYears = annualSavings > 0 ? totalInvestment / annualSavings : 99;

  // 25-year NPV (discount rate 3%)
  const discountRate = 0.03;
  let npv = -totalInvestment;
  for (let y = 1; y <= 25; y++) {
    const priceMultiplier = Math.pow(1 + pricing.annualIncrease, y);
    const yearSavings = (avoidedImport * priceMultiplier) + feedInRevenue - annualFuelCost - annualMaintenance;
    npv += yearSavings / Math.pow(1 + discountRate, y);
  }
  if (batteryLifetime) {
    npv -= batteryLifetime.totalReplacementCost / Math.pow(1 + discountRate, 12); // discounted
  }

  // LCOE
  const totalLifetimeEnergy = dispatch.totalProduction * 25 * 0.95; // 5% avg degradation
  const totalLifetimeCost = totalInvestment + (batteryLifetime?.totalReplacementCost ?? 0) +
    (annualFuelCost + annualMaintenance) * 25;
  const lcoe = totalLifetimeEnergy > 0 ? totalLifetimeCost / totalLifetimeEnergy : 0;

  return {
    totalInvestment,
    annualSavings: Math.max(0, annualSavings),
    paybackYears: Math.min(paybackYears, 99),
    annualFuelCost,
    annualMaintenance,
    lcoe,
    npv25: npv,
  };
}

function emptyRecommendation(gridMode: GridMode): FullRecommendation {
  return {
    panelsNeeded: 0,
    systemSizeKwp: 0,
    annualProductionKwh: 0,
    selfConsumptionRatio: 0,
    coverageRatio: 0,
    estimatedCostEur: 0,
    paybackYears: 99,
    co2SavedKgYear: 0,
    annualSavingsEur: 0,
    system: {
      panels: { tilt: 0, azimuth: 180, ratedPower: 0, efficiency: 0, area: 0, tempCoeff: 0, noct: 45, quantity: 0 },
      inverter: null as unknown as InverterConfig,
      battery: null,
      generator: null,
      gridMode,
    },
    dispatch: {
      totalProduction: 0, totalConsumption: 0, selfConsumed: 0,
      batteryThroughput: 0, gridImported: 0, gridExported: 0,
      generatorProduced: 0, generatorRuntimeHours: 0, generatorFuelLiters: 0,
      unmetLoadTotal: 0, selfSufficiencyRatio: 0, selfConsumptionRatio: 0,
      batteryCycles: 0, peakUnmetKw: 0,
    },
    batteryLifetime: null,
    annualFuelCostEur: 0,
    annualMaintenanceCostEur: 0,
    lcoeEurPerKwh: 0,
    twentyFiveYearNpv: 0,
  };
}
