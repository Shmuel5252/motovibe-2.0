/**
 * isValidLatLng — בודק שאובייקט נקודה מכיל lat/lng מספריים תקינים.
 * @param {{lat: number, lng: number}|null|undefined} point
 * @returns {boolean}
 */
export function isValidLatLng(point) {
  if (!point || typeof point !== "object") {
    return false;
  }

  const lat = Number(point.lat);
  const lng = Number(point.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

/**
 * haversineKm — מרחק בק"מ בין שתי נקודות GPS (lat/lng) לפי נוסחת Haversine.
 * @param {{lat: number, lng: number}} a
 * @param {{lat: number, lng: number}} b
 * @returns {number}
 */
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

/**
 * calculatePathDistance — מרחק כולל בק"מ על פני נתיב GPS (סכום מקטעי Haversine).
 * @param {Array<{lat: number, lng: number}>} path
 * @returns {number}
 */
export function calculatePathDistance(path) {
  if (!Array.isArray(path) || path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineKm(path[i - 1], path[i]);
  }
  return total;
}
