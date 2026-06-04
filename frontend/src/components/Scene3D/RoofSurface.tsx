import { useMemo } from 'react';
import * as THREE from 'three';

interface RoofSurfaceProps {
  width: number;   // meters
  length: number;  // meters
}

export default function RoofSurface({ width, length }: RoofSurfaceProps) {
  const edgeGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(width, 0.001, length);
    return new THREE.EdgesGeometry(box);
  }, [width, length]);

  return (
    <group position={[0, 0, 0]}>
      {/* Roof slab */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, 0.15, length]} />
        <meshStandardMaterial
          color="#9a918a"
          roughness={0.82}
          metalness={0.02}
        />
      </mesh>

      {/* Edge trim */}
      {([
        [0, 0.12, -length / 2, width + 0.1, 0.1, 0.06],
        [0, 0.12, length / 2, width + 0.1, 0.1, 0.06],
        [-width / 2, 0.12, 0, 0.06, 0.1, length],
        [width / 2, 0.12, 0, 0.06, 0.1, length],
      ] as [number, number, number, number, number, number][]).map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#706860" roughness={0.7} metalness={0.1} />
        </mesh>
      ))}

      {/* Border outline */}
      <lineSegments position={[0, 0.09, 0]} geometry={edgeGeo}>
        <lineBasicMaterial color="#ffffff" opacity={0.12} transparent />
      </lineSegments>
    </group>
  );
}
