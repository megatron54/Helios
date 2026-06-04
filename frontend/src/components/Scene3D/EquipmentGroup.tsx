import type { BatteryConfig, InverterConfig, GeneratorConfig } from '../../types';

interface EquipmentGroupProps {
  roofWidth: number;
  roofLength: number;
  battery: BatteryConfig | null;
  inverter: InverterConfig | null;
  generator: GeneratorConfig | null;
}

export default function EquipmentGroup({ roofWidth, roofLength, battery, inverter, generator }: EquipmentGroupProps) {
  // Position equipment beside the roof
  const baseX = roofWidth / 2 + 1.5;
  const baseZ = -roofLength / 2 + 1;

  return (
    <group position={[baseX, 0, baseZ]}>
      {/* Inverter box (always present if system has panels) */}
      {inverter && (
        <group position={[0, 0.4, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.7, 0.25]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Status LED */}
          <mesh position={[0, 0.2, 0.13]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          {/* Ventilation grille */}
          <mesh position={[0, -0.1, 0.126]}>
            <planeGeometry args={[0.35, 0.2]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Battery cabinet */}
      {battery && (
        <group position={[0.8, 0, 0]}>
          {/* Main cabinet */}
          <mesh castShadow position={[0, 0.55, 0]}>
            <boxGeometry args={[0.6, 1.1, 0.4]} />
            <meshStandardMaterial color="#e8e8e8" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* Dark front panel */}
          <mesh position={[0, 0.55, 0.201]}>
            <boxGeometry args={[0.52, 1.0, 0.01]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Capacity indicator (height based on kWh) */}
          <mesh position={[0.22, 0.55, 0.21]}>
            <boxGeometry args={[0.03, 0.6, 0.005]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} />
          </mesh>
        </group>
      )}

      {/* Diesel generator */}
      {generator && generator.enabled && (
        <group position={[battery ? 1.8 : 0.8, 0, 0]}>
          {/* Generator body */}
          <mesh castShadow position={[0, 0.35, 0]}>
            <boxGeometry args={[0.9, 0.6, 0.5]} />
            <meshStandardMaterial color="#d4a017" metalness={0.4} roughness={0.5} />
          </mesh>
          {/* Engine block (darker top) */}
          <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[0.7, 0.1, 0.4]} />
            <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Exhaust pipe */}
          <mesh castShadow position={[0.3, 0.85, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Fuel tank indicator */}
          <mesh position={[-0.35, 0.35, 0.251]}>
            <boxGeometry args={[0.12, 0.25, 0.01]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}
