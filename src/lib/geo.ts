import type { GeoCoords } from '@/types';

const EARTH_RADIUS_M = 6371000;

export function haversineDistance(a: GeoCoords, b: GeoCoords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(h));
}

export function isWithinRadius(
  userCoords: GeoCoords,
  sessionCoords: GeoCoords,
  radiusMeters: number,
): boolean {
  return haversineDistance(userCoords, sessionCoords) <= radiusMeters;
}
