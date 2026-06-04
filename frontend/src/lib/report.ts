import { jsPDF } from 'jspdf';
import type { SystemRecommendation, ConsumptionProfile, SimulationResult, Location, PanelConfig } from '../types';

interface ReportData {
  location: Location;
  panel: PanelConfig;
  consumption: ConsumptionProfile;
  recommendation: SystemRecommendation;
  simulation: SimulationResult;
}

const MARGIN = 20;
const PAGE_W = 210; // A4 width mm
const PAGE_H = 297; // A4 height mm
const CONTENT_W = PAGE_W - MARGIN * 2;

export function generateReport(data: ReportData): void {
  const { location, panel, consumption, recommendation: r, simulation } = data;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ─── PAGE 1 ─────────────────────────────────────────────────────

  // Title bar
  doc.setFillColor(24, 24, 27); // zinc-900
  doc.rect(0, 0, PAGE_W, 38, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255);
  doc.text('Helios', MARGIN, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160);
  doc.text('Solar Energy Assessment', MARGIN, 23);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
    PAGE_W - MARGIN, 16, { align: 'right' }
  );
  doc.text(
    `${location.latitude.toFixed(4)}N, ${location.longitude.toFixed(4)}E`,
    PAGE_W - MARGIN, 22, { align: 'right' }
  );

  let y = 50;

  // ─── Key figures row ────────────────────────────────────────────

  const figures = [
    { label: 'System size', value: `${r.systemSizeKwp.toFixed(1)} kWp` },
    { label: 'Annual yield', value: `${r.annualProductionKwh.toLocaleString('en', { maximumFractionDigits: 0 })} kWh` },
    { label: 'Savings', value: `\u20AC${r.annualSavingsEur.toFixed(0)}/yr` },
    { label: 'Payback', value: `${r.paybackYears.toFixed(1)} years` },
  ];

  const boxW = (CONTENT_W - 6) / 4;
  figures.forEach((fig, i) => {
    const x = MARGIN + i * (boxW + 2);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, boxW, 22, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(fig.label, x + 4, y + 7);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30);
    doc.text(fig.value, x + 4, y + 16);
  });

  y += 32;

  // ─── Location & Site ────────────────────────────────────────────

  y = sectionHeader(doc, 'Site', y);
  y = row(doc, y, [
    ['Latitude', `${location.latitude.toFixed(4)}\u00B0`],
    ['Longitude', `${location.longitude.toFixed(4)}\u00B0`],
    ['Elevation', `${location.elevation} m`],
  ]);
  y += 4;

  // ─── System Configuration ──────────────────────────────────────

  y = sectionHeader(doc, 'System configuration', y);
  y = row(doc, y, [
    ['Panels', `${r.panelsNeeded} x ${panel.ratedPower} Wp`],
    ['Tilt', `${panel.tilt}\u00B0`],
    ['Azimuth', `${panel.azimuth}\u00B0`],
  ]);
  y = row(doc, y, [
    ['Module efficiency', `${(panel.efficiency * 100).toFixed(1)}%`],
    ['Temp coefficient', `${panel.tempCoeff}%/\u00B0C`],
    ['NOCT', `${panel.noct}\u00B0C`],
  ]);
  y += 4;

  // ─── Performance ───────────────────────────────────────────────

  y = sectionHeader(doc, 'Performance', y);
  y = row(doc, y, [
    ['Annual production', `${r.annualProductionKwh.toLocaleString('en', { maximumFractionDigits: 0 })} kWh`],
    ['Specific yield', `${simulation.specificYield.toFixed(0)} kWh/kWp`],
    ['Performance ratio', `${(simulation.performanceRatio * 100).toFixed(1)}%`],
  ]);
  y = row(doc, y, [
    ['Annual consumption', `${consumption.annualKwh.toLocaleString('en', { maximumFractionDigits: 0 })} kWh`],
    ['Energy coverage', `${(r.coverageRatio * 100).toFixed(0)}%`],
    ['Self-consumption', `${(r.selfConsumptionRatio * 100).toFixed(0)}%`],
  ]);
  y += 4;

  // ─── Financials ────────────────────────────────────────────────

  y = sectionHeader(doc, 'Financial analysis', y);
  const netSavings25 = (r.annualSavingsEur * 25) - r.estimatedCostEur;
  y = row(doc, y, [
    ['Investment', `\u20AC${r.estimatedCostEur.toLocaleString('en', { maximumFractionDigits: 0 })}`],
    ['Annual savings', `\u20AC${r.annualSavingsEur.toFixed(0)}`],
    ['Payback period', `${r.paybackYears.toFixed(1)} years`],
  ]);
  y = row(doc, y, [
    ['25-year net savings', `\u20AC${netSavings25.toLocaleString('en', { maximumFractionDigits: 0 })}`],
    ['CO\u2082 avoided', `${(r.co2SavedKgYear / 1000).toFixed(2)} t/year`],
    ['Capacity factor', `${(simulation.capacityFactor * 100).toFixed(1)}%`],
  ]);

  // ─── PAGE 2: Monthly table ─────────────────────────────────────

  doc.addPage();
  y = 20;

  y = sectionHeader(doc, 'Monthly production breakdown', y);

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const colX = [MARGIN, MARGIN + 45, MARGIN + 90, MARGIN + 130];

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80);
  doc.text('Month', colX[0] + 3, y + 5);
  doc.text('Production (kWh)', colX[1] + 3, y + 5);
  doc.text('Consumption (kWh)', colX[2] + 3, y + 5);
  doc.text('Balance', colX[3] + 3, y + 5);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50);

  let totalProd = 0;
  let totalCons = 0;

  months.forEach((month, i) => {
    const prod = simulation.getMonthly(i).energyKwh;
    const cons = consumption.monthlyKwh[i];
    const balance = prod - cons;
    totalProd += prod;
    totalCons += cons;

    // Alternating row bg
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(MARGIN, y - 3.5, CONTENT_W, 6.5, 'F');
    }

    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.text(month, colX[0] + 3, y);
    doc.text(prod.toFixed(0), colX[1] + 3, y);
    doc.text(cons.toFixed(0), colX[2] + 3, y);

    doc.setTextColor(balance >= 0 ? 40 : 140);
    doc.text(`${balance >= 0 ? '+' : ''}${balance.toFixed(0)}`, colX[3] + 3, y);
    y += 6.5;
  });

  // Total row
  y += 1;
  doc.setDrawColor(200);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.setFontSize(9);
  doc.text('Total', colX[0] + 3, y);
  doc.text(totalProd.toFixed(0), colX[1] + 3, y);
  doc.text(totalCons.toFixed(0), colX[2] + 3, y);
  const totalBalance = totalProd - totalCons;
  doc.text(`${totalBalance >= 0 ? '+' : ''}${totalBalance.toFixed(0)}`, colX[3] + 3, y);

  // ─── Disclaimer ────────────────────────────────────────────────

  y = PAGE_H - 30;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140);
  doc.text(
    'This report was generated by Helios Solar Energy Planner. Production estimates are based on a synthetic clear-sky',
    MARGIN, y
  );
  doc.text(
    'irradiance model derived from solar geometry. Actual performance depends on local weather, shading, soiling, and system losses.',
    MARGIN, y + 3.5
  );
  doc.text(
    'Financial projections assume constant tariff structure and do not constitute financial advice.',
    MARGIN, y + 7
  );

  // ─── Page numbers ──────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(`${p} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' });
  }

  // Save
  const filename = `helios-report-${location.latitude.toFixed(2)}-${location.longitude.toFixed(2)}.pdf`;
  doc.save(filename);
}

// ─── Helpers ──────────────────────────────────────────────────────

function sectionHeader(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30);
  doc.text(title, MARGIN, y);
  y += 3;
  doc.setDrawColor(220);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  return y + 6;
}

function row(doc: jsPDF, y: number, items: [string, string][]): number {
  const cellW = CONTENT_W / items.length;
  items.forEach(([label, value], i) => {
    const x = MARGIN + i * cellW;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110);
    doc.text(label, x, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text(value, x, y + 5);
  });
  return y + 12;
}
