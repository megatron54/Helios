import * as THREE from 'three';

export default function Roof() {
  return (
    <group position={[0, 0, 0]}>
      {/* Building walls — light stucco/concrete */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 2.4, 6]} />
        <meshStandardMaterial color="#d4cfc8" roughness={0.92} metalness={0} />
      </mesh>

      {/* Roof slab — flat concrete */}
      <mesh position={[0, 2.45, 0]} receiveShadow castShadow>
        <boxGeometry args={[7.2, 0.12, 6.2]} />
        <meshStandardMaterial color="#8a8580" roughness={0.85} metalness={0.02} />
      </mesh>

      {/* Roof parapet — slightly darker than walls */}
      {(
        [
          [0, 2.62, -3.05, 7.4, 0.28, 0.1],
          [0, 2.62, 3.05, 7.4, 0.28, 0.1],
          [-3.65, 2.62, 0, 0.1, 0.28, 6.0],
          [3.65, 2.62, 0, 0.1, 0.28, 6.0],
        ] as [number, number, number, number, number, number][]
      ).map(([x, y, z, w, h, d], i) => (
        <mesh key={`parapet-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#b0aaa4" roughness={0.9} />
        </mesh>
      ))}

      {/* HVAC unit — metallic gray */}
      <mesh position={[2.5, 2.95, -2.0]} castShadow>
        <boxGeometry args={[0.9, 0.7, 0.7]} />
        <meshStandardMaterial color="#6b6b6b" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Chimney/vent pipe */}
      <mesh position={[-2.8, 3.15, 2.0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 1.2, 8]} />
        <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Roof access hatch */}
      <mesh position={[-2.5, 2.52, -1.5]} receiveShadow>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshStandardMaterial color="#707070" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Door */}
      <mesh position={[0, 0.9, 3.01]}>
        <planeGeometry args={[1.0, 1.8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Windows */}
      {[-1.8, 1.8].map((x) => (
        <mesh key={`win-${x}`} position={[x, 1.3, 3.01]}>
          <planeGeometry args={[0.7, 0.9]} />
          <meshStandardMaterial
            color="#8ecae6"
            roughness={0.1}
            metalness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
