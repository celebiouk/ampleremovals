/** Great-circle distance in metres between two lat/lng points. */
export function haversineMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000; // earth radius (m)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Arrival threshold — within 80m of the destination counts as "arrived". */
export const ARRIVAL_RADIUS_M = 80;

export function hasArrived(driverLat: number, driverLng: number, destLat: number, destLng: number): boolean {
  return haversineMetres(driverLat, driverLng, destLat, destLng) <= ARRIVAL_RADIUS_M;
}
