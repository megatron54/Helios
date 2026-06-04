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

  const sunPosition = new THREE.Vector3(sunDir[0] * 100, sunDir[1] * 100, sunDir[2] * 100);

  return (
    <>
      {/* Background color */}
      <color attach="background" args={[isNight ? '#080818' : isDusk ? '#1a1525' : '#87a5c0']} />

      {/* Sky dome */}
      {!isNight && (
        <Sky
          distance={450000}
          sunPosition={sunPosition}
          turbidity={isDusk ? 10 : 3}
          rayleigh={isDusk ? 0.5 : 2}
          mieCoefficient={isDusk ? 0.03 : 0.005}
          mieDirectionalG={0.8}
        />
      )}

      {/* Ambient — main fill light so nothing is black */}
      <ambientLight
        intensity={isNight ? 0.05 : isDusk ? 0.2 : 0.6}
        color={isNight ? '#4466aa' : '#ffffff'}
      />

      {/* Hemisphere light for softer ground/sky bounce */}
      {!isNight && (
        <hemisphereLight
          color="#b0d0ff"
          groundColor="#806040"
          intensity={isDusk ? 0.2 : 0.5}
        />
      )}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2d4a1e" roughness={0.9} metalness={0} />
      </mesh>

      {/* Subtle grid */}
      <gridHelper args={[60, 30, '#3a5a2a', '#2a4a1a']} position={[0, 0.01, 0]} />

      {/* Stars at night */}
      {isNight && <Stars />}
    </>
  );
}

function Stars() {
  const positions = useMemo(() => {
    const pts = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.15);
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.8} color="#ffffff" transparent opacity={0.6} sizeAttenuation={false} />
    </points>
  );
}
