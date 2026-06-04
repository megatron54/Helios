import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { PanelConfig, Location } from '../../types';
import Roof from './Roof';
import PanelArray from './PanelArray';
import Sun from './Sun';

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
      camera={{ position: [10, 7, 10], fov: 45 }}
      className="w-full h-full"
      gl={{ antialias: true, toneMapping: 3 }}
    >
      <color attach="background" args={['#0d0d0d']} />
      <fog attach="fog" args={['#0d0d0d', 20, 50]} />
      <ambientLight intensity={0.08} />

      <Sun location={location} hour={hour} dayOfYear={dayOfYear} />

      <Grid
        position={[0, -0.01, 0]}
        args={[40, 40]}
        cellSize={1}
        cellColor="#1a1a1a"
        sectionSize={5}
        sectionColor="#262626"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />

      <Roof />
      <PanelArray panel={panel} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={4}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2, 0]}
      />
    </Canvas>
  );
}
