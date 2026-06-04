import type { Appliance, ApplianceCategory } from '../types';

/**
 * Default appliance library with realistic power consumption values.
 * Sources: EU energy labels, manufacturer specs, IEA residential data.
 */

interface ApplianceTemplate {
  name: string;
  category: ApplianceCategory;
  powerW: number;
  hoursPerDay: number;
  daysPerYear: number;
}

const TEMPLATES: ApplianceTemplate[] = [
  // Essential
  { name: 'Refrigerator', category: 'essential', powerW: 150, hoursPerDay: 24, daysPerYear: 365 },
  { name: 'Freezer', category: 'essential', powerW: 120, hoursPerDay: 24, daysPerYear: 365 },
  { name: 'LED Lighting', category: 'essential', powerW: 100, hoursPerDay: 5, daysPerYear: 365 },
  { name: 'Washing Machine', category: 'essential', powerW: 500, hoursPerDay: 1, daysPerYear: 260 },
  { name: 'Dryer', category: 'essential', powerW: 2500, hoursPerDay: 0.75, daysPerYear: 200 },
  { name: 'Dishwasher', category: 'essential', powerW: 1800, hoursPerDay: 1, daysPerYear: 300 },
  { name: 'Oven / Stove', category: 'essential', powerW: 2000, hoursPerDay: 0.75, daysPerYear: 340 },
  { name: 'Microwave', category: 'essential', powerW: 1000, hoursPerDay: 0.25, daysPerYear: 350 },
  { name: 'Router / Electronics', category: 'essential', powerW: 30, hoursPerDay: 24, daysPerYear: 365 },
  { name: 'TV', category: 'essential', powerW: 100, hoursPerDay: 4, daysPerYear: 350 },
  { name: 'Computer / Office', category: 'essential', powerW: 200, hoursPerDay: 6, daysPerYear: 300 },

  // Comfort
  { name: 'Air Conditioning', category: 'comfort', powerW: 2500, hoursPerDay: 6, daysPerYear: 120 },
  { name: 'Electric Heating', category: 'comfort', powerW: 3000, hoursPerDay: 8, daysPerYear: 150 },
  { name: 'Heat Pump', category: 'comfort', powerW: 1500, hoursPerDay: 8, daysPerYear: 200 },
  { name: 'Underfloor Heating', category: 'comfort', powerW: 2000, hoursPerDay: 10, daysPerYear: 150 },
  { name: 'Dehumidifier', category: 'comfort', powerW: 350, hoursPerDay: 6, daysPerYear: 180 },
  { name: 'Fan Heater (bathroom)', category: 'comfort', powerW: 2000, hoursPerDay: 0.5, daysPerYear: 180 },

  // Heating (DHW)
  { name: 'Electric Water Heater', category: 'heating', powerW: 2000, hoursPerDay: 3, daysPerYear: 365 },
  { name: 'Heat Pump Water Heater', category: 'heating', powerW: 500, hoursPerDay: 4, daysPerYear: 365 },
  { name: 'Towel Radiator', category: 'heating', powerW: 600, hoursPerDay: 4, daysPerYear: 200 },

  // Mobility
  { name: 'Electric Vehicle (3.7 kW)', category: 'mobility', powerW: 3700, hoursPerDay: 3, daysPerYear: 300 },
  { name: 'Electric Vehicle (7.4 kW)', category: 'mobility', powerW: 7400, hoursPerDay: 2, daysPerYear: 300 },
  { name: 'Electric Vehicle (11 kW)', category: 'mobility', powerW: 11000, hoursPerDay: 1.5, daysPerYear: 300 },
  { name: 'E-Bike / Scooter', category: 'mobility', powerW: 200, hoursPerDay: 2, daysPerYear: 250 },

  // Other / Luxury
  { name: 'Pool Pump', category: 'other', powerW: 1100, hoursPerDay: 8, daysPerYear: 180 },
  { name: 'Pool Heater (electric)', category: 'other', powerW: 3000, hoursPerDay: 4, daysPerYear: 150 },
  { name: 'Jacuzzi / Hot Tub', category: 'other', powerW: 3000, hoursPerDay: 3, daysPerYear: 200 },
  { name: 'Sauna', category: 'other', powerW: 6000, hoursPerDay: 0.5, daysPerYear: 100 },
  { name: 'Home Server / NAS', category: 'other', powerW: 80, hoursPerDay: 24, daysPerYear: 365 },
  { name: 'Electric Garden Tools', category: 'other', powerW: 1500, hoursPerDay: 0.5, daysPerYear: 50 },
];

let idCounter = 0;

export function createAppliance(template: ApplianceTemplate, enabled = false): Appliance {
  return {
    id: `app_${++idCounter}`,
    name: template.name,
    category: template.category,
    powerW: template.powerW,
    hoursPerDay: template.hoursPerDay,
    daysPerYear: template.daysPerYear,
    enabled,
    quantity: 1,
  };
}

/**
 * Returns a fresh copy of the full appliance library.
 * Essentials start enabled since most homes have them.
 */
export function getDefaultAppliances(): Appliance[] {
  idCounter = 0;
  return TEMPLATES.map((t) => createAppliance(t, t.category === 'essential'));
}

export function getCategoryLabel(cat: ApplianceCategory): string {
  switch (cat) {
    case 'essential': return 'Essential';
    case 'comfort': return 'Climate Control';
    case 'heating': return 'Hot Water';
    case 'mobility': return 'Electric Mobility';
    case 'other': return 'Other';
  }
}

export function getCategoryOrder(): ApplianceCategory[] {
  return ['essential', 'comfort', 'heating', 'mobility', 'other'];
}
