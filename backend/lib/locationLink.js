/**
 * Generates a clickable OpenStreetMap link for a given latitude and longitude.
 * Used in SMS and anywhere a live location link is needed (no API key required).
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} Full OpenStreetMap URL
 */
export function generateLocationLink(latitude, longitude) {
  if (latitude == null || longitude == null || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return '';
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return '';
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

/** @deprecated Use generateLocationLink for OpenStreetMap. Kept for backwards compatibility. */
export function generateGoogleMapsLink(latitude, longitude) {
  return generateLocationLink(latitude, longitude);
}
