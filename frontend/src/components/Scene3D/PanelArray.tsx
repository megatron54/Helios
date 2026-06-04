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
    const totalL = rows * pitch - (pitch - PANEL_H * Math.cos((panel.tilt * Math.PI) / 180));
    const offsetX = -totalW / 2 + PANEL_W / 2;
    const offsetZ = -totalL / 2 + (PANEL_H * Math.cos((panel.tilt * Math.PI) / 180)) / 2;

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

    return { positions, overflow: panel.quantity > maxFit };
  }, [panel.quantity, panel.tilt, roofWidth, roofLength]);

  const tiltRad = (panel.tilt * Math.PI) / 180;
  const azimuthRad = ((panel.azimuth - 180) * Math.PI) / 180;

  // Lift panels so the bottom edge sits on the roof
  const liftY = 0.12 + Math.sin(tiltRad) * (PANEL_H / 2);

  return (
    <group position={[0, liftY, 0]} rotation={[0, azimuthRad, 0]}>
      {layout.positions.map((pos, i) => (
        <group key={i} position={pos} rotation={[-tiltRad, 0, 0]}>
          {/* Panel cell surface */}
          <mesh castShadow receiveShadow position={[0, 0.015, 0]}>
            <boxGeometry args={[PANEL_W, 0.018, PANEL_H]} />
            <meshStandardMaterial
              color="#152040"
              metalness={0.75}
              roughness={0.12}
              envMapIntensity={1.5}
            />
          </mesh>
          {/* Aluminum frame */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[PANEL_W + 0.04, 0.035, PANEL_H + 0.04]} />
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          {/* Cell grid lines */}
          <mesh position={[0, 0.025, 0]}>
            <planeGeometry args={[PANEL_W - 0.04, PANEL_H - 0.04]} />
            <meshStandardMaterial
              color="#0a1428"
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
