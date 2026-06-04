import { useMemo } from 'react';
import type { PanelConfig } from '../../types';
import { PANEL_W, PANEL_H, GAP_X, MARGIN, rowPitch } from '../../lib/roof-layout';

interface PanelArrayProps {
  panel: PanelConfig;
  roofWidth: number;
  roofLength: number;
}

export default function PanelArray({ panel, roofWidth, roofLength }: PanelArrayProps) {
  const layout = useMemo(() => {
    const usableW = roofWidth  - MARGIN * 2;
    const usableL = roofLength - MARGIN * 2;

    const maxCols = Math.max(1, Math.floor((usableW + GAP_X) / (PANEL_W + GAP_X)));
    const pitch   = rowPitch(panel.tilt);
    const maxRows = Math.max(1, Math.floor((usableL + pitch * 0.1) / pitch));
    const maxFit  = maxCols * maxRows;

    const count = Math.min(panel.quantity, maxFit);
    const cols  = Math.min(count, maxCols);
    const rows  = Math.ceil(count / cols);

    const positions: [number, number, number][] = [];
    const totalW = cols * PANEL_W + (cols - 1) * GAP_X;
    const totalL = rows * pitch;
    const offsetX = -totalW / 2 + PANEL_W / 2;
    const offsetZ = -totalL / 2 + pitch / 2;

    for (let r = 0; r < rows; r++) {
      const colsInRow = r === rows - 1 ? count - r * cols : cols;
      for (let c = 0; c < colsInRow; c++) {
        positions.push([
          offsetX + c * (PANEL_W + GAP_X),
          0,
          offsetZ + r * pitch,
        ]);
      }
    }

    return { positions };
  }, [panel.quantity, panel.tilt, roofWidth, roofLength]);

  const tiltRad = (panel.tilt * Math.PI) / 180;
  const azimuthRad = ((panel.azimuth - 180) * Math.PI) / 180;

  // Lift so bottom edge sits on roof
  const liftY = 0.10 + Math.sin(tiltRad) * (PANEL_H / 2);

  return (
    <group position={[0, liftY, 0]} rotation={[0, azimuthRad, 0]}>
      {layout.positions.map((pos, i) => (
        <group key={i} position={pos} rotation={[-tiltRad, 0, 0]}>
          {/* Single panel mesh — no separate overlapping planes */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[PANEL_W, 0.04, PANEL_H]} />
            <meshStandardMaterial
              color="#1a2744"
              metalness={0.6}
              roughness={0.18}
              envMapIntensity={1.2}
            />
          </mesh>
          {/* Thin frame border — slightly inset on Y to avoid z-fight */}
          <mesh position={[0, -0.005, 0]}>
            <boxGeometry args={[PANEL_W + 0.03, 0.03, PANEL_H + 0.03]} />
            <meshStandardMaterial
              color="#888888"
              metalness={0.9}
              roughness={0.25}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
