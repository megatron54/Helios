import { useMemo } from 'react';
import type { Location } from '../../types';

interface SunProps {
  location: Location;
  hour: number;
  dayOfYear: number;
}

function computeSunPosition(lat: number, doy: number, hour: number): [number, number, number] {
  const RAD = Math.PI / 180;

  // Declination (approximate)
  const declination = 23.45 * Math.sin(RAD * (360 / 365) * (doy - 81));
  const decRad = declination * RAD;
  const latRad = lat * RAD;

  // Hour angle (degrees, 15° per hour from solar noon)
  const hourAngle = (hour - 12) * 15;
  const haRad = hourAngle * RAD;

  // Elevation
  const sinElev = Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElev)));

  // Azimuth
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinElev) /
    (Math.cos(latRad) * Math.cos(elevation));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (hourAngle > 0) azimuth = 2 * Math.PI - azimuth;

  // Convert to 3D position on a sphere (radius 12)
  const r = 12;
  const x = r * Math.cos(elevation) * Math.sin(azimuth);
  const y = r * Math.sin(elevation);
  const z = r * Math.cos(elevation) * Math.cos(azimuth);

  return [x, y, z];
}

export default function Sun({ location, hour, dayOfYear }: SunProps) {
  const position = useMemo(
    () => computeSunPosition(location.latitude, dayOfYear, hour),
    [location.latitude, dayOfYear, hour],
  );

  const isAboveHorizon = position[1] > 0;

  return (
    <group>
      {isAboveHorizon && (
        <>
          <directionalLight
            position={position}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.1}
            shadow-camera-far={40}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <mesh position={position}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        </>
      )}
    </group>
  );
}
