import { useMemo } from 'react';
import type { PanelConfig } from '../../types';

interface PanelArrayProps {
  panel: PanelConfig;
  roofWidth: number;
  roofLength: number;
}

export default function PanelArray({ panel, roofWidth, roofLength }: PanelArrayProps) {
  const layout = useMemo(() => {
    const panelW = 1.05;   // ~1m wide
    const panelH = 1.75;   // ~1.75m tall (lying flat = depth)
    const gapX = 0.05;
    const gapZ = 0.12;     // row spacing for maintenance access

    // Usable area (leave margin from edges)
    const margin = 0.4;
    const usableW = roofWidth - margin * 2;
    const usableL = roofLength - margin * 2;

    // Max panels that fit
    const maxCols = Math.floor((usableW + gapX) / (panelW + gapX));
    const maxRows = Math.floor((usableL + gapZ) / (panelH + gapZ));
    const maxFit = maxCols * maxRows;

    const count = Math.min(panel.quantity, maxFit);
    const cols = Math.min(panel.quantity, maxCols);
    const rows = Math.ceil(count / cols);

    const positions: [number, number, number][] = [];
    const totalW = cols * panelW + (cols - 1) * gapX;
    const totalL = rows * panelH + (rows - 1) * gapZ;
    const offsetX = -totalW / 2 + panelW / 2;
    const offsetZ = -totalL / 2 + panelH / 2;

    for (let r = 0; r < rows; r++) {
      const colsInRow = r === rows - 1 ? count - r * cols : cols;
      for (let c = 0; c < colsInRow; c++) {
        positions.push([
          offsetX + c * (panelW + gapX),
          0,
          offsetZ + r * (panelH + gapZ),
        ]);
      }
    }

    return { positions, panelW, panelH, overflow: panel.quantity > maxFit };
  }, [panel.quantity, roofWidth, roofLength]);

  const tiltRad = (panel.tilt * Math.PI) / 180;
  const azimuthRad = ((panel.azimuth - 180) * Math.PI) / 180;

  // Height offset so tilted panels sit on the roof
  const liftY = 0.15 + Math.sin(tiltRad) * (layout.panelH / 2);

  return (
    <group position={[0, liftY, 0]} rotation={[0, azimuthRad, 0]}>
      {layout.positions.map((pos, i) => (
        <group key={i} position={pos} rotation={[-tiltRad, 0, 0]}>
          {/* Panel cell surface */}
          <mesh castShadow receiveShadow position={[0, 0.015, 0]}>
            <boxGeometry args={[layout.panelW, 0.018, layout.panelH]} />
            <meshStandardMaterial
              color="#152040"
              metalness={0.75}
              roughness={0.12}
              envMapIntensity={1.5}
            />
          </mesh>
          {/* Aluminum frame */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[layout.panelW + 0.04, 0.035, layout.panelH + 0.04]} />
            <meshStandardMaterial
              color="#c0c0c0"
              metalness={0.85}
              roughness={0.2}
            />
          </mesh>
          {/* Cell grid lines (visual detail) */}
          <mesh position={[0, 0.025, 0]}>
            <planeGeometry args={[layout.panelW - 0.04, layout.panelH - 0.04]} />
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

      {/* Overflow warning indicator */}
      {layout.overflow && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
      )}
    </group>
  );
}
