/**
 * Panel and layout constants (single source of truth).
 */
export const PANEL_W = 1.05;   // module width (m)
export const PANEL_H = 1.75;   // module height (m)
export const GAP_X   = 0.05;   // column gap (m)
export const GAP_Z   = 0.15;   // minimum maintenance gap between rows (m)
export const MARGIN  = 0.40;   // edge setback from roof perimeter (m)

/**
 * Computes the row pitch (center-to-center distance along the depth axis)
 * for a given tilt angle. This includes the panel footprint on the roof
 * plus an inter-row clearance to avoid self-shading at low sun angles.
 *
 * Rule-of-thumb: clearance = panelH * sin(tilt) * shadingFactor
 * shadingFactor ~0.7 gives reasonable shade-free spacing for latitudes 30-55°.
 */
export function rowPitch(tiltDeg: number): number {
  const tiltRad = (tiltDeg * Math.PI) / 180;
  const footprint = PANEL_H * Math.cos(tiltRad);
  const shadeClearance = PANEL_H * Math.sin(tiltRad) * 0.7;
  return footprint + shadeClearance + GAP_Z;
}

/**
 * Calculates the maximum number of panels that fit on the given roof area
 * accounting for tilt-dependent row spacing.
 */
export function maxPanelsForRoof(roofWidth: number, roofLength: number, tiltDeg = 35): number {
  const usableW = roofWidth  - MARGIN * 2;
  const usableL = roofLength - MARGIN * 2;

  const maxCols = Math.max(0, Math.floor((usableW + GAP_X) / (PANEL_W + GAP_X)));
  const pitch   = rowPitch(tiltDeg);
  const maxRows = Math.max(0, Math.floor((usableL + GAP_Z) / pitch));

  return Math.max(1, maxCols * maxRows);
}
