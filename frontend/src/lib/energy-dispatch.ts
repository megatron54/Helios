import type {
  BatteryConfig,
  InverterConfig,
  GeneratorConfig,
  GridMode,
  HourlyDispatch,
  DispatchSummary,
} from '../types';

interface DispatchInput {
  /** Hourly PV production in kW (8760 values) */
  pvHourlyKw: number[];
  /** Hourly consumption in kW (8760 values) */
  loadHourlyKw: number[];
  /** System grid mode */
  gridMode: GridMode;
  /** Inverter config (applies efficiency to PV output) */
  inverter: InverterConfig;
  /** Battery config, null if no battery */
  battery: BatteryConfig | null;
  /** Generator config, null if no generator */
  generator: GeneratorConfig | null;
}

interface DispatchOutput {
  hourly: HourlyDispatch[];
  summary: DispatchSummary;
}

/**
 * Runs hourly energy dispatch simulation across 8,760 hours.
 * Models energy flow: PV → Load → Battery → Grid/Generator
 */
export function runEnergyDispatch(input: DispatchInput): DispatchOutput {
  const { pvHourlyKw, loadHourlyKw, gridMode, inverter, battery, generator } = input;
  const hours = Math.min(pvHourlyKw.length, loadHourlyKw.length, 8760);

  // Battery state
  const usableCapacity = battery ? battery.capacityKwh * battery.usablePercent : 0;
  let soc = battery ? 0.5 : 0; // start at 50% SOC
  let socKwh = soc * usableCapacity;

  // Accumulators
  let totalProd = 0, totalCons = 0, selfConsumed = 0;
  let battCharged = 0, battDischarged = 0;
  let gridImp = 0, gridExp = 0;
  let genProduced = 0, genHours = 0, genFuel = 0;
  let unmetTotal = 0, peakUnmet = 0;

  const hourly: HourlyDispatch[] = new Array(hours);

  for (let h = 0; h < hours; h++) {
    // Apply inverter efficiency to PV output
    const pvRaw = pvHourlyKw[h];
    const pvAc = Math.min(pvRaw * inverter.efficiency, inverter.ratedPowerKw);

    const load = loadHourlyKw[h];
    totalProd += pvAc;
    totalCons += load;

    let direct = 0, bCharge = 0, bDischarge = 0;
    let gImport = 0, gExport = 0, genOut = 0, unmet = 0;

    const surplus = pvAc - load;

    if (surplus >= 0) {
      // PV covers load entirely
      direct = load;
      let excess = surplus;

      // Charge battery with excess
      if (battery && socKwh < usableCapacity) {
        const chargeRoom = usableCapacity - socKwh;
        const maxCharge = Math.min(excess, battery.maxChargeKw, chargeRoom / battery.roundTripEfficiency);
        bCharge = maxCharge;
        socKwh += maxCharge * battery.roundTripEfficiency;
        excess -= maxCharge;
      }

      // Export remainder to grid (on-grid/hybrid only)
      if (excess > 0) {
        if (gridMode === 'on-grid' || gridMode === 'hybrid') {
          gExport = excess;
        }
        // Off-grid: curtailed (lost)
      }
    } else {
      // Deficit: PV doesn't cover load
      direct = pvAc;
      let deficit = -surplus; // positive value

      // Discharge battery
      if (battery && socKwh > 0) {
        const available = socKwh;
        const maxDischarge = Math.min(deficit, battery.maxDischargeKw, available);
        bDischarge = maxDischarge;
        socKwh -= maxDischarge;
        deficit -= maxDischarge;
      }

      // Import from grid (on-grid/hybrid)
      if (deficit > 0 && (gridMode === 'on-grid' || gridMode === 'hybrid')) {
        gImport = deficit;
        deficit = 0;
      }

      // Generator (off-grid or hybrid with generator)
      if (deficit > 0 && generator && generator.enabled) {
        // Check SOC threshold for auto-start
        const currentSoc = battery ? socKwh / usableCapacity : 0;
        if (currentSoc <= generator.autoStartSoc || deficit > 0) {
          // Generator runs at rated power, charges battery with surplus
          const genPower = generator.ratedPowerKw;
          genOut = Math.min(genPower, deficit);
          deficit -= genOut;

          // If generator has excess capacity, charge battery
          if (battery && genPower > genOut) {
            const genExcess = genPower - genOut;
            const chargeRoom = usableCapacity - socKwh;
            const toCharge = Math.min(genExcess, battery.maxChargeKw, chargeRoom);
            bCharge += toCharge;
            socKwh += toCharge * battery.roundTripEfficiency;
            genOut += toCharge; // total generator output
          }

          // Fuel calculation with partial load penalty
          const loadFactor = genOut / genPower;
          const penalty = loadFactor < 0.6 ? generator.partialLoadPenalty : 1.0;
          const fuelThisHour = genOut * generator.fuelConsumptionLPerKwh * penalty;
          genFuel += fuelThisHour;
          genHours += 1;
        }
      }

      // Unmet load
      if (deficit > 0) {
        unmet = deficit;
        peakUnmet = Math.max(peakUnmet, unmet);
      }
    }

    // Clamp SOC
    if (battery) {
      socKwh = Math.max(0, Math.min(usableCapacity, socKwh));
      soc = socKwh / usableCapacity;
    }

    // Accumulate
    selfConsumed += direct;
    battCharged += bCharge;
    battDischarged += bDischarge;
    gridImp += gImport;
    gridExp += gExport;
    genProduced += genOut;
    unmetTotal += unmet;

    hourly[h] = {
      pvProduction: pvAc,
      directConsumption: direct,
      batteryCharge: bCharge,
      batteryDischarge: bDischarge,
      gridImport: gImport,
      gridExport: gExport,
      generatorOutput: genOut,
      unmetLoad: unmet,
      soc,
    };
  }

  // Battery cycles: full equivalent cycles = total throughput / usable capacity
  const batteryCycles = usableCapacity > 0
    ? (battCharged + battDischarged) / 2 / usableCapacity
    : 0;

  const summary: DispatchSummary = {
    totalProduction: totalProd,
    totalConsumption: totalCons,
    selfConsumed: selfConsumed + battDischarged,
    batteryThroughput: battCharged + battDischarged,
    gridImported: gridImp,
    gridExported: gridExp,
    generatorProduced: genProduced,
    generatorRuntimeHours: genHours,
    generatorFuelLiters: genFuel,
    unmetLoadTotal: unmetTotal,
    selfSufficiencyRatio: totalCons > 0
      ? Math.min(1, (selfConsumed + battDischarged + genProduced) / totalCons)
      : 0,
    selfConsumptionRatio: totalProd > 0
      ? Math.min(1, (selfConsumed + battCharged) / totalProd)
      : 0,
    batteryCycles,
    peakUnmetKw: peakUnmet,
  };

  return { hourly, summary };
}

/**
 * Converts monthly kWh consumption to an 8760-hour load profile.
 * Uses a simple daily pattern with morning and evening peaks.
 */
export function monthlyToHourlyLoad(monthlyKwh: number[]): number[] {
  const hourly: number[] = new Array(8760).fill(0);
  if (!monthlyKwh || monthlyKwh.length < 12) return hourly;

  // Daily load shape (fraction of daily total per hour)
  // Peaks at 8-9am and 6-9pm, low at night
  const pattern = [
    0.02, 0.015, 0.015, 0.015, 0.02, 0.03, // 0-5
    0.045, 0.06, 0.065, 0.055, 0.05, 0.045, // 6-11
    0.045, 0.04, 0.035, 0.035, 0.04, 0.055, // 12-17
    0.07, 0.075, 0.065, 0.055, 0.04, 0.03,  // 18-23
  ];

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let hourIdx = 0;

  for (let m = 0; m < 12; m++) {
    const dailyKwh = monthlyKwh[m] / daysInMonth[m];
    for (let d = 0; d < daysInMonth[m]; d++) {
      for (let h = 0; h < 24; h++) {
        hourly[hourIdx++] = dailyKwh * pattern[h];
      }
    }
  }

  return hourly;
}
