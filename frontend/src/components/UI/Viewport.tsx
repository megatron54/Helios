import type { PanelConfig, Location } from '../../types';
import SolarScene from '../Scene3D/SolarScene';

interface ViewportProps {
  panel: PanelConfig;
  location: Location;
  hour: number;
  dayOfYear: number;
}

export default function Viewport({ panel, location, hour, dayOfYear }: ViewportProps) {
  return (
    <div className="flex-1 relative bg-neutral-900">
      <SolarScene
        panel={panel}
        location={location}
        hour={hour}
        dayOfYear={dayOfYear}
      />
    </div>
  );
}
