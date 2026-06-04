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

    const r = 20;
    const pos: [number, number, number] = [dir[0] * r, dir[1] * r, dir[2] * r];

    // Intensity ramps from 0 at horizon to full at 30+ degrees
    const int = Math.max(0, Math.min(2.2, elevDeg / 25));

    // Color temperature: warm at low angles, white at high
    let col = new THREE.Color('#ffffff');
    if (elevDeg > 0 && elevDeg < 20) {
      const t = elevDeg / 20;
      col = new THREE.Color('#ff7b32').lerp(new THREE.Color('#fff5e6'), t);
    }

    return { position: pos, intensity: int, color: col, isAboveHorizon: elevDeg > -2 };
  }, [location.latitude, dayOfYear, hour]);

  if (!isAboveHorizon) return null;

  return (
    <group>
      {/* Main directional light (sun) */}
      <directionalLight
        position={position}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* Sun disc */}
      <mesh position={position}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial
          color="#ffd080"
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sun corona */}
      <mesh position={position}>
        <circleGeometry args={[1.4, 32]} />
        <meshBasicMaterial
          color="#ffaa40"
          transparent
          opacity={0.08}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
