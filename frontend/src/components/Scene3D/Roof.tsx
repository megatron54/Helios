import * as THREE from 'three';

export default function Roof() {
  return (
    <group position={[0, 0, 0]}>
      {/* Building walls */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 2.4, 6]} />
        <meshStandardMaterial color="#262220" roughness={0.92} metalness={0} />
      </mesh>

      {/* Roof slab */}
      <mesh position={[0, 2.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[7.2, 0.1, 6.2]} />
        <meshStandardMaterial color="#1c1a18" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Roof parapet */}
      {[
        [0, 2.6, -3.05, 7.4, 0.25, 0.1],
        [0, 2.6, 3.05, 7.4, 0.25, 0.1],
        [-3.65, 2.6, 0, 0.1, 0.25, 6.0],
        [3.65, 2.6, 0, 0.1, 0.25, 6.0],
      ].map(([x, y, z, w, h, d], i) => (
        <mesh key={`parapet-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#2a2826" roughness={0.9} />
        </mesh>
      ))}

      {/* HVAC unit */}
      <mesh position={[2.5, 2.9, -2.0]} castShadow>
        <boxGeometry args={[0.9, 0.7, 0.7]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Chimney/vent */}
      <mesh position={[-2.8, 3.1, 2.0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 1.2, 8]} />
        <meshStandardMaterial color="#333333" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Roof access hatch */}
      <mesh position={[-2.5, 2.52, -1.5]} receiveShadow>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Door on ground level */}
      <mesh position={[0, 0.9, 3.01]}>
        <planeGeometry args={[1.0, 1.8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
