/**
 * Checks if two sets of coordinates are within a given distance in metres.
 * Uses the Haversine formula.
 *
 * @param {number[]} coords1 - [longitude, latitude]
 * @param {number[]} coords2 - [longitude, latitude]
 * @param {number} maxDistanceMetres - Max allowed distance in metres
 * @returns {boolean}
 */
const isWithinRadius = (coords1, coords2, maxDistanceMetres = 100) => {
  const R = 6371000; // Earth radius in metres
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;

  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= maxDistanceMetres;
};

/**
 * Build a MongoDB $near geospatial query object.
 *
 * @param {number} lng
 * @param {number} lat
 * @param {number} maxDistanceMetres
 * @returns {Object} - MongoDB geospatial query
 */
const buildNearQuery = (lng, lat, maxDistanceMetres = 100) => ({
  $near: {
    $geometry: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    $maxDistance: maxDistanceMetres,
  },
});

module.exports = { isWithinRadius, buildNearQuery };
