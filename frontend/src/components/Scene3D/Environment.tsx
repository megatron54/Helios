import { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import type { Location } from '../../types';
import { computeSunDirection } from './sun-math';

interface EnvironmentProps {
  location: Location;
  hour: number;
  dayOfYear: number;
}

export default function Environment({ location, hour, dayOfYear }: EnvironmentProps) {
  const sunDir = useMemo(
    () => computeSunDirection(location.latitude, dayOfYear, hour),
    [location.latitude, dayOfYear, hour],
  );

  const elevation = Math.asin(sunDir[1]);
  const isNight = elevation < -0.05;
  const isDusk = elevation >= -0.05 && elevation < 0.1;

  // Sky parameters vary with sun elevation
  const turbidity = useMemo(() => {
    if (isNight) return 20;
    if (isDusk) return 10;
    return 2.5;
  }, [isNight, isDusk]);

  const rayleigh = useMemo(() => {
    if (isNight) return 0;
    if (isDusk) return 0.5;
    return 1.5;
  }, [isNight, isDusk]);

  const mieCoefficient = useMemo(() => {
    if (isDusk) return 0.03;
    return 0.005;
  }, [isDusk]);

  // Background color for night
  const bgColor = useMemo(() => {
    if (isNight) return '#050510';
    if (isDusk) return '#1a1020';
    return undefined;
  }, [isNight, isDusk]);

  const sunPosition = new THREE.Vector3(sunDir[0] * 100, sunDir[1] * 100, sunDir[2] * 100);

  return (
    <>
      {bgColor && <color attach="background" args={[bgColor]} />}

      {!isNight && (
        <Sky
          distance={450000}
          sunPosition={sunPosition}
          turbidity={turbidity}
          rayleigh={rayleigh}
          mieCoefficient={mieCoefficient}
          mieDirectionalG={0.8}
          inclination={0}
          azimuth={0}
        />
      )}

      {/* Ambient light varies with time of day */}
      <ambientLight
        intensity={isNight ? 0.02 : isDusk ? 0.05 : 0.12}
        color={isNight ? '#2233aa' : '#ffffff'}
      />

      {/* Hemisphere light for indirect illumination */}
      {!isNight && (
        <hemisphereLight
          color="#87ceeb"
          groundColor="#362a1a"
          intensity={isDusk ? 0.1 : 0.3}
        />
      )}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color="#1a2010"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Grid overlay */}
      <gridHelper
        args={[40, 40, '#1a1a1a', '#141414']}
        position={[0, 0.01, 0]}
      />

      {/* Stars at night */}
      {isNight && <Stars />}
    </>
  );
}

function Stars() {
  const positions = useMemo(() => {
    const pts = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.8 + 0.2); // upper hemisphere only
      const r = 200;
      pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pts[i * 3 + 1] = r * Math.cos(phi);
      pts[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return pts;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.8} color="#ffffff" transparent opacity={0.7} sizeAttenuation={false} />
    </points>
  );
}
