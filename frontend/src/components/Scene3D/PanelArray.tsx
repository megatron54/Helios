import { useMemo } from 'react';
import type { PanelConfig } from '../../types';

interface PanelArrayProps {
  panel: PanelConfig;
}

export default function PanelArray({ panel }: PanelArrayProps) {
  const panels = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(panel.quantity));
    const rows = Math.ceil(panel.quantity / cols);
    const panelWidth = 1.0;
    const panelHeight = 1.7;
    const gap = 0.05;
    const positions: [number, number, number][] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (positions.length >= panel.quantity) break;
        const x = (c - (cols - 1) / 2) * (panelWidth + gap);
        const z = (r - (rows - 1) / 2) * (panelHeight + gap);
        positions.push([x, 0, z]);
      }
    }

    return { positions, panelWidth, panelHeight };
  }, [panel.quantity]);

  const tiltRad = (panel.tilt * Math.PI) / 180;
  // Convert azimuth (0=N, 180=S) to Three.js rotation
  const azimuthRad = ((panel.azimuth - 180) * Math.PI) / 180;

  return (
    <group position={[0, 2.55, 0]} rotation={[0, azimuthRad, 0]}>
      {panels.positions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          rotation={[-tiltRad, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[panels.panelWidth, 0.04, panels.panelHeight]} />
          <meshStandardMaterial color="#1a2744" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}
