import { useMemo } from 'react';
import type { PanelConfig } from '../../types';

interface PanelArrayProps {
  panel: PanelConfig;
}

export default function PanelArray({ panel }: PanelArrayProps) {
  const layout = useMemo(() => {
    const panelWidth = 1.0;
    const panelHeight = 1.72;
    const gapX = 0.04;
    const gapZ = 0.06;

    const cols = Math.ceil(Math.sqrt(panel.quantity * (panelWidth / panelHeight)));
    const rows = Math.ceil(panel.quantity / cols);
    const positions: [number, number, number][] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (positions.length >= panel.quantity) break;
        const x = (c - (cols - 1) / 2) * (panelWidth + gapX);
        const z = (r - (rows - 1) / 2) * (panelHeight + gapZ);
        positions.push([x, 0, z]);
      }
    }

    return { positions, panelWidth, panelHeight };
  }, [panel.quantity]);

  const tiltRad = (panel.tilt * Math.PI) / 180;
  const azimuthRad = ((panel.azimuth - 180) * Math.PI) / 180;

  return (
    <group position={[0, 2.55, 0]} rotation={[0, azimuthRad, 0]}>
      {layout.positions.map((pos, i) => (
        <group key={i} position={pos} rotation={[-tiltRad, 0, 0]}>
          {/* Panel glass surface */}
          <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
            <boxGeometry args={[layout.panelWidth, 0.02, layout.panelHeight]} />
            <meshStandardMaterial
              color="#0f1b33"
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
          {/* Panel frame */}
          <mesh castShadow position={[0, 0, 0]}>
            <boxGeometry args={[layout.panelWidth + 0.03, 0.03, layout.panelHeight + 0.03]} />
            <meshStandardMaterial color="#333333" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
