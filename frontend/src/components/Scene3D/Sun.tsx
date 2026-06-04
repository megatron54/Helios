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
  const data = useMemo(() => {
    const dir = computeSunDirection(location.latitude, dayOfYear, hour);
    const { elevation } = computeSunAngles(location.latitude, dayOfYear, hour);
    const elevDeg = elevation * (180 / Math.PI);

    const r = 30;
    const pos: [number, number, number] = [dir[0] * r, dir[1] * r, dir[2] * r];

    // Ramp intensity: 0 at horizon to peak at 40+ degrees
    const intensity = Math.max(0, Math.min(4.0, (elevDeg / 30) * 3.5));

    // Color shift: warm at low angles, white-yellow at zenith
    let color = new THREE.Color('#fffdf5');
    if (elevDeg > 0 && elevDeg < 20) {
      const t = elevDeg / 20;
      color = new THREE.Color('#ff6622').lerp(new THREE.Color('#fffdf5'), t);
    }

    return { pos, intensity, color, visible: elevDeg > -2 };
  }, [location.latitude, dayOfYear, hour]);

  if (!data.visible) return null;

  return (
    <directionalLight
      position={data.pos}
      intensity={data.intensity}
      color={data.color}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={15}
      shadow-camera-bottom={-15}
      shadow-bias={-0.0003}
    />
  );
}
