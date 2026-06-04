/**
 * Calculates the maximum number of panels that fit on the given roof area.
 */
export function maxPanelsForRoof(roofWidth: number, roofLength: number): number {
  const panelW = 1.05;
  const panelH = 1.75;
  const gapX = 0.05;
  const gapZ = 0.12;
  const margin = 0.4;

  const usableW = roofWidth - margin * 2;
  const usableL = roofLength - margin * 2;

  const maxCols = Math.floor((usableW + gapX) / (panelW + gapX));
  const maxRows = Math.floor((usableL + gapZ) / (panelH + gapZ));

  return Math.max(1, maxCols * maxRows);
}
