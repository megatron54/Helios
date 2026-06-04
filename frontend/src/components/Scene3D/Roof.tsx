export default function Roof() {
  return (
    <group position={[0, 0, 0]}>
      {/* Simple flat roof platform */}
      <mesh position={[0, 2.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[6, 0.15, 5]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Support pillars */}
      {[[-2.5, 0, -2], [2.5, 0, -2], [-2.5, 0, 2], [2.5, 0, 2]].map(([x, _y, z], i) => (
        <mesh key={i} position={[x, 1.2, z]} castShadow>
          <boxGeometry args={[0.15, 2.4, 0.15]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      ))}
    </group>
  );
}
