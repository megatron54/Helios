export default function Roof() {
  return (
    <group position={[0, 0, 0]}>
      {/* Main roof slab */}
      <mesh position={[0, 2.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[6.5, 0.12, 5.5]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.9} />
      </mesh>

      {/* Roof edge trim */}
      <mesh position={[0, 2.46, 0]} receiveShadow>
        <boxGeometry args={[6.7, 0.02, 5.7]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>

      {/* Support structure */}
      {[
        [-2.8, 1.2, -2.3],
        [2.8, 1.2, -2.3],
        [-2.8, 1.2, 2.3],
        [2.8, 1.2, 2.3],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.12, 2.4, 0.12]} />
          <meshStandardMaterial color="#171717" roughness={0.95} />
        </mesh>
      ))}

      {/* Chimney obstacle */}
      <mesh position={[2.2, 3.2, -1.8]} castShadow>
        <boxGeometry args={[0.5, 1.5, 0.5]} />
        <meshStandardMaterial color="#262626" roughness={0.9} />
      </mesh>
    </group>
  );
}
