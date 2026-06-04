import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { PanelConfig, Location } from '../../types';
import Roof from './Roof';
import PanelArray from './PanelArray';
import Sun from './Sun';
import Ground from './Ground';

interface SolarSceneProps {
  panel: PanelConfig;
  location: Location;
  hour: number;
  dayOfYear: number;
}

export default function SolarScene({ panel, location, hour, dayOfYear }: SolarSceneProps) {
  return (
    <Canvas
      camera={{ position: [8, 6, 8], fov: 50 }}
      className="w-full h-full"
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0a0a0a']} />
      <ambientLight intensity={0.15} />

      <Sun location={location} hour={hour} dayOfYear={dayOfYear} />
      <Ground />
      <Roof />
      <PanelArray panel={panel} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}
