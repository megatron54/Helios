import { useMemo } from 'react';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import type { Location } from '../../types';
import { computeSunDirection, computeSunAngles } from './sun-math';

interface SceneSkyProps {
  location: Location;
  hour: number;
  dayOfYear: number;
}

export default function SceneSky({ location, hour, dayOfYear }: SceneSkyProps) {
  const sunDir = useMemo(
    () => computeSunDirection(location.latitude, dayOfYear, hour),
    [location.latitude, dayOfYear, hour],
  );

  const { elevation } = useMemo(
    () => computeSunAngles(location.latitude, dayOfYear, hour),
    [location.latitude, dayOfYear, hour],
  );

  const elevDeg = elevation * (180 / Math.PI);
  const isNight = elevDeg < -5;
  const isDusk = elevDeg >= -5 && elevDeg < 5;

  const sunPosition = new THREE.Vector3(sunDir[0] * 200, sunDir[1] * 200, sunDir[2] * 200);

  if (isNight) {
    return (
      <>
        <color attach="background" args={['#060612']} />
        <ambientLight intensity={0.08} color="#334488" />
        <Stars />
      </>
    );
  }

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        turbidity={isDusk ? 8 : 2}
        rayleigh={isDusk ? 1 : 2.5}
        mieCoefficient={isDusk ? 0.02 : 0.005}
        mieDirectionalG={0.85}
      />
      <ambientLight intensity={isDusk ? 0.3 : 0.7} color="#ffffff" />
      <hemisphereLight color="#b4d4ff" groundColor="#5a4020" intensity={0.4} />
    </>
  );
}

function Stars() {
  const geometry = useMemo(() => {
    const pts = new Float32Array(1200 * 3);
    const sizes = new Float32Array(1200);
    for (let i = 0; i < 1200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 + 0.1);
      const r = 300;
      pts[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pts[i * 3 + 1] = r * Math.cos(phi);
      pts[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = Math.random() * 1.5 + 0.5;
    }
    return { positions: pts, sizes };
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geometry.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.2}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation={false}
      />
    </points>
  );
}
