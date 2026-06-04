import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { PanelConfig, Location } from '../../types';
import Roof from './Roof';
import PanelArray from './PanelArray';
import Sun from './Sun';
import Environment from './Environment';

interface SolarSceneProps {
  panel: PanelConfig;
  location: Location;
  hour: number;
  dayOfYear: number;
}

export default function SolarScene({ panel, location, hour, dayOfYear }: SolarSceneProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [12, 8, 12], fov: 42, near: 0.1, far: 1000 }}
      className="w-full h-full"
      gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 1.2 }}
    >
      <Environment location={location} hour={hour} dayOfYear={dayOfYear} />
      <Sun location={location} hour={hour} dayOfYear={dayOfYear} />

      <Roof />
      <PanelArray panel={panel} />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2.02}
        target={[0, 2.5, 0]}
      />
    </Canvas>
  );
}
