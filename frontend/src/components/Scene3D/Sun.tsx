import { useMemo } from 'react';
import * as THREE from 'three';
import type { Location } from '../../types';

interface SunProps {
  location: Location;
  hour: number;
  dayOfYear: number;
}

function computeSunAngles(lat: number, doy: number, hour: number): { elevation: number; azimuth: number } {
  const RAD = Math.PI / 180;
  const declination = 23.45 * Math.sin(RAD * (360 / 365) * (doy - 81));
  const decRad = declination * RAD;
  const latRad = lat * RAD;
  const hourAngle = (hour - 12) * 15;
  const haRad = hourAngle * RAD;

  const sinElev = Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElev)));

  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinElev) /
    (Math.cos(latRad) * Math.cos(elevation));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (hourAngle > 0) azimuth = 2 * Math.PI - azimuth;

  return { elevation, azimuth };
}

export default function Sun({ location, hour, dayOfYear }: SunProps) {
  const { position, intensity, color } = useMemo(() => {
    const { elevation, azimuth } = computeSunAngles(location.latitude, dayOfYear, hour);
    const r = 15;
    const pos: [number, number, number] = [
      r * Math.cos(elevation) * Math.sin(azimuth),
      r * Math.sin(elevation),
      r * Math.cos(elevation) * Math.cos(azimuth),
    ];

    // Intensity based on elevation (dim near horizon)
    const elevDeg = elevation * (180 / Math.PI);
    const int = Math.max(0, Math.min(2.0, elevDeg / 30));

    // Color temperature shifts at low angles
    let col = new THREE.Color('#ffffff');
    if (elevDeg < 15 && elevDeg > 0) {
      const t = elevDeg / 15;
      col = new THREE.Color('#ff8c42').lerp(new THREE.Color('#ffffff'), t);
    }

    return { position: pos, intensity: int, color: col };
  }, [location.latitude, dayOfYear, hour]);

  const isAboveHorizon = position[1] > 0;

  if (!isAboveHorizon) {
    return null;
  }

  return (
    <group>
      <directionalLight
        position={position}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.001}
      />

      {/* Sun sphere */}
      <mesh position={position}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" toneMapped={false} />
      </mesh>

      {/* Sun glow */}
      <mesh position={position}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.15} toneMapped={false} />
      </mesh>
    </group>
  );
}
