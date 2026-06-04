import { useMemo } from 'react';
import * as THREE from 'three';
import type { Location } from '../../types';
import { computeSunDirection, computeSunAngles } from './sun-math';

interface SunProps {
  location: Location;
  hour: number;
  dayOfYear: number;
}

export default function Sun({ location, hour, dayOfYear }: SunProps) {
  const { position, intensity, color, isAboveHorizon } = useMemo(() => {
    const dir = computeSunDirection(location.latitude, dayOfYear, hour);
    const { elevation } = computeSunAngles(location.latitude, dayOfYear, hour);
    const elevDeg = elevation * (180 / Math.PI);

    const r = 25;
    const pos: [number, number, number] = [dir[0] * r, dir[1] * r, dir[2] * r];

    // Intensity: 0 at horizon, full at 30+ degrees
    const int = Math.max(0, Math.min(3.5, (elevDeg / 20) * 2.5));

    // Color temperature: warm at sunrise/sunset, neutral-white at midday
    let col = new THREE.Color('#ffffff');
    if (elevDeg > 0 && elevDeg < 15) {
      const t = elevDeg / 15;
      col = new THREE.Color('#ff8840').lerp(new THREE.Color('#fffaf0'), t);
    }

    return { position: pos, intensity: int, color: col, isAboveHorizon: elevDeg > -1 };
  }, [location.latitude, dayOfYear, hour]);

  if (!isAboveHorizon) return null;

  return (
    <group>
      {/* Directional sunlight */}
      <directionalLight
        position={position}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.001}
        shadow-normalBias={0.02}
      />

      {/* Sun disc visual */}
      <mesh position={position}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial color="#fff0c0" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
