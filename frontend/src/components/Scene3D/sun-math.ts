const RAD = Math.PI / 180;

export function computeSunAngles(lat: number, doy: number, hour: number): { elevation: number; azimuth: number } {
  const declination = 23.45 * Math.sin(RAD * (360 / 365) * (doy - 81));
  const decRad = declination * RAD;
  const latRad = lat * RAD;
  const hourAngle = (hour - 12) * 15;
  const haRad = hourAngle * RAD;

  const sinElev = Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinElev)));

  const cosElev = Math.cos(elevation);
  let azimuth = 0;
  if (cosElev > 0.001) {
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinElev) /
      (Math.cos(latRad) * cosElev);
    azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (hourAngle > 0) azimuth = 2 * Math.PI - azimuth;
  }

  return { elevation, azimuth };
}

export function computeSunDirection(lat: number, doy: number, hour: number): [number, number, number] {
  const { elevation, azimuth } = computeSunAngles(lat, doy, hour);
  return [
    Math.cos(elevation) * Math.sin(azimuth),
    Math.sin(elevation),
    Math.cos(elevation) * Math.cos(azimuth),
  ];
}
