import { jsPDF } from 'jspdf';
import type { SystemRecommendation, ConsumptionProfile, SimulationResult, Location, PanelConfig } from '../types';

interface ReportData {
  location: Location;
  panel: PanelConfig;
  consumption: ConsumptionProfile;
  recommendation: SystemRecommendation;
  simulation: SimulationResult;
}

export function generateReport(data: ReportData): void {
  const { location, panel, consumption, recommendation, simulation } = data;
  const doc = new jsPDF();
  const r = recommendation;

  let y = 20;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HELIOS', margin, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Solar Energy Assessment Report', margin + 42, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Date
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y);
  y += 14;

  // Location section
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Location', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  const locLines = [
    `Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    `Elevation: ${location.elevation} m`,
    location.name ? `Name: ${location.name}` : '',
  ].filter(Boolean);
  locLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 8;

  // Consumption section
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Energy Consumption', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(`Annual consumption: ${consumption.annualKwh.toLocaleString('en', { maximumFractionDigits: 0 })} kWh`, margin, y);
  y += 5.5;
  doc.text(`Monthly average: ${(consumption.annualKwh / 12).toFixed(0)} kWh`, margin, y);
  y += 14;

  // System section
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Recommended System', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  const sysLines = [
    `System size: ${r.systemSizeKwp.toFixed(2)} kWp (${r.panelsNeeded} panels x ${panel.ratedPower}Wp)`,
    `Panel tilt: ${panel.tilt}\u00B0 | Azimuth: ${panel.azimuth}\u00B0`,
    `Module efficiency: ${(panel.efficiency * 100).toFixed(1)}%`,
  ];
  sysLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 14;

  // Production section
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Simulation Results', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  const prodLines = [
    `Annual production: ${r.annualProductionKwh.toLocaleString('en', { maximumFractionDigits: 0 })} kWh`,
    `Specific yield: ${simulation.specificYield.toFixed(0)} kWh/kWp`,
    `Performance ratio: ${(simulation.performanceRatio * 100).toFixed(1)}%`,
    `Capacity factor: ${(simulation.capacityFactor * 100).toFixed(1)}%`,
    `Energy coverage: ${(r.coverageRatio * 100).toFixed(0)}%`,
    `Self-consumption: ${(r.selfConsumptionRatio * 100).toFixed(0)}%`,
  ];
  prodLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 14;

  // Economics section
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Financial Analysis', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  const econLines = [
    `Estimated investment: \u20AC${r.estimatedCostEur.toLocaleString('en', { maximumFractionDigits: 0 })}`,
    `Annual savings: \u20AC${r.annualSavingsEur.toFixed(0)}/year`,
    `Payback period: ${r.paybackYears.toFixed(1)} years`,
    `25-year net savings: \u20AC${((r.annualSavingsEur * 25) - r.estimatedCostEur).toLocaleString('en', { maximumFractionDigits: 0 })}`,
    `CO\u2082 avoided: ${(r.co2SavedKgYear / 1000).toFixed(2)} tonnes/year`,
  ];
  econLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 5.5;
  });
  y += 14;

  // Monthly production table
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text('Monthly Production', margin, y);
  y += 8;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80);
  doc.text('Month', margin, y);
  doc.text('Production (kWh)', margin + 35, y);
  doc.text('Consumption (kWh)', margin + 80, y);
  y += 5;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  months.forEach((month, i) => {
    const prod = simulation.getMonthly(i).energyKwh;
    const cons = consumption.monthlyKwh[i];
    doc.text(month, margin, y);
    doc.text(prod.toFixed(0), margin + 35, y);
    doc.text(cons.toFixed(0), margin + 80, y);
    y += 5;
  });

  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text('This report was generated by Helios Solar Energy Planner. Results are estimates based on', margin, y);
  y += 4;
  doc.text('Typical Meteorological Year (TMY) data from PVGIS. Actual performance may vary.', margin, y);

  // Save
  const filename = `helios-solar-report-${location.latitude.toFixed(2)}-${location.longitude.toFixed(2)}.pdf`;
  doc.save(filename);
}
