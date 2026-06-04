import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, SMAA } from '@react-three/postprocessing';
import type { PanelConfig, Location, BatteryConfig, InverterConfig, GeneratorConfig } from '../../types';
import RoofSurface from './RoofSurface';
import PanelArray from './PanelArray';
import Sun from './Sun';
import SceneSky from './SceneSky';
import EquipmentGroup from './EquipmentGroup';

interface SolarSceneProps {
  panel: PanelConfig;
  location: Location;
  hour: number;
  dayOfYear: number;
  roofWidth: number;
  roofLength: number;
  battery?: BatteryConfig | null;
  inverter?: InverterConfig | null;
  generator?: GeneratorConfig | null;
}

export default function SolarScene({
  panel, location, hour, dayOfYear, roofWidth, roofLength,
  battery, inverter, generator,
}: SolarSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [14, 10, 14], fov: 40, near: 0.1, far: 500 }}
      className="w-full h-full"
      gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.1 }}
      dpr={[1, 2]}
    >
      <Environment preset="city" background={false} />
      <SceneSky location={location} hour={hour} dayOfYear={dayOfYear} />
      <Sun location={location} hour={hour} dayOfYear={dayOfYear} />

      <RoofSurface width={roofWidth} length={roofLength} />
      <PanelArray panel={panel} roofWidth={roofWidth} roofLength={roofLength} />

      {/* Equipment next to roof */}
      <EquipmentGroup
        roofWidth={roofWidth}
        roofLength={roofLength}
        battery={battery ?? null}
        inverter={inverter ?? null}
        generator={generator ?? null}
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#3a5c28" roughness={0.95} metalness={0} />
      </mesh>

      <EffectComposer multisampling={0}>
        <SMAA />
      </EffectComposer>

      <OrbitControls
        enableDamping dampingFactor={0.05}
        minDistance={6} maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}
